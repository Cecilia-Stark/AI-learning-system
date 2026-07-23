import React from "react";
import { useNavigate } from "react-router-dom";

const VideoPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#a3f7b5] to-[#7de2d1] p-10">
      <h2 className="text-3xl font-bold text-emerald-800 mb-8 text-center">
        🎓 AI 学习视频专区
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { title: "AI 基础入门", bvid: "BV1N7411F7tT" },
          { title: "神经网络原理", bvid: "BV1st411h7JZ" },
          { title: "CNN 实战", bvid: "BV1dJ411A7tz" },
          { title: "AI 案例讲解", bvid: "BV1xa4y1C7Kv" },
        ].map((v, i) => (
          <div key={i} className="bg-white/80 rounded-xl p-4 shadow-md">
            <h3 className="text-xl font-semibold text-emerald-700 mb-2">{v.title}</h3>
            <iframe
              src={`https://player.bilibili.com/player.html?bvid=${v.bvid}`}
              allowFullScreen
              frameBorder="0"
              className="w-full h-56 rounded-lg"
            ></iframe>
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <button
          onClick={() => navigate("/home")}
          className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
        >
          返回首页
        </button>
      </div>
    </div>
  );
};

export default VideoPage;
