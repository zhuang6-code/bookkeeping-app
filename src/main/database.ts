import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database
let DB_PATH: string

// ========== 分类数据 ==========
export interface Category {
  id: number
  name: string
  parent_id: number | null
  is_preset: number  // 1 = 预置分类（不可修改/删除），0 = 用户创建
}

export interface Expense {
  id: number
  amount: number       // 金额，单位：分
  category_id: number
  date: string         // YYYY-MM-DD
  note: string
  created_at: string
}

export interface ExpenseWithCategory extends Expense {
  category_name: string
  parent_category_name: string | null
  parent_category_id: number | null
}

// ========== 初始化数据库 ==========
export function initDatabase(): void {
  DB_PATH = path.join(app.getPath('userData'), 'bookkeeping.db')
  db = new Database(DB_PATH)

  // 开启 WAL 模式，提升性能
  db.pragma('journal_mode = WAL')

  // 创建分类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      is_preset INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    )
  `)

  // 创建账单表（金额以"分"为单位存储，避免浮点数精度问题）
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `)

  // 迁移：给旧数据库添加 is_preset 列（如果不存在）
  try {
    db.exec('ALTER TABLE categories ADD COLUMN is_preset INTEGER NOT NULL DEFAULT 0')
    // 如果成功（说明是旧数据库），已有分类都标记为预置
    db.exec('UPDATE categories SET is_preset = 1')
  } catch (e) {
    // 列已存在，无需处理
  }

  // 初始化分类数据（仅首次）
  const count = db.prepare('SELECT COUNT(*) as cnt FROM categories').get() as { cnt: number }
  if (count.cnt === 0) {
    seedCategories()
  }
}

// ========== 预置分类数据 ==========
function seedCategories(): void {
  const categories: { name: string; children: string[] }[] = [
    { name: '餐饮', children: ['早午晚餐', '零食饮料', '外卖', '聚餐聚会'] },
    { name: '交通', children: ['公交地铁', '打车', '加油充电', '停车费', '共享单车'] },
    { name: '住房', children: ['房租', '水电燃气', '物业费', '网费话费', '维修'] },
    { name: '购物', children: ['服饰鞋包', '数码产品', '家居日用', '美妆个护'] },
    { name: '医疗', children: ['看病挂号', '药品', '体检', '牙科眼科'] },
    { name: '教育', children: ['课程培训', '书籍资料', '考试报名'] },
    { name: '娱乐', children: ['游戏充值', '视频会员', '旅游出行', '运动健身'] },
    { name: '人情', children: ['送礼红包', '孝敬父母', '社交聚餐'] },
    { name: '工作', children: ['办公用品', '差旅住宿', '客户招待'] },
    { name: '其他', children: ['宠物', '捐款', '意外损失'] }
  ]

  const insertCat = db.prepare('INSERT INTO categories (name, parent_id, is_preset) VALUES (?, ?, 1)')
  const insertBatch = db.transaction(() => {
    for (const cat of categories) {
      const result = insertCat.run(cat.name, null)
      const parentId = result.lastInsertRowid
      for (const child of cat.children) {
        insertCat.run(child, parentId)
      }
    }
  })
  insertBatch()
}

// ========== 查询分类 ==========
export function getCategories(): Category[] {
  return db.prepare('SELECT * FROM categories ORDER BY id').all() as Category[]
}

// ========== 添加用户自定义分类 ==========
export function addCategory(name: string, parentId: number | null): { success: boolean; message: string; category?: Category } {
  if (!name || name.trim().length === 0) {
    return { success: false, message: '分类名称不能为空' }
  }
  const trimmedName = name.trim()
  // 检查同级下是否已存在同名分类
  const existing = db.prepare(
    'SELECT id FROM categories WHERE name = ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))'
  ).get(trimmedName, parentId, parentId) as Category | undefined
  if (existing) {
    return { success: false, message: '该级别下已存在同名分类' }
  }
  const result = db.prepare(
    'INSERT INTO categories (name, parent_id, is_preset) VALUES (?, ?, 0)'
  ).run(trimmedName, parentId)
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) as Category
  return { success: true, message: '添加成功', category }
}

// ========== 修改分类名称（仅用户创建的） ==========
export function updateCategory(id: number, name: string): { success: boolean; message: string } {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined
  if (!cat) {
    return { success: false, message: '分类不存在' }
  }
  if (cat.is_preset === 1) {
    return { success: false, message: '预置分类不可修改' }
  }
  if (!name || name.trim().length === 0) {
    return { success: false, message: '分类名称不能为空' }
  }
  const trimmedName = name.trim()
  // 检查同级下是否已存在同名分类（排除自己）
  const existing = db.prepare(
    'SELECT id FROM categories WHERE name = ? AND id != ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))'
  ).get(trimmedName, id, cat.parent_id, cat.parent_id) as Category | undefined
  if (existing) {
    return { success: false, message: '该级别下已存在同名分类' }
  }
  db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(trimmedName, id)
  return { success: true, message: '修改成功' }
}

// ========== 删除分类（仅用户创建的，且无账单记录） ==========
export function deleteCategory(id: number): { success: boolean; message: string } {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined
  if (!cat) {
    return { success: false, message: '分类不存在' }
  }
  if (cat.is_preset === 1) {
    return { success: false, message: '预置分类不可删除' }
  }
  // 检查是否有子分类
  const children = db.prepare('SELECT COUNT(*) as cnt FROM categories WHERE parent_id = ?').get(id) as { cnt: number }
  if (children.cnt > 0) {
    return { success: false, message: '该分类下还有子分类，请先删除子分类' }
  }
  // 尝试删除（外键约束会阻止有账单记录的分类被删除）
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    return { success: true, message: '删除成功' }
  } catch (e) {
    return { success: false, message: '该分类下有账单记录，无法删除' }
  }
}

// ========== 添加账单 ==========
export function addExpense(amount: number, categoryId: number, date: string, note: string): Expense {
  const result = db.prepare(
    'INSERT INTO expenses (amount, category_id, date, note) VALUES (?, ?, ?, ?)'
  ).run(amount, categoryId, date, note)
  return db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid) as Expense
}

// ========== 查询账单列表 ==========
export function getExpenses(
  page: number = 1,
  pageSize: number = 20,
  startDate?: string,
  endDate?: string
): { list: ExpenseWithCategory[]; total: number } {
  let where = 'WHERE 1=1'
  const params: any[] = []

  if (startDate) {
    where += ' AND e.date >= ?'
    params.push(startDate)
  }
  if (endDate) {
    where += ' AND e.date <= ?'
    params.push(endDate)
  }

  const countSql = `
    SELECT COUNT(*) as total FROM expenses e ${where}
  `
  const { total } = db.prepare(countSql).get(...params) as { total: number }

  const listSql = `
    SELECT
      e.*,
      c.name as category_name,
      pc.name as parent_category_name,
      pc.id as parent_category_id
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    LEFT JOIN categories pc ON c.parent_id = pc.id
    ${where}
    ORDER BY e.date DESC, e.created_at DESC
    LIMIT ? OFFSET ?
  `
  const list = db.prepare(listSql).all(...params, pageSize, (page - 1) * pageSize) as ExpenseWithCategory[]

  return { list, total }
}

// ========== 按月统计 ==========
export function getMonthlyStats(yearMonth: string): {
  totalAmount: number
  byCategory: { categoryName: string; amount: number; count: number }[]
} {
  // 按一级分类统计
  const byCategory = db.prepare(`
    SELECT
      pc.name as categoryName,
      SUM(e.amount) as amount,
      COUNT(*) as count
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    LEFT JOIN categories pc ON c.parent_id = pc.id
    WHERE strftime('%Y-%m', e.date) = ?
    GROUP BY pc.id
    ORDER BY amount DESC
  `).all(yearMonth) as { categoryName: string; amount: number; count: number }[]

  const totalResult = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as totalAmount
    FROM expenses
    WHERE strftime('%Y-%m', date) = ?
  `).get(yearMonth) as { totalAmount: number }

  return {
    totalAmount: totalResult.totalAmount,
    byCategory
  }
}

// ========== 删除账单 ==========
export function deleteExpense(id: number): boolean {
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id)
  return result.changes > 0
}

// ========== 导出数据库（用于备份） ==========
export function getDbPath(): string {
  return DB_PATH
}
