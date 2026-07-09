// 启动前清除 ELECTRON_RUN_AS_NODE 环境变量
// 如果系统设置了该变量，Electron 会以纯 Node.js 模式运行，无法使用窗口等 API
delete process.env.ELECTRON_RUN_AS_NODE

// 然后正常启动 electron-vite
const { execSync } = require('child_process')
const args = process.argv.slice(2).join(' ')

try {
  execSync(`npx electron-vite ${args}`, {
    stdio: 'inherit',
    env: process.env
  })
} catch (e) {
  process.exit(e.status || 1)
}
