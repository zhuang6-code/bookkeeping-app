# 记账 App

## 项目简介
一款基于 Electron 的跨平台桌面记账应用，支持 Windows 和 Mac 系统。

## 核心功能
1. 记录每一笔花销（金额、日期、备注）
2. 两级分类体系（一级大类 → 二级小类）
3. 查看历史账单
4. 按分类统计花销

## 技术栈
- Electron（桌面框架）
- React（前端框架）
- Ant Design（UI 组件库）
- SQLite（本地数据库）

## 分类体系

| 一级大类 | 二级小类 |
|----------|----------|
| 餐饮 | 早午晚餐、零食饮料、外卖、聚餐聚会 |
| 交通 | 公交地铁、打车、加油充电、停车费、共享单车 |
| 住房 | 房租、水电燃气、物业费、网费话费、维修 |
| 购物 | 服饰鞋包、数码产品、家居日用、美妆个护 |
| 医疗 | 看病挂号、药品、体检、牙科眼科 |
| 教育 | 课程培训、书籍资料、考试报名 |
| 娱乐 | 游戏充值、视频会员、旅游出行、运动健身 |
| 人情 | 送礼红包、孝敬父母、社交聚餐 |
| 工作 | 办公用品、差旅住宿、客户招待 |
| 其他 | 宠物、捐款、意外损失 |

## ⚠️ 重要规则（项目期内必须遵守）

**用户是非技术背景的小白，首次使用 Claude Code 和编程工具。**

因此，在整个项目开发过程中：

1. **任何技术决策都必须列出选项**：包括技术选型、工具选择、实现方式等，将各选项用通俗易懂的语言解释清楚，说明各自的优缺点。
2. **由用户做最终决定**：不能替用户做任何技术选择，必须将选项呈现给用户，让用户来选择。
3. **解释要通俗**：避免使用专业术语，或用类比/比喻来解释技术概念。
4. **进度可视化**：每个步骤完成后，用简洁的方式告知用户做了什么、现在项目处于什么状态。
5. **遇到报错不要慌**：向用户解释发生了什么、严重程度、接下来怎么办，由用户决定如何处理。

## 项目运行方式

```bash
# 开发模式（边写代码边预览）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run start

# 打包为 Windows 安装包
npm run package:win

# 打包为 Mac 安装包
npm run package:mac
```

## 已知问题与解决

### ELECTRON_RUN_AS_NODE 环境变量
- 用户电脑系统环境变量中设置了 `ELECTRON_RUN_AS_NODE=1`
- 该变量会导致 Electron 以纯 Node.js 模式运行，无法使用窗口等 Electron API
- 解决方案：通过 `scripts/run-electron.js` 在启动前自动清除该变量
- 如果以后重新安装 `node_modules`，需要先运行 `npx electron-rebuild` 重新编译原生模块

## 项目文件结构

```
记账app/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── index.ts    # 窗口创建、IPC 通信
│   │   └── database.ts # SQLite 数据库操作
│   ├── preload/        # 预加载脚本（桥接主进程和渲染进程）
│   │   └── index.ts
│   └── renderer/       # React 前端界面
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           └── components/
│               ├── AddExpense.tsx   # "记一笔"页面
│               ├── ExpenseList.tsx  # "账单"列表页面
│               └── Statistics.tsx   # "统计"页面
├── scripts/
│   └── run-electron.js  # 启动辅助脚本
├── resources/           # 应用图标
├── package.json
└── electron.vite.config.ts
```
