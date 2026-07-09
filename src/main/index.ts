import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { initDatabase, getCategories, addExpense, getExpenses, getMonthlyStats, deleteExpense } from './database'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: '记账',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 开发模式加载 vite 服务，生产模式加载打包文件
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// ========== 注册 IPC 通信 ==========
function registerIpc(): void {
  // 获取分类列表
  ipcMain.handle('get-categories', () => {
    return getCategories()
  })

  // 添加账单
  ipcMain.handle('add-expense', (_event, { amount, categoryId, date, note }) => {
    return addExpense(amount, categoryId, date, note)
  })

  // 获取账单列表
  ipcMain.handle('get-expenses', (_event, { page, pageSize, startDate, endDate }) => {
    return getExpenses(page, pageSize, startDate, endDate)
  })

  // 获取月度统计
  ipcMain.handle('get-monthly-stats', (_event, { yearMonth }) => {
    return getMonthlyStats(yearMonth)
  })

  // 删除账单
  ipcMain.handle('delete-expense', (_event, { id }) => {
    return deleteExpense(id)
  })
}

app.whenReady().then(() => {
  initDatabase()
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
