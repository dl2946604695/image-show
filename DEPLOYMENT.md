# 光影集 - 完全免费部署指南

本项目采用 **Vercel（前端）+ Render（后端）** 的完全免费部署方案。

## 📋 部署前准备

1. **GitHub 账号** - 用于代码托管和持续集成
2. **Vercel 账号** - 前端部署平台（可使用 GitHub 登录）
3. **Render 账号** - 后端部署平台（可使用 GitHub 登录）

## 💡 免费方案说明

| 平台 | 免费额度 | 限制 |
|------|---------|------|
| **Vercel** | 100GB 带宽/月 | 自动 HTTPS，自动部署 |
| **Render** | 750 小时/月，512MB RAM | 闲置 15 分钟后休眠，冷启动约 30 秒 |

## 🚀 部署步骤

### 第一步：推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit: 光影集前后端项目"
git branch -M main
git remote add origin https://github.com/你的用户名/image-show.git
git push -u origin main
```

### 第二步：后端部署到 Render

1. **访问 Render**
   - 打开 [render.com](https://render.com/)
   - 使用 GitHub 账号登录

2. **创建 Web Service**
   - 点击 "New +" → "Web Service"
   - 选择你的 `image-show` GitHub 仓库
   - 点击 "Connect"

3. **配置部署参数**
   - **Name**: `image-show-backend`
   - **Region**: 选择离你最近的区域（如 Oregon）
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Starter**（免费）
   - **Instance Type**: **Free**

4. **配置环境变量**
   - 点击 "Advanced" → "Add Environment Variable"
   - 添加以下变量：
     ```
     NODE_ENV=production
     PORT=10000
     JWT_SECRET=your-strong-secret-key-here
     CORS_ORIGIN=https://your-vercel-app.vercel.app
     ```
   - 点击 "Create Web Service"

5. **等待部署完成**
   - Render 会自动构建并部署
   - 部署完成后，复制生成的 URL（如：`https://image-show-backend.onrender.com`）

### 第三步：前端部署到 Vercel

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署前端**
   ```bash
   cd path/to/project
   vercel
   ```

4. **配置环境变量**
   - 在提示时输入：`VITE_API_URL`
   - 值：`https://你的后端URL.onrender.com/api`

5. **设置为生产环境**
   ```bash
   vercel --prod
   ```

### 第四步：配置 CORS

1. **更新 Render 环境变量**
   - 进入 Render 项目 → "Environment"
   - 更新 `CORS_ORIGIN` 为你的 Vercel 域名：
     ```
     CORS_ORIGIN=https://your-app.vercel.app
     ```

2. **重新部署后端**
   - 在 Render 点击 "Manual Deploy" → "Deploy latest commit"

## 🎯 快速部署脚本

```bash
echo "=== 光影集免费部署脚本 ==="
echo "1. 提交代码..."
git add .
git commit -m "deploy: 更新部署"
git push origin main

echo "2. 部署前端到 Vercel..."
vercel --prod

echo "3. 后端会自动从 GitHub 更新..."
echo "请在 Render 手动触发重新部署"

echo "=== 部署完成 ==="
echo "前端地址：https://your-app.vercel.app"
echo "后端地址：https://your-backend.onrender.com"
```

## 🔧 常见问题解决

### 1. 后端服务休眠
- **现象**: 长时间不访问后，首次请求变慢（约 30 秒）
- **解决**: Render 免费版特性，生产环境建议升级到付费方案

### 2. 跨域问题
- 确保 `CORS_ORIGIN` 包含你的 Vercel 域名
- 格式：`https://your-app.vercel.app`（不要加斜杠）

### 3. API 连接失败
- 检查 `VITE_API_URL` 是否正确
- 确认后端 URL 格式：`https://xxx.onrender.com/api`
- 测试后端健康检查：访问 `https://xxx.onrender.com/api/photos`

### 4. 图片上传失败
- Render 免费版使用临时文件系统
- 重启后上传的图片会丢失
- 建议集成云存储（如 Cloudinary）

### 5. 构建超时
- 增加 `buildCommand` 超时时间
- 优化 `tsconfig.json` 配置

## 📊 监控和维护

### 查看日志
- **Render 日志**: Render 项目 → "Logs"
- **Vercel 日志**: Vercel 项目 → "Logs"

### 更新部署
```bash
git add .
git commit -m "update: 新功能"
git push origin main

# Vercel 会自动部署
vercel --prod

# Render 需要手动部署或等待自动部署
```

## 🌐 域名配置（可选）

### Vercel 自定义域名
1. Vercel 项目 → Settings → Domains
2. 添加你的域名
3. 配置 DNS 记录

### Render 自定义域名
1. Render 项目 → Settings → Custom Domains
2. 添加自定义域名
3. 配置 CNAME 记录

## 🔒 安全建议

1. **使用强 JWT_SECRET**
   ```bash
   # 生成安全的密钥
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **启用 HTTPS**
   - Vercel 和 Render 都自动提供 HTTPS

3. **限制 CORS**
   - 生产环境只允许你的前端域名

4. **定期备份**
   - 数据库和文件存储建议备份

## 💰 成本估算

| 服务 | 费用 |
|------|------|
| **Vercel** | **完全免费** |
| **Render** | **完全免费** |
| **总计** | **$0** |

## 🚦 部署检查清单

- [ ] GitHub 仓库已创建并推送代码
- [ ] Render 后端已成功部署
- [ ] Render 环境变量已配置（JWT_SECRET, CORS_ORIGIN）
- [ ] Vercel 前端已成功部署
- [ ] 前端环境变量 `VITE_API_URL` 已设置
- [ ] CORS 配置正确
- [ ] 前后端通信测试通过
- [ ] 登录功能正常
- [ ] 图片上传功能正常

## ⚠️ 免费方案限制

1. **后端冷启动**: 首次访问可能需要等待 30 秒
2. **文件存储**: Render 免费版使用临时文件系统，重启后数据丢失
3. **内存限制**: 512MB RAM，处理大量请求时可能不够
4. **运行时间**: 750 小时/月，超过后服务暂停

## 📈 升级方案

当免费方案不够用时，可以升级到：

### Render 付费方案
- **Starter ($7/month)**: 1GB RAM, 无休眠, 自动 SSL
- **Pro ($20/month)**: 2GB RAM, 更高性能

### 替代方案
- **Cloudflare Pages**: 完全免费的前端托管
- **Fly.io**: 免费层 + 付费方案
- **DigitalOcean**: $6/month 起

---

**恭喜！你的网站现在可以完全免费让其他人访问了！** 🎉

---

*注意：Render 免费版服务会在闲置 15 分钟后自动休眠，这是正常现象。如果需要始终在线，建议升级到付费方案。*