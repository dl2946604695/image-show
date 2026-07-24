# 光影集 - 完全免费部署指南（纯 Vercel 方案）

本项目已改为纯 Vercel 部署，**不需要任何银行卡！**

## 📋 部署前准备

1. **GitHub 账号** - 用于代码托管
2. **Vercel 账号** - 完全免费，使用 GitHub 登录

## 🚀 部署步骤

### 第一步：访问 Vercel
打开：**https://vercel.com/**

### 第二步：登录
使用你的 **GitHub 账号**登录

### 第三步：导入项目
1. 点击 **"Add New..."** → **"Project"**
2. 在仓库列表中找到你的 `image-show` 仓库
3. 点击 **"Import"**

### 第四步：部署
1. 直接点击 **"Deploy"**
2. 等待部署完成（约 2-3 分钟）

### 第五步：完成！🎉
部署成功后，你会得到一个类似这样的网址：
```
https://image-show-xxx.vercel.app
```

## 💡 环境变量（可选）

如需自定义配置，在 Vercel 项目中添加以下环境变量：

```
JWT_SECRET=your-strong-secret-key-here
```

## 🔧 测试账号

部署完成后，你可以使用以下测试账号登录：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@example.com | 123456 |
| 用户 | user@example.com | 123456 |

## 📦 项目结构

```
image-show/
├── src/
│   ├── api/                # Vercel Serverless API
│   │   ├── auth/           # 认证相关 API
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── photos/         # 照片相关 API
│   │   │   ├── [id]/
│   │   │   ├── upload/
│   │   │   └── categories/
│   │   ├── store.ts        # 数据存储
│   │   └── jwt.ts          # JWT 工具
│   ├── components/         # 前端组件
│   ├── pages/              # 页面
│   ├── store/              # 状态管理
│   ├── lib/                # 工具函数
│   └── ...
├── vercel.json             # Vercel 配置
└── package.json
```

## 🚦 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] Vercel 项目已创建
- [ ] 部署成功完成
- [ ] 网站可以正常访问
- [ ] 登录功能正常
- [ ] 图片展示正常

## ⚠️ 免费方案限制

- **Vercel**: 100GB 带宽/月，无限流量
- **Serverless API**: 免费额度足够个人项目
- **数据存储**: 使用内存存储，重新部署后数据会重置

## 📈 升级方案

当免费方案不够用时：

### Vercel Blob（图片存储）
```bash
npm install @vercel/blob
```
在 Vercel 中启用 Blob Storage

### Vercel KV（数据库）
使用 Vercel KV 替代内存存储

---

**恭喜！你的网站现在可以完全免费让其他人访问了！** 🎉