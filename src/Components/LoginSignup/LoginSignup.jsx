import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginSignup.css";

const LoginSignup = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("请填写所有必填项！");
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert("两次密码不一致！");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      let users = JSON.parse(localStorage.getItem("users") || "[]");

      if (isLogin) {
        // 登录逻辑
        const user = users.find(u => u.email === formData.email);
        if (!user) {
          alert("用户不存在，请先注册！");
          return;
        }
        if (user.password !== formData.password) {
          alert("密码错误，请重新输入！");
          return;
        }

        // 登录成功
        localStorage.setItem("loggedIn", true);
        navigate("/home");

      } else {
        // 注册逻辑
        const exists = users.find(u => u.email === formData.email);
        if (exists) {
          alert("该邮箱已注册，请直接登录！");
          return;
        }

        users.push({ email: formData.email, password: formData.password });
        localStorage.setItem("users", JSON.stringify(users));

        alert("注册成功！请登录。");
        setIsLogin(true);
        setFormData({ email: "", password: "", confirmPassword: "" });
      }
    }, 1000);
  };

  return (
    <div className="login-page">
      {/* 背景动画 */}
      <div className="background">
        <div className="circle"></div>
        <div className="circle delay"></div>
      </div>

      {/* 标题 */}
      <div className="title">
        <h1>学 · 练 · 搭 AI 平台</h1>
        <p className="subtitle">Learning · Practicing · Building Your Own AI</p>
      </div>

      {/* 登录/注册表单 */}
      <div className="form-container glass-card">
        <h2 className="form-title">{isLogin ? "Login" : "Sign Up"}</h2>
        <form onSubmit={handleSubmit} className="form-content">
          <input
            type="email"
            name="email"
            placeholder="📧 Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="🔒 Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {!isLogin && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="🔒 Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          )}

          <button
            type="submit"
            className={`submit-btn ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? <span className="loader"></span> : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="toggle-text">
          {isLogin ? "没有账号？" : "已有账号？"}{" "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "注册" : "登录"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginSignup;
