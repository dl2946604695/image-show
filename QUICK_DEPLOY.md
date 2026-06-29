# 光影集 - 快速部署指南

## 🚀 最简单的部署方式（5分钟搞定）

### 第一步：部署前端（Netlify Drop - 完全免费）

1. 打开浏览器访问：**https://app.netlify.com/drop**
2. 找到你项目的 `dist` 文件夹：
   ```
   d:\Vibe Coding\Project\image_show\dist
   ```
3. **拖拽整个 `dist` 文件夹**到网页上
4. 等待几秒钟，部署完成！
5. 复制生成的网址（类似：`https://xxx.netlify.app`）

### 第二步：部署后端（Render - 完全免费）

1. 访问：**https://render.com/**
2. 用 GitHub 账号登录
3. 点击 **"New +"** → **"Web Service"**
4. 点击 **"Build and deploy from a Git repository"** → "Next"
5. 点击 **"Connect account"** 连接你的 GitHub
6. 点击 **"Configure account"** 授权
7. 选择你的仓库，点击 **"Connect"**

**配置参数：**
- **Name**: `image-show-backend`
- **Region**: 选离你最近的（如 Oregon）
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: **Free**

**点击 "Advanced" 添加环境变量：**
```
NODE_ENV=production
PORT=10000
JWT_SECRET=光影集超级密钥请替换为你自己的
CORS_ORIGIN=https://你的前端网址.netlify.app
```

点击 **"Create Web Service"** 等待部署完成。

### 第三步：连接前后端

1. **修改前端 API 地址**：
   - 在 Netlify 中，进入你的项目
   - 点击 **"Site settings"** → **"Build & deploy"** → **"Environment"**
   - 添加环境变量：
     ```
     Key: VITE_API_URL
     Value: https://你的后端网址.onrender.com/api
     ```
   
2. **重新部署前端**：
   - 点击 **"Deploys"** → **"Trigger deploy"** → **"Deploy site"**

### 第四步：完成！🎉

现在你可以通过 Netlify 的网址访问你的网站了！

---

## 💡 另一种方案：使用 Vercel

如果你更喜欢 Vercel：

1. 访问：**https://vercel.com/**
2. 用 GitHub 登录
3. 点击 **"Add New..."** → **"Project"**
4. 导入你的 GitHub 仓库
5. 配置环境变量 `VITE_API_URL`
6. 点击 **"Deploy"**

---

## ⚠️ 免费方案限制

- **Render 后端**: 闲置15分钟后休眠，首次访问约30秒延迟
- **Netlify**: 100GB带宽/月，完全够用
- **数据存储**: Render使用临时文件，重启后数据丢失

---

## 📞 遇到问题？

1. 检查 Render 的日志（Logs 标签页）
2. 检查 Netlify 的部署日志
3. 确认环境变量配置正确
4. 确认 CORS 配置正确

---

**祝你部署顺利！** 🚀