// ========== 通用类型定义 ==========

export interface Category {
  id: number
  name: string
  parent_id: number | null
  is_preset: number  // 1 = 预置，0 = 用户创建
}

export interface Expense {
  id: number
  amount: number
  category_id: number
  date: string
  note: string
  created_at: string
}

export interface ExpenseWithCategory extends Expense {
  category_name: string
  parent_category_name: string | null
  parent_category_id: number | null
}

export interface MonthlyStats {
  totalAmount: number
  byCategory: { categoryName: string; amount: number; count: number }[]
}

// 操作结果类型（用于分类增删改的返回）
export interface OpResult {
  success: boolean
  message: string
  category?: Category
}

// ========== API 接口 ==========
export interface AppAPI {
  getCategories: () => Promise<Category[]>
  addExpense: (data: { amount: number; categoryId: number; date: string; note: string }) => Promise<Expense>
  getExpenses: (params: {
    page: number
    pageSize: number
    startDate?: string
    endDate?: string
  }) => Promise<{ list: ExpenseWithCategory[]; total: number }>
  getMonthlyStats: (params: { yearMonth: string }) => Promise<MonthlyStats>
  deleteExpense: (id: number) => Promise<boolean>
  addCategory: (name: string, parentId: number | null) => Promise<OpResult>
  updateCategory: (id: number, name: string) => Promise<OpResult>
  deleteCategory: (id: number) => Promise<OpResult>
}

declare global {
  interface Window {
    api: AppAPI
  }
}
