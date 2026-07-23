import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// 页面组件
import LoginSignup from "./Components/LoginSignup/LoginSignup";
import HomePage from "./Components/HomePage/HomePage";
import DragAndDrop from "./Components/DragAndDrop/DragAndDrop";
import AITools from "./Components/AITools/AITools";
import Practice from "./Components/Practice/Practice";
import VideoPage from "./Components/VideoPage/VideoPage";

// 虚拟实训环境页面
import PythonLab from "./Components/VirtualLab/PythonLab";
import TFJSLab from "./Components/VirtualLab/TFJSLab";

// 私有路由，保证未登录不能访问主页和模块
const PrivateRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  return isLoggedIn ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 登录注册页 */}
        <Route path="/" element={<LoginSignup />} />

        {/* 主页面及各模块（登录后才能访问） */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/DragAndDrop"
          element={
            <PrivateRoute>
              <DragAndDrop />
            </PrivateRoute>
          }
        />
        <Route
          path="/AITools"
          element={
            <PrivateRoute>
              <AITools />
            </PrivateRoute>
          }
        />
        <Route
          path="/Practice"
          element={
            <PrivateRoute>
              <Practice />
            </PrivateRoute>
          }
        />
        <Route
          path="/VideoPage"
          element={
            <PrivateRoute>
              <VideoPage />
            </PrivateRoute>
          }
        />

        {/* 虚拟实训环境路由 */}
        <Route
          path="/lab/python"
          element={
            <PrivateRoute>
              <PythonLab />
            </PrivateRoute>
          }
        />
        <Route
          path="/lab/tfjs"
          element={
            <PrivateRoute>
              <TFJSLab />
            </PrivateRoute>
          }
        />

        {/* 未匹配路径重定向到登录页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
