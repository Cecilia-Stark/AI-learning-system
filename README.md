# 🌿 学 · 练 · 搭 一体化 AI 学习平台

> **一个让你「学算法、练模型、自由搭建网络」的可视化 AI 学习平台**  
> 结合了学习、实验与实践三大功能模块，致力于让人工智能学习更直观、更有趣！

---

## ✨ 功能特性

- 🧠 **算法学习**：简洁介绍机器学习与深度学习核心算法  
- 🎥 **学习视频**：Bilibili 嵌入播放，随时观看精选教学内容  
- 🧩 **拖拽平台**：使用 ReactFlow 可视化搭建深度学习网络  
- ⚙️ **AI 工具链**：模型训练、可视化、部署集于一体  
- 🏹 **小练习**：快速算法挑战，强化理解与应用  
- 🤖 **AI 助手**：带科技感的卡通人物，陪你学习与激励  

---

## 🖼️ 页面预览

> （你可以放截图或动图在这里）

| 登录页 | 主页 | 拖拽平台 |
|:--:|:--:|:--:|
| ![Login](docs/preview_login.png) | ![Home](docs/preview_home.png) | ![Drag](docs/preview_drag.png) |

---

## ⚙️ 项目结构
src/
├── App.js
├── index.js
├── index.css
├── Components/
│ ├── LoginSignup/
│ │ ├── LoginSignup.jsx
│ │ └── LoginSignup.css
│ ├── HomePage/
│ │ ├── HomePage.jsx
│ │ └── HomePage.css
│ ├── DragAndDrop/
│ │ ├── DragAndDrop.jsx
│ │ └── DragAndDrop.css
│ ├── AITools/
│ │ └── AITools.jsx
│ └── Practice/
│ └── Practice.jsx


---

## 📦 依赖安装

确保你安装了 **Node.js ≥ 18** 与 **npm ≥ 9**

然后在项目根目录运行：

```bash
npm install react react-dom react-router-dom reactflow framer-motion lucide-react axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install three @react-three/fiber @react-three/drei

🚀 启动项目
npm start
访问：

http://localhost:3000

构建生产版本：

npm run build

🧩 技术栈
类别	使用技术
前端框架	React 18
动画库	Framer Motion
图标库	Lucide React
拖拽系统	ReactFlow
样式	Tailwind CSS
网络请求	Axios
视频嵌入	Bilibili Iframe
交互助手	自定义 AI 卡通人物（未来接入 DeepSeek API）
🤖 后续规划

 接入 DeepSeek / OpenAI API 让 AI 助手智能化

 增加用户个人资料与学习进度存储

 拖拽平台导出模型 JSON

 集成在线代码沙盒（运行训练脚本）

💚 作者信息

Made with 💚 by Cecilia
📧 Contact: [your-email@example.com
]
🕊️ GitHub: your-github-link

🪄 License

This project is licensed under the MIT License.

🌱 “让学习 AI 像搭积木一样简单”


