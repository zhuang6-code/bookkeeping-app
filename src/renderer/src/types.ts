// ========== 通用类型定义 ==========

export interface Category {
  id: number
  name: string
  parent_id: number | null
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
}

declare global {
  interface Window {
    api: AppAPI
  }
}
