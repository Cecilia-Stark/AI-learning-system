import React from "react";

const AITools = ({ onBack }) => (
  <div className="min-h-screen bg-gradient-to-br from-[#a3f7b5] to-[#7de2d1] flex flex-col items-center justify-center">
    <h1 className="text-4xl font-bold text-emerald-800 mb-6">AI 工具链</h1>
    <p className="text-lg text-gray-700 mb-10">这里将展示各种 AI 实用工具与模型接口。</p>
    <button
      onClick={onBack}
      className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
    >
      返回主页
    </button>
  </div>
);

export default AITools;
