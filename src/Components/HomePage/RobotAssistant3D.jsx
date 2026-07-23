import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

const RobotModel = ({ modelPath }) => {
  const gltf = useGLTF(modelPath); // 加载 public/models/RobotAssistant3D.glb
  const ref = useRef();

  // 让机器人微微摆动
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.getElapsedTime()) * 0.2;
    }
  });

  return <primitive ref={ref} object={gltf.scene} scale={0.5} position={[0, -1.2, 0]} />;
};

const RobotAssistant3D = ({ message }) => {
  return (
    <div style={{
      position: "fixed",
      right: "20px",
      bottom: "20px",
      width: "200px",
      height: "250px",
      pointerEvents: "none", // 不阻挡点击
    }}>
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[0, 5, 5]} intensity={1} />
        <RobotModel modelPath="/models/RobotAssistant3D.glb" />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
      </Canvas>
      <div style={{
        position: "absolute",
        bottom: "-40px",
        width: "100%",
        textAlign: "center",
        background: "rgba(255,255,255,0.8)",
        borderRadius: "12px",
        padding: "5px",
        fontSize: "0.9rem",
        color: "#035c45",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
      }}>
        {message}
      </div>
    </div>
  );
};

export default RobotAssistant3D;
