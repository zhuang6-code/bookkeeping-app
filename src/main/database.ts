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

  const insertCat = db.prepare('INSERT INTO categories (name, parent_id) VALUES (?, ?)')
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
