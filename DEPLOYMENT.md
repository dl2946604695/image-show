# 光影集 · Cloudflare Pages 部署指南

本项目已改造为 **Cloudflare Pages** 部署：前端由 Vite 构建到 `dist/`，后端为 Cloudflare Pages Functions（`functions/` 目录，兼容 Workers 运行时）。

## 一、在 Cloudflare 控制台创建 KV 存储

后端用 KV 保存用户、照片、分类以及上传的图片字节，因此需要先建一个 KV 命名空间：

1. 打开 **Cloudflare 控制台 → Workers & Pages → KV**（或 **Storage → KV**）。
2. 点击 **Create a namespace**，名称填 `photo-store`，创建后会得到一个 **Namespace ID**。
3. 把该 ID 填到仓库根目录 `wrangler.toml` 里的 `id = "REPLACE_WITH_YOUR_KV_NAMESPACE_ID"`。

## 二、在 Pages 项目中绑定 KV 与环境变量

1. **Workers & Pages → 你的 Pages 项目 → Settings → Functions → KV namespace bindings**：
   - Variable name 填 `PHOTO_STORE`，选择刚才创建的 `photo-store` 命名空间。
2. （可选）**Settings → Environment variables**（或 Secrets）：
   - `JWT_SECRET`：自定义一个足够长的字符串，用于签发登录令牌（不填也有默认值，但生产环境建议设置）。
   - `WEGENT_API_KEY`：AI 对话使用的真实模型 Key（**不填则用内置示例回复**，对话功能仍可正常演示）。

## 三、用 GitHub Desktop 推送并部署

1. 在 GitHub Desktop 中 commit 并 push 到你的仓库（main 分支）。
2. Cloudflare Pages 会自动拉取代码并构建部署（首次需在 Pages 中 **Create a project** 并连接该仓库）。
3. 构建设置（一般会自动识别，必要时手动填）：
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`

部署完成后即可通过 `https://<你的项目>.pages.dev` 访问。

> Cloudflare Pages 会自动把前端路由（`/login`、`/upload`、`/agent` 等）回退到 `index.html`，直接访问/刷新这些地址都不会 404。

## 四、本地开发预览

```bash
# 安装依赖
npm install

# 本地启动前端（不含 Functions）
npm run dev

# 本地启动完整栈（前端 + Functions，需要已创建 KV 并填好 wrangler.toml 的 id）
npx wrangler pages dev
```

## 五、测试账号

首次启动后端会自动写入一个管理员账号：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@example.com | 123456 |

可在登录页直接登录；也可点击"注册"创建新账号。上传的照片会保存在 KV 中（`img:<id>` 键），通过 `/api/photos/<id>/image` 读取。

## 六、目录说明（与旧方案的关系）

- `functions/` —— **当前生效**的 Cloudflare Pages Functions 后端（auth / photos / upload / agent）。
- `src/` —— React 前端。
- `api/`、`vercel.json`、`backend/`、`server.cjs`、`QUICK_DEPLOY.md` —— 早期 Vercel / Netlify+Render 方案的遗留文件，已被 `functions/` 取代，部署时不会生效，可忽略或删除。
