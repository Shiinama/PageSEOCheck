<p align="center">
  <h1 align="center">ParallelFutureAI</h1>
</p>
<p align="center">
  基于 Next.js 15 与 Cloudflare 全生态的现代全栈应用，覆盖单体应用从内容、国际化到商业化的完整实践。
</p>

## 目录

- [✨ 特性速览](#-特性速览)
- [📦 技术栈](#-技术栈)
- [🏗️ 架构概览](#-架构概览)
- [🗂️ 项目结构](#-项目结构)
- [🚀 快速开始](#-快速开始)
- [🔧 常用脚本](#-常用脚本)
- [🔑 环境变量](#-环境变量)
- [🧪 开发流程](#-开发流程)
- [🌍 Cloudflare Pages 部署](#-cloudflare-pages-部署)
- [❓ 常见问题](#-常见问题)
- [💡 贡献](#-贡献)
- [📄 License](#-license)

## ✨ 特性速览

- **Cloudflare 全量整合**：开箱即用的 Pages + Workers + AI + R2 + D1 + Durable Objects + Cron Triggers 配置，结合 OpenNext 在 Edge 运行 Next.js。
- **Next.js 全栈最佳实践**：App Router、Server Actions、流式渲染、渐进式增强、客户端体验优化与 Turbopack 开发体验。
- **内容与 SEO 能力**：Markdown 内容体系、Vditor 编辑器联动、结构化数据、批量 AI 文章生成脚本与全站 SEO 预设。
- **全球化与本地化**：基于 `next-intl` 的多语言路由、消息包与翻译 CLI，支持自动补全缺失文案与批量删除冗余键。
- **轻量化体验**：当前版本聚焦免费广告投放展示，临时移除了订单、订阅与 Token 计费逻辑。
- **AI 生图体验**：封装 Cloudflare Workers AI 图像生成能力，快速产出广告素材，支持 Turnstile 验证保护资源。
- **自动化运维**：一键部署脚本（`pnpm deploy:c`）串联数据库迁移、密钥同步、Pages 发布，内含环境变量校验。
- **可观测与扩展**：Durable Object 计数器示例、R2 缓存、KV 可选配置，兼容 Cloudflare Logs；利用 `global.ts` 扩展运行时依赖。

## 📦 技术栈

- **Web 框架**：Next.js 15、React 19
- **数据库**：Cloudflare D1、Drizzle ORM、Drizzle Studio
- **存储与缓存**：Cloudflare R2、KV（可选）、Durable Objects
- **身份与业务**：NextAuth、Drizzle schema、React Hook Form
- **UI & 内容**：Tailwind CSS、shadcn/ui、Vditor、markdown-to-jsx、Lucide Icons
- **AI 能力**：Cloudflare AI binding、Google GenAI
- **工程工具**：TypeScript、ESLint、Prettier、Turbopack、tsx、Wrangler、OpenNext for Cloudflare

## 🏗️ 架构概览

- **运行时**：Next.js 应用由 OpenNext 构建为 Cloudflare Workers。
- **数据层**：D1 作为主数据库，Drizzle 负责 schema 与迁移；R2 用于缓存/静态资产，KV 用于配置存储（可选）。
- **状态与任务**：Durable Objects 提供缓存队列、标签缓存与业务计数器示例；Cron 触发器支持分钟级任务调度。
- **AI 管道**：通过 `lib/ai.ts` 封装使用 Cloudflare AI 与 Google GenAI，统一 Worker 运行时上下文。
- **部署流程**：`scripts/deploy/index.ts` 串联环境校验、.env 生成、远程迁移、Secrets 同步与 Pages 发布，实现 CI/CD 友好流程。

## 🗂️ 项目结构

```
├─ app/                 # App Router 页面、API 与布局
├─ actions/             # Server Actions 与业务用例（订单、订阅等）
├─ components/          # UI 组件与 shadcn 自定义封装
├─ lib/                 # 数据库、AI、存储、认证等公共库
├─ scripts/             # 部署、数据库、i18n 等自动化脚本
├─ messages/            # 多语言文案源文件
├─ durable/             # Durable Object 实现示例
├─ migrations/          # Drizzle 迁移记录
├─ worker.ts            # Cloudflare Worker 入口（含 Cron 任务）
└─ wrangler.jsonc       # Cloudflare 基础配置
```

## 🚀 快速开始

1. **准备环境**
   - Node.js ≥ 20
   - pnpm ≥ 9
   - Cloudflare 账户与 API Token（Pages, D1, R2, AI 权限）

2. **克隆与安装**

   ```bash
   git clone <your-repo-url> parallelfutureai
   cd parallelfutureai
   pnpm install
   ```

3. **配置 Cloudflare 资源**
   - 在 `wrangler.jsonc` 中更新 D1 数据库名称/ID，配置 R2、KV、Durable Object 等绑定。
   - 如果尚未创建资源，可使用 `wrangler d1 create`、`wrangler r2 bucket create` 等命令。

4. **初始化环境变量**
   ```bash
   cp .env.example .env.local
   ```
   根据需求填写下方变量（ 部署时推荐保持 `.env` 与 `.env.local` 同步）。

## 🔧 常用脚本

| 脚本                          | 说明                                       |
| ----------------------------- | ------------------------------------------ |
| `pnpm dev`                    | 启动本地开发（Turbopack）                  |
| `pnpm build` / `pnpm preview` | 构建并在本地模拟 Cloudflare 运行时         |
| `pnpm cf-typegen`             | 根据 Worker 绑定生成 TypeScript 类型       |
| `pnpm db:migrate-local`       | 本地数据库迁移（依赖 Wrangler SQLite）     |
| `pnpm db:migrate-remote`      | 远程 D1 迁移                               |
| `pnpm db:studio:local`        | 打开本地 Drizzle Studio                    |
| `pnpm i18n:translate`         | 自动补齐缺失文案（支持多语言筛选与排除键） |
| `pnpm deploy:c`               | 一键校验环境、迁移数据库并部署到 Pages     |

## 🔑 环境变量

### 基础

- `NEXT_PUBLIC_BASE_URL`：站点根地址
- `AUTH_SECRET`：NextAuth Session 加密密钥
- `NEXT_PUBLIC_ADMIN_ID`：管理员 ID（示例：控制后台访问）

### Cloudflare

- `CLOUDFLARE_API_TOKEN`：用于 API 操作的 Token
- `CLOUDFLARE_ACCOUNT_ID`：账户 ID
- `PROJECT_NAME`：Cloudflare Pages 项目名
- `DATABASE_NAME` / `DATABASE_ID`：D1 数据库标识
- `KV_NAMESPACE_NAME` / `KV_NAMESPACE_ID`：KV 命名空间（可选）
- `NEXT_PUBLIC_R2_DOMAIN`：R2 静态资源访问域（如使用）

### AI 与第三方

- `GMI_API_KEY`：Google GenAI API Key
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`：前端 Turnstile 验证用站点密钥
- `TURNSTILE_SECRET_KEY`：服务端 Turnstile 验证密钥
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`：Google OAuth 登录
- `AUTH_RESEND_KEY`：Resend 邮件服务

> `scripts/deploy/index.ts` 会确保关键变量齐全，并将 `.env` 中的运行时变量批量推送至 Pages Secret。

## 🧪 开发流程

1. `pnpm dev` 启用本地环境，默认 `http://localhost:3000`。
2. 使用 `pnpm db:migrate-local` 保持 D1 schema 与迁移一致；必要时执行 `pnpm db:seed` 初始化数据。
3. 借助 `pnpm lint` 与 `pnpm format` 保持代码风格统一。
4. I18n 文案可通过 `pnpm i18n:list` 查看可用语言，`pnpm i18n:keys` 产出缺失键。
5. 本地验证 Workers 逻辑可使用 `pnpm preview` 或 `wrangler dev`。

## 🌍 Cloudflare Pages 部署

1. 先执行快速开始的 1~4 步。
2. 运行 `pnpm db:migrate-remote` 更新远程 D1。
3. `pnpm deploy:c` 或 `pnpm run deploy` 将产物发布到 Pages/Workers。
4. 若需要仅上传静态资产，可使用 `pnpm upload`；需预览可运行 `pnpm preview`。

## ❓ 常见问题

- **如何获取 `CLOUDFLARE_ACCOUNT_ID` 与 `CLOUDFLARE_API_TOKEN`？**
  1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com)
  2. 在左下角复制 Account ID
  3. 点击头像进入 Profile → API Tokens
  4. 新建自定义 Token，授予 Pages、Workers、KV、D1、R2 所需权限
  5. Token 仅展示一次，请妥善保存
- **出现 D1 权限错误怎么办？**
  确认 API Token 已包含 `Account.D1:Edit`，并在 `wrangler.jsonc` 内使用正确的 `database_name`。
- **Cron 作业不执行？**
  确保在 `wrangler.jsonc` 中配置 `triggers.crons`，并已在 Cloudflare Dashboard 中启用 Worker 定时任务。
- **AI 调用失败？**
  检查 `cloudflare.env` 或 Secrets 中是否配置 `AI` 绑定，以及外部服务（例如 Google GenAI、Turnstile）的秘钥是否有效。

## 💡 贡献

欢迎通过 Issue、Discussion 或 Pull Request 反馈问题、提出改进或补充新的 Cloudflare/AI 集成实践。

## 📄 License

本项目使用 [MIT](LICENSE) 许可证。
