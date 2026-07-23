import React, { useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

export default function TrainingPanel({ nodes, edges, dataset }) {
  const [isTraining, setIsTraining] = useState(false);
  const [accuracyData, setAccuracyData] = useState([]);
  const [lossData, setLossData] = useState([]);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const ws = useRef(null);

  // 保存节点高亮状态
  const [activeNodeId, setActiveNodeId] = useState(null);

  const handleStartTraining = () => {
    setIsTraining(true);
    setAccuracyData([]);
    setLossData([]);
    setCurrentEpoch(0);

    // 假设用 WebSocket 与后端交互
    ws.current = new WebSocket("ws://localhost:5000/train");
    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ nodes, edges, dataset }));
    };

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      // msg = { epoch, acc, loss, activatedNodeId }

      setCurrentEpoch(msg.epoch);
      setAccuracyData((prev) => [...prev, msg.acc]);
      setLossData((prev) => [...prev, msg.loss]);

      // 节点高亮动画
      if (msg.activatedNodeId) {
        setActiveNodeId(msg.activatedNodeId);
        setTimeout(() => setActiveNodeId(null), 300); // 300ms 高亮消失
      }
    };

    ws.current.onclose = () => setIsTraining(false);
  };

  const chartData = {
    labels: accuracyData.map((_, idx) => idx + 1),
    datasets: [
      { label: "Accuracy", data: accuracyData, borderColor: "#49d1b7", fill: false },
      { label: "Loss", data: lossData, borderColor: "#f06c9b", fill: false },
    ],
  };

  return (
    <div className="training-panel">
      <h3>🚀 模型训练</h3>
      <p>当前数据集: {dataset}</p>
      <button disabled={isTraining} onClick={handleStartTraining}>
        {isTraining ? `训练中... Epoch ${currentEpoch}` : "开始训练"}
      </button>

      <div className="chart-container" style={{ height: "300px", marginTop: "20px" }}>
        <Line data={chartData} />
      </div>

      {/* 节点高亮演示 */}
      <div className="node-animation">
        {nodes.map((n) => (
          <div
            key={n.id}
            style={{
              margin: "5px",
              padding: "5px 10px",
              display: "inline-block",
              borderRadius: "5px",
              backgroundColor: activeNodeId === n.id ? "#49d1b7" : "#e0f7f2",
              color: activeNodeId === n.id ? "#fff" : "#000",
              transition: "background-color 0.2s",
            }}
          >
            {n.data.label}
          </div>
        ))}
      </div>
    </div>
  );
}
