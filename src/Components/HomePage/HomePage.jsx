import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Stage, OrbitControls, useGLTF } from "@react-three/drei";
import "../HomePage/HomePage.css";

// 封装机器人组件
const Robot3D = ({ modelPath, scale = 0.6 }) => {
  const gltf = useGLTF(modelPath);
  return <primitive object={gltf.scene} scale={[scale, scale, scale]} />;
};

const HomePage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const messages = [
    "你今天也要加油哦！💪",
    "相信自己，你最棒！✨",
    "AI 学习路上，步步为营！🚀",
    "Keep going! 每天进步一点点！📈",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const modules = [
    { name: "拖拽平台", desc: "Drag & Build", link: "/DragAndDrop" },
    { name: "AI 工具链", desc: "AI Toolbox", link: "/AITools" },
    { name: "小练习", desc: "Quick Challenge", link: "/Practice" },
    { name: "学习视频", desc: "Learning Videos", link: "/VideoPage" },
  ];

  return (
    <div className="homepage-container">
      {/* Hero */}
      <section className="homepage-hero">
        <h1 className="hero-title">欢迎来到 学 · 练 · 搭 一体化 AI 学习平台</h1>
        <p className="hero-subtitle">
          在这里，你可以学习人工智能算法、练习模型搭建，并快速上手深度学习！
        </p>
      </section>

      {/* 模块按钮 */}
      <section className="modules-section">
        {modules.map((mod, i) => (
          <div key={i} className="module-card" onClick={() => navigate(mod.link)}>
            <h3>{mod.name}</h3>
            <p>{mod.desc}</p>
          </div>
        ))}
      </section>

      {/* AI 入门视频 */}
      <section className="video-section">
        <h3>AI 入门小视频</h3>
        <div className="video-thumbnail">
          <iframe
            src="https://www.bilibili.com/video/BV13HWGzcEh3/?spm_id_from=333.337.search-card.all.click"
            title="吴恩达 AI 入门"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>
      </section>

      {/* 机器人 */}
      <div className="robot-container">
        <Canvas className="robot-wrapper">
          <Stage environment="city" intensity={0.5}>
            <Robot3D modelPath="/models/RobotAssistant3D.glb" scale={0.6} />
          </Stage>
          <OrbitControls enablePan={true} enableZoom={true} />
        </Canvas>
        <div className="robot-message">{message}</div>
      </div>
    </div>
  );
};

export default HomePage;
