import React from "react";

const Practice = ({ onBack }) => (
  <div className="min-h-screen bg-gradient-to-br from-[#a3f7b5] to-[#7de2d1] flex flex-col items-center justify-center">
    <h1 className="text-4xl font-bold text-emerald-800 mb-6">小练习</h1>
    <p className="text-lg text-gray-700 mb-10">在这里进行一些轻量的AI实战训练吧！</p>
    <button
      onClick={onBack}
      className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
    >
      返回主页
    </button>
  </div>
);

export default Practice;
