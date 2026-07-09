import { contextBridge, ipcRenderer } from 'electron'

// 通过 contextBridge 向渲染进程暴露安全的 API
contextBridge.exposeInMainWorld('api', {
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addExpense: (data: { amount: number; categoryId: number; date: string; note: string }) =>
    ipcRenderer.invoke('add-expense', data),
  getExpenses: (params: { page: number; pageSize: number; startDate?: string; endDate?: string }) =>
    ipcRenderer.invoke('get-expenses', params),
  getMonthlyStats: (params: { yearMonth: string }) =>
    ipcRenderer.invoke('get-monthly-stats', params),
  deleteExpense: (id: number) => ipcRenderer.invoke('delete-expense', { id }),
  addCategory: (name: string, parentId: number | null) =>
    ipcRenderer.invoke('add-category', { name, parentId }),
  updateCategory: (id: number, name: string) =>
    ipcRenderer.invoke('update-category', { id, name }),
  deleteCategory: (id: number) =>
    ipcRenderer.invoke('delete-category', { id })
})
