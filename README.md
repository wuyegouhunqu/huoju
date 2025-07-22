# 火炬计算器 - 打包使用说明

## 📋 概述

火炬之光无限计算辅助工具，支持多种运行和打包方式。

## 🚀 快速开始

### 方式一：直接运行（推荐新手）

1. 双击 `start_app.bat` 文件
2. 如果提示缺少Python，请先安装Python
3. 程序会自动在浏览器中打开

### 方式二：安装依赖后运行

1. 双击 `install_dependencies.bat` 安装依赖
2. 双击 `start_app.bat` 启动程序

## 📦 打包成EXE文件

### 方法一：Python + PyInstaller（推荐）

1. 确保已安装Python 3.8+
2. 运行依赖安装脚本：
   ```
   双击 install_dependencies.bat
   ```
3. 运行打包脚本：
   ```
   python build_app.py
   ```
4. 打包完成后，exe文件在 `dist` 文件夹中

### 方法二：Electron（需要Node.js）

1. 安装Node.js（https://nodejs.org/）
2. 在命令行中运行：
   ```bash
   npm install
   npm run build-win
   ```
3. exe文件在 `dist` 文件夹中

## 📁 文件说明

| 文件名 | 用途 |
|--------|------|
| `index.html` | 主页面文件 |
| `styles.css` | 样式文件 |
| `script.js` | 脚本文件 |
| `app.py` | Python Web服务器 |
| `main.js` | Electron主进程文件 |
| `package.json` | Node.js项目配置 |
| `build_app.py` | Python打包脚本 |
| `start_app.bat` | 快速启动脚本 |
| `install_dependencies.bat` | 依赖安装脚本 |

## 🔧 系统要求

### 运行要求
- Windows 7/8/10/11
- Python 3.8+ 或 Node.js 16+
- 现代浏览器（Chrome、Firefox、Edge等）

### 打包要求
- Python 3.8+ 和 PyInstaller
- 或 Node.js 16+ 和 Electron

## 🐛 常见问题

### Q: 双击start_app.bat没有反应
A: 请确保已安装Python，可以先运行install_dependencies.bat

### Q: 打包失败
A: 检查是否安装了所有依赖，确保网络连接正常

### Q: exe文件无法运行
A: 检查杀毒软件是否拦截，尝试添加到白名单

### Q: 浏览器没有自动打开
A: 手动访问 http://localhost:5000 或 http://localhost:8000

## 📞 技术支持

如果遇到问题，请检查：
1. Python是否正确安装
2. 防火墙设置
3. 杀毒软件设置
4. 网络连接状态

## 📄 许可证

MIT License - 可自由使用和修改

---

**享受游戏，合理使用工具！** 🎮