import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges
} from "reactflow";
import "reactflow/dist/style.css";
import "./DragAndDrop.css";
const datasetInfo = {
  "鸢尾花 (Iris)": {
    description: "鸢尾花数据集包含 150 个样本，分为 3 类，每类 50 个样本。每个样本有 4 个特征：花萼长度、花萼宽度、花瓣长度、花瓣宽度。",
    size: "150 样本",
    classes: "3 类 (Setosa, Versicolor, Virginica)"
  },
  "MNIST 手写数字": {
    description: "MNIST 数据集包含 70000 张手写数字图片（0-9），每张图片 28x28 灰度像素。",
    size: "60000 训练 + 10000 测试",
    classes: "10 个数字类别 (0-9)"
  }
};

const BACKEND_URL = "http://localhost:5000/train";

/*
修复/改动说明（重要）：
1. 修复数据集 -> 第一个操作 未自动连线的问题：
   - 新节点为 Operation 时，优先寻找最近的 Dataset（如果有），将 edge 从该 dataset 连接到 newNode。
   - 如果没有 dataset，则按原逻辑从上一个 operation 节点连线（保持链式结构）。
2. 将 code-gen / floating UI / 弹窗移动到 drag-container 外层，避免破坏三栏布局。
3. 增加复制生成代码功能（clipboard）。
4. 保留你的动画、handleTrain 和发送给后端的 JSON 结构。
*/

const nodeTypesList = [
  { type: "Dataset", label: " 鸢尾花 (Iris)" },
  { type: "Dataset", label: " MNIST 手写数字" },
  { type: "Operation", label: "卷积层 Conv2D" },
  { type: "Operation", label: "池化层 Pooling" },
  { type: "Operation", label: "展平层 Flatten" },
  { type: "Operation", label: "激活层 Activation" },
  { type: "Operation", label: "全连接层 Dense" }
];

const layerInfo = {
   "鸢尾花 (Iris)": {
    description: "鸢尾花数据集包含 150 个样本，分为 3 类，每类 50 个样本。每个样本有 4 个特征：花萼长度、花萼宽度、花瓣长度、花瓣宽度。",
    size: "150 样本",
    classes: "3 类 (Setosa, Versicolor, Virginica)"
  },
  "MNIST 手写数字": {
    description: "MNIST 数据集包含 70000 张手写数字图片（0-9），每张图片 28x28 灰度像素。",
    size: "60000 训练 + 10000 测试",
    classes: "10 个数字类别 (0-9)"
  },
  "卷积层 Conv2D": {
    description: "卷积层通过卷积核提取输入特征，保留空间信息。",
    formula: "输出 = 输入 * 卷积核 + 偏置"
  },
  "池化层 Pooling": {
    description: "池化层下采样特征图，减少计算量，常用最大池化 MaxPool 或平均池化 AvgPool。",
    formula: "输出 = max(局部区域) 或 avg(局部区域)"
  },
  "展平层 Flatten": {
    description: "展平层将多维特征图展开为一维向量，便于全连接层处理。",
    formula: "输出 = reshape(输入)"
  },
  "全连接层 Dense": {
    description: "全连接层将上一层的特征与神经元全连接，进行线性组合后激活。",
    formula: "输出 = 激活(Σ(权重*输入) + 偏置)"
  },
  "激活层 Activation": {
    description: "增加非线性能力，使模型可以拟合复杂函数。",
    formula: "输出 = 激活函数(输入)"
  }
};

function useAnimationFrame() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setFrame(f => f + 1), 50);
    return () => clearInterval(interval);
  }, []);
  return frame;
}

export default function DragAndDrop() {
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [codeType, setCodeType] = useState("python"); // python 或 tfjs
  const [generatedCode, setGeneratedCode] = useState(""); // 存储生成的代码文本
  const [showLangPanel, setShowLangPanel] = useState(false);
  const [showPostActions, setShowPostActions] = useState(false);

  const frame = useAnimationFrame();

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: "#49d1b7" } }, eds)
      ),
    []
  );
  const onNodeClick = (e, node) => setSelectedNode(node);
  const handleDelete = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setSelectedNode(null);
  };

  const updateParam = (field, value) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id ? { ...n, data: { ...n.data, [field]: value } } : n
      )
    );
    setSelectedNode((prev) =>
      prev ? { ...prev, data: { ...prev.data, [field]: value } } : prev
    );
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // 修复后的 onDrop：当拖入 Operation 时优先连接到最近的 Dataset（如果有），否则连接到上一个非 Dataset 节点
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      const label = event.dataTransfer.getData("label");
      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const x = event.clientX - reactFlowBounds.left;
      const y = event.clientY - reactFlowBounds.top;
      if (!reactFlowInstance.current) return;
      const position = reactFlowInstance.current.project({ x, y });

      const newNode = { id: `${type}-${Date.now()}`, type: "default", position, data: { label } };

      setNodes((nds) => {
        // 将新节点加入 nodes 列表
        const newNodes = [...nds, newNode];

        // 如果新节点是 Dataset，则暂时不自动连线（dataset 本身通常是起点）
        if (type === "Dataset") {
          return newNodes;
        }

        // 新节点是 Operation 时：
        // 1) 优先寻找最近的 Dataset（从后往前找）
        // 新节点是 Operation 时：优先连到上一个 Operation
const lastOperation = [...nds].reverse().find(
  n => n.data && n.data.label && !n.data.label.includes("数据集")
);

if (lastOperation) {
  setEdges((eds) =>
    addEdge(
      {
        id: `e-${lastOperation.id}-${newNode.id}`,
        source: lastOperation.id,
        target: newNode.id,
        animated: true,
        style: { stroke: "#49d1b7" }
      },
      eds
    )
  );
} else {
  // 没有 Operation 的情况下，连到最近的 Dataset（保底）
  const lastDataset = [...nds].reverse().find(n => n.data && n.data.label && n.data.label.includes("数据集"));
  if (lastDataset) {
    setEdges((eds) =>
      addEdge(
        {
          id: `e-${lastDataset.id}-${newNode.id}`,
          source: lastDataset.id,
          target: newNode.id,
          animated: true,
          style: { stroke: "#49d1b7" }
        },
        eds
      )
    );
  }
}

        // 2) 如果没有 dataset，则按原逻辑：连接到最后一个非 dataset 节点（保持链式）
        const lastNonDataset = [...nds].reverse().find((n) => !(n.data && n.data.label && n.data.label.includes("数据集")));
        if (lastNonDataset) {
          setEdges((eds) =>
            addEdge(
              {
                id: `e-${lastNonDataset.id}-${newNode.id}`,
                source: lastNonDataset.id,
                target: newNode.id,
                animated: true,
                style: { stroke: "#49d1b7" }
              },
              eds
            )
          );
        }

        return newNodes;
      });
    },
    [reactFlowInstance]
  );

  const handleTrain = async () => {
    if (!nodes.length) return alert("请先搭建网络结构！");
    const layerConfigs = nodes
      .filter((n) => !n.data.label.includes("数据集"))
      .map((n) => {
        const label = n.data.label;
        if (label.includes("卷积层")) return { type: "Conv2D", filters: 32, kernel_size: Number(n.data.kernel||3), stride: Number(n.data.stride||1), activation: n.data.activation||"relu" };
        if (label.includes("池化层")) return { type: "Pooling", pool_type: n.data.pool_type||"MaxPool", pool_size: Number(n.data.pool_size||2) };
        if (label.includes("展平层")) return { type: "Flatten" };
        if (label.includes("全连接层")) return { type: "Dense", units: Number(n.data.units||64), activation: n.data.activation||"relu" };
        if (label.includes("激活层")) return { type: "Activation", activation: n.data.activation||"relu" };
        return null;
      }).filter(Boolean);

    try {
      alert("🚀 模型训练中...");
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layers: layerConfigs, optimizer: "adam", loss: "categorical_crossentropy", epochs: 5 })
      });
      if (!res.ok) throw new Error("服务器异常");
      const result = await res.json();
      console.log(result);
      alert("✅ 模型训练完成！");
    } catch(err) {
      console.error(err);
      alert("训练失败！");
    }
  };
const generateCode = (optCodeType = null) => {
  if (!nodes.length) {
    alert("请先搭建结构再生成代码！");
    return;
  }

  if (optCodeType) setCodeType(optCodeType);

  const layersConfigs = nodes
    .filter(n => !n.data.label.includes("数据集"))
    .map(n => ({ label: n.data.label, params: n.data }));

  let code = "";
  const targetType = optCodeType || codeType;

  // ---------------- Python 代码生成 ----------------
  if (targetType === "python") {
    let firstLayerAdded = false;
    code += `import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.datasets import mnist
from tensorflow.keras.utils import to_categorical
import matplotlib.pyplot as plt

# ========== 数据集加载 ==========
(X_train, y_train), (X_test, y_test) = mnist.load_data()
X_train = X_train.reshape((-1,28,28,1)).astype('float32') / 255.0
X_test = X_test.reshape((-1,28,28,1)).astype('float32') / 255.0
y_train = to_categorical(y_train, 10)
y_test = to_categorical(y_test, 10)

# ========== 模型构建 ==========
model = models.Sequential()\n`;

    layersConfigs.forEach(layer => {
      const { label, params } = layer;

      if (label.includes("卷积层")) {
        const filters = params.filters || 32;
        const kernel = params.kernel || 3;
        const stride = params.stride || 1;
        const activation = params.activation || "relu";
        if (!firstLayerAdded) {
          code += `model.add(layers.Conv2D(${filters}, (${kernel},${kernel}), strides=${stride}, activation='${activation}', input_shape=(28,28,1)))\n`;
          firstLayerAdded = true;
        } else {
          code += `model.add(layers.Conv2D(${filters}, (${kernel},${kernel}), strides=${stride}, activation='${activation}'))\n`;
        }
      } else if (label.includes("池化层")) {
        const pool = params.pool_size || 2;
        const poolType = params.pool_type || "MaxPool";
        code += poolType === "MaxPool"
          ? `model.add(layers.MaxPooling2D((${pool},${pool})))\n`
          : `model.add(layers.AveragePooling2D((${pool},${pool})))\n`;
      } else if (label.includes("展平层")) {
        code += "model.add(layers.Flatten())\n";
      } else if (label.includes("全连接层")) {
        const units = params.units || 64;
        const activation = params.activation || "relu";
        code += `model.add(layers.Dense(${units}, activation='${activation}'))\n`;
      } else if (label.includes("激活层")) {
        const activation = params.activation || "relu";
        code += `model.add(layers.Activation('${activation}'))\n`;
      }
    });

    code += "model.add(layers.Dense(10, activation='softmax'))  # 输出层\n\n";
    code += "model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])\n";
    code += "model.summary()\n\n";

    // ---------------- 训练 ----------------
    code += `history = model.fit(
    X_train, y_train,
    validation_data=(X_test, y_test),
    epochs=5, batch_size=32
)\n\n`;

    // ---------------- 绘制静态训练曲线 ----------------
    code += `# 绘制训练和验证准确率/损失曲线
plt.figure(figsize=(12,5))

plt.subplot(1,2,1)
plt.plot(history.history['accuracy'], 'b-o', label='train acc')
plt.plot(history.history['val_accuracy'], 'r-o', label='val acc')
plt.title('Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()

plt.subplot(1,2,2)
plt.plot(history.history['loss'], 'b-o', label='train loss')
plt.plot(history.history['val_loss'], 'r-o', label='val loss')
plt.title('Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()

plt.savefig("training_result.png")  # 保存静态图片
plt.show()
`;
  }

  // ---------------- TensorFlow.js 代码生成 ----------------
  if (targetType === "tfjs") {
    code += "import * as tf from '@tensorflow/tfjs';\n\n";
    code += "const model = tf.sequential();\n\n";

    layersConfigs.forEach(layer => {
      const { label, params } = layer;

      if (label.includes("卷积层")) {
        const filters = params.filters || 32;
        const kernel = params.kernel || 3;
        const stride = params.stride || 1;
        const activation = params.activation || "relu";
        code += `model.add(tf.layers.conv2d({filters: ${filters}, kernelSize: ${kernel}, strides: ${stride}, activation: '${activation}', inputShape: [28,28,1]}));\n`;
      } else if (label.includes("池化层")) {
        const pool = params.pool_size || 2;
        code += `model.add(tf.layers.maxPooling2d({poolSize: ${pool}, strides: ${pool}}));\n`;
      } else if (label.includes("展平层")) {
        code += "model.add(tf.layers.flatten());\n";
      } else if (label.includes("全连接层")) {
        const units = params.units || 64;
        const activation = params.activation || "relu";
        code += `model.add(tf.layers.dense({units: ${units}, activation: '${activation}'}));\n`;
      } else if (label.includes("激活层")) {
        const activation = params.activation || "relu";
        code += `model.add(tf.layers.activation({activation: '${activation}'}));\n`;
      }
    });

    code += "\nmodel.compile({optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy']});\n";
    code += "model.summary();\n\n";

    // 训练示例（静态代码）
    code += `// 训练示例（需要真实数据 X_train, y_train, X_test, y_test）
/*
await model.fit(X_train, y_train, {
  epochs: 5,
  batchSize: 32,
  validationData: [X_test, y_test],
}).then(history => {
  console.log(history.history);
});
*/\n`;
  }

  setGeneratedCode(code);
  alert("代码生成成功！");
  setShowPostActions(true);
  setShowLangPanel(false);
};


  const runInVirtualEnv = () => {
    if (codeType === "python") {
      window.location.href = "/lab/python";
    } else {
      window.location.href = "/lab/tfjs";
    }
  };

  const copyCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      alert("已复制到剪贴板！");
    } catch (err) {
      alert("复制失败，请手动复制。");
    }
  };

  // Canvas refs
  const convCanvasRef = useRef(null);
  const poolCanvasRef = useRef(null);
  const flattenCanvasRef = useRef(null);
  const denseCanvasRef = useRef(null);
  const activationCanvasRef = useRef(null); // ✅ 新增

  // 动画渲染（保持不变）
  useEffect(() => {
    if (!selectedNode) return;
    const label = selectedNode.data.label;

 // ---------------- 卷积层 ----------------
if (label.includes("卷积层") && convCanvasRef.current) {
  const ctx = convCanvasRef.current.getContext("2d");
  ctx.clearRect(0, 0, 200, 150);

  const grid = 5;
  const channels = 3; // 输出通道数
  const kernel = Math.min(Number(selectedNode.data.kernel || 3), grid);
  const cell = 20;
  const offsetX = 10;
  const offsetY = 10;

  const speed = 0.05; // 控制滑动速度
  const totalSteps = (grid - kernel + 1) * (grid - kernel + 1);
  const stepProgress = (frame * speed) % totalSteps;

  const row = Math.floor(stepProgress / (grid - kernel + 1));
  const col = Math.floor(stepProgress % (grid - kernel + 1));

  for (let ch = 0; ch < channels; ch++) {
    // 背景网格
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        ctx.fillStyle = `rgba(${30 + ch * 50},${50 + ch * 40},80,0.2)`;
        ctx.fillRect(offsetX + c * cell, offsetY + r * cell, cell - 2, cell - 2);
      }
    }

    // 窗口滑动区域
    ctx.fillStyle = `rgba(73,209,183,0.5)`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#49d1b7";
    ctx.fillRect(offsetX + col * cell, offsetY + row * cell, kernel * cell, kernel * cell);
    ctx.shadowBlur = 0;

    // 标注文字 Kernel
    ctx.fillStyle = "#49d1b7";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("Kernel", offsetX + col * cell, offsetY + row * cell - 2);
  }
}

// ---------------- 池化层 ----------------
if (label.includes("池化层") && poolCanvasRef.current) {
  const ctx = poolCanvasRef.current.getContext("2d");
  ctx.clearRect(0, 0, 200, 150);

  const grid = 5;
  const pool = Math.min(Number(selectedNode.data.pool_size || 2), grid);
  const cell = 20;
  const offsetX = 10;
  const offsetY = 10;

  const speed = 0.05; // 控制滑动速度，调小可以更慢
  const totalSteps = (grid - pool + 1) * (grid - pool + 1);
  const stepProgress = (frame * speed) % totalSteps;

  const row = Math.floor(stepProgress / (grid - pool + 1));
  const col = Math.floor(stepProgress % (grid - pool + 1));

  // 绘制背景网格
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      ctx.fillStyle = `rgba(20,30,60,0.2)`;
      ctx.fillRect(offsetX + c * cell, offsetY + r * cell, cell - 2, cell - 2);
    }
  }

  // 绘制滑动窗口
  ctx.strokeStyle = "#f08a5d";
  ctx.lineWidth = 3;
  ctx.strokeRect(offsetX + col * cell, offsetY + row * cell, pool * cell, pool * cell);

  const poolType = selectedNode.data.pool_type || "MaxPool";

  if (poolType === "MaxPool") {
    // 随机选一个格子作为最大值（固定在窗口内）
    const maxR = row + Math.floor(pool / 2);
    const maxC = col + Math.floor(pool / 2);
    ctx.fillStyle = "rgba(255,0,0,0.7)";
    ctx.fillRect(offsetX + maxC * cell, offsetY + maxR * cell, cell - 2, cell - 2);

    // 标注 MAX
    ctx.fillStyle = "#ff0000";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("MAX", offsetX + col * cell, offsetY + row * cell - 2);
  } else if (poolType === "AvgPool") {
    // 平均值窗口：加深亮度
    for (let r2 = row; r2 < row + pool; r2++) {
      for (let c2 = col; c2 < col + pool; c2++) {
        ctx.fillStyle = "rgba(0,200,255,0.3)";
        ctx.fillRect(offsetX + c2 * cell, offsetY + r2 * cell, cell - 2, cell - 2);
      }
    }

    // 在窗口中心显示 AVG 标记
    ctx.fillStyle = "rgba(0,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(
      offsetX + (col + pool / 2) * cell,
      offsetY + (row + pool / 2) * cell,
      cell / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();

    ctx.fillStyle = "#00f";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("AVG", offsetX + col * cell, offsetY + row * cell - 2);
  }
}

 // ---------------- 展平层 ----------------
if (label.includes("展平层") && flattenCanvasRef.current) {
  const ctx = flattenCanvasRef.current.getContext("2d");
  ctx.clearRect(0, 0, 200, 150);

  const rows = 3;
  const cols = 3;
  const cell = 30;
  const vectorX = 150;

  // 调整速度，数值越大越快
  const speed = 0.15;

  // 进度 0 ~ 1
  const progress = Math.min(frame * speed / 10, 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      const startX = c * cell;
      const startY = r * cell;
      const targetX = vectorX;
      const targetY = index * 15;

      const x = startX + (targetX - startX) * progress;
      const y = startY + (targetY - startY) * progress;

      ctx.fillStyle = `hsl(${index * 40},80%,60%)`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `hsl(${index * 40},80%,80%)`;
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 原始网格
      ctx.strokeStyle = "rgba(100,100,100,0.2)";
      ctx.strokeRect(c * cell, r * cell, cell, cell);
    }
  }
}

    // ---------------- Dense层 ----------------
    if (label.includes("全连接层") && denseCanvasRef.current) {
      const ctx = denseCanvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, 200, 150);
      const units = Number(selectedNode.data.units || 6);
      for (let i = 0; i < units; i++) {
        const y = 20 + i * 20;
        ctx.fillStyle = "#ff5722";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#ff8a50";
        ctx.beginPath();
        ctx.arc(75, y, 8, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

  // ---------------- 激活层 ----------------
// ---------------- 激活层 ----------------
if (label.includes("激活层") && activationCanvasRef.current) {
  const ctx = activationCanvasRef.current.getContext("2d");
  ctx.clearRect(0, 0, 200, 150);

  const func = selectedNode.data.activation || "relu";

  // 坐标轴参数
  const originX = 100;
  const originY = 120;
  const scaleX = 8;  // x轴缩放
  const scaleY = 8;  // y轴缩放

  // --------- 绘制坐标轴 ---------
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;

  // x轴
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(200, originY);
  ctx.stroke();

  // y轴
  ctx.beginPath();
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, 150);
  ctx.stroke();

  // x轴刻度
  ctx.fillStyle = "#666";
  ctx.font = "10px sans-serif";
  for(let i=-10; i<=10; i+=5){
    const x = originX + i*scaleX;
    ctx.beginPath();
    ctx.moveTo(x, originY-3);
    ctx.lineTo(x, originY+3);
    ctx.stroke();
    ctx.fillText(i, x-5, originY+12);
  }

  // y轴刻度
  for(let i=-10; i<=10; i+=5){
    const y = originY - i*scaleY;
    ctx.beginPath();
    ctx.moveTo(originX-3, y);
    ctx.lineTo(originX+3, y);
    ctx.stroke();
    ctx.fillText(i, originX-25, y+4);
  }

  // --------- 绘制激活函数曲线 ---------
  ctx.beginPath();
  for (let x=-10; x<=10; x+=0.05) {
    let y;
    switch (func.toLowerCase()) {
      case "relu": y = Math.max(0,x); break;
      case "sigmoid": y = 1/(1+Math.exp(-x)); break;
      case "tanh": y = Math.tanh(x); break;
      case "softmax": y = Math.exp(x)/(Math.exp(x)+1); break;
      case "leakyrelu": y = x>=0?x:0.01*x; break;
      case "elu": y = x>=0?x:Math.exp(x)-1; break;
      default: y = x; // linear
    }

    const cx = originX + x*scaleX;
    const cy = originY - y*scaleY;
    if(x===-10) ctx.moveTo(cx,cy); else ctx.lineTo(cx,cy);
  }

  ctx.strokeStyle="#49d1b7";
  ctx.lineWidth=2;
  ctx.shadowBlur=4;
  ctx.shadowColor="#49d1b7";
  ctx.stroke();
  ctx.shadowBlur=0;

  // --------- 显示公式 ---------
  ctx.fillStyle="#333";
  ctx.font="12px sans-serif";
  let formula="";
  switch(func.toLowerCase()){
    case "relu": formula="ReLU(x) = max(0,x)"; break;
    case "sigmoid": formula="Sigmoid(x) = 1/(1+exp(-x))"; break;
    case "tanh": formula="Tanh(x) = tanh(x)"; break;
    case "softmax": formula="Softmax(x) = exp(x)/Σexp(x)"; break;
    case "leakyrelu": formula="LeakyReLU(x) = x if x>0 else 0.01*x"; break;
    case "elu": formula="ELU(x) = x if x>=0 else exp(x)-1"; break;
    default: formula="Linear(x) = x"; break;
  }
  ctx.fillText(formula,10,15);
}

}, [frame, selectedNode]);

  return (
    <>
      {/* 三栏主容器（只包含：左侧、画布、右侧） */}
      <div className="drag-container">
        {/* 左侧栏 */}
        <div className="sidebar">
          <h3>📊 数据集</h3>
          {nodeTypesList.filter(n => n.type === "Dataset").map(item => (
            <div key={item.label} className="dndnode dataset-node" draggable
              onDragStart={e => { e.dataTransfer.setData("application/reactflow", item.type); e.dataTransfer.setData("label", item.label); }}
            >{item.label}</div>
          ))}
          <hr />
          <h3>🧠 操作</h3>
          {nodeTypesList.filter(n => n.type === "Operation").map(item => (
            <div key={item.label} className="dndnode" draggable
              onDragStart={e => { e.dataTransfer.setData("application/reactflow", item.type); e.dataTransfer.setData("label", item.label); }}
            >{item.label}</div>
          ))}
          <button className="train-btn" onClick={handleTrain}>🚀 开始训练</button>
        </div>

        {/* 中间幕布 */}
        <div className="flow-area" ref={reactFlowWrapper} onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onInit={inst => reactFlowInstance.current = inst}
              fitView
            >
              <Background color="#a0e6da" gap={15} />
              <Controls />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* 右侧参数 + 动画面板 */}
<div className="parameter-panel">
  {selectedNode && (
    <div className="layer-info">
      {datasetInfo[selectedNode.data.label?.trim()] ? (
        <>
          <h4>📊 {selectedNode.data.label.trim()} 数据集介绍</h4>
          <p>{datasetInfo[selectedNode.data.label.trim()].description}</p>
          <p><strong>样本数量:</strong> {datasetInfo[selectedNode.data.label.trim()].size}</p>
          <p><strong>类别:</strong> {datasetInfo[selectedNode.data.label.trim()].classes}</p>
        </>
      ) : layerInfo[selectedNode.data.label] ? (
        <>
          <h4>📘 {selectedNode.data.label} 功能说明</h4>
          <p>{layerInfo[selectedNode.data.label].description}</p>
          {layerInfo[selectedNode.data.label].formula && (
            <div className="formula-box">
              <strong>公式:</strong>
              <p>{layerInfo[selectedNode.data.label].formula}</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  )}

          <h3>⚙️ 参数调节</h3>
          {selectedNode ? (
            <>
              <p>当前节点: {selectedNode.data.label}</p>

              {/* 卷积层 */}
              {selectedNode.data.label.includes("卷积层") && <>
                <label>步长 (stride)</label>
                <input type="number" value={selectedNode.data.stride || 1} onChange={e => updateParam("stride", e.target.value)} />
                <label>卷积核大小 (kernel size)</label>
                <input type="number" value={selectedNode.data.kernel || 3} onChange={e => updateParam("kernel", e.target.value)} />
                <label>激活函数</label>
                <select value={selectedNode.data.activation || "relu"} onChange={e => updateParam("activation", e.target.value)}>
                  <canvas width="200" height="150" ref={activationCanvasRef} style={{ border: "1px solid #ccc", marginTop: "10px" }} />
                  <option value="relu">ReLU</option>
                  <option value="sigmoid">Sigmoid</option>
                  <option value="tanh">Tanh</option>
                  <option value="softmax">Softmax</option>
                </select>
                <canvas width="200" height="150" ref={convCanvasRef} style={{ border: "1px solid #ccc", marginTop: "10px" }} />
              </>}

              {/* 池化层 */}
              {selectedNode.data.label.includes("池化层") && <>
                <label>池化类型</label>
                <select value={selectedNode.data.pool_type || "MaxPool"} onChange={e => updateParam("pool_type", e.target.value)}>
                  <option value="MaxPool">最大池化</option>
                  <option value="AvgPool">平均池化</option>
                </select>
                <label>池化大小 (pool size)</label>
                <input type="number" value={selectedNode.data.pool_size || 2} onChange={e => updateParam("pool_size", e.target.value)} />
                <canvas width="200" height="150" ref={poolCanvasRef} style={{ border: "1px solid #ccc", marginTop: "10px" }} />
              </>}

              {/* 展平层 */}
              {selectedNode.data.label.includes("展平层") && <>
                <canvas width="200" height="150" ref={flattenCanvasRef} style={{ border: "1px solid #ccc", marginTop: "10px" }} />
              </>}

              {/* 全连接层 */}
              {selectedNode.data.label.includes("全连接层") && <>
                <label>神经元数量</label>
                <input type="number" value={selectedNode.data.units || 6} onChange={e => updateParam("units", e.target.value)} />
                <canvas width="200" height="150" ref={denseCanvasRef} style={{ border: "1px solid #ccc", marginTop: "10px" }} />
              </>}
              {/*激活层 */}
{selectedNode.data.label.includes("激活层") && (
  <>
    <label>激活函数</label>
    <select value={selectedNode.data.activation || "relu"} onChange={e => updateParam("activation", e.target.value)}>
      <option value="relu">ReLU</option>
      <option value="sigmoid">Sigmoid</option>
      <option value="tanh">Tanh</option>
      <option value="softmax">Softmax</option>
      <option value="leakyrelu">LeakyReLU</option>
      <option value="elu">ELU</option>
      <option value="linear">Linear</option>
    </select>

    {/* 激活函数公式显示 */}
    <div className="formula-box" style={{ marginTop: 8 }}>
      <strong>公式:</strong>
      <p style={{ fontFamily: "monospace", fontSize: 14, background: "#f5f5f5", padding: "6px 8px", borderRadius: 6 }}>
        {{
          relu: "ReLU(x) = max(0, x)",
          sigmoid: "Sigmoid(x) = 1 / (1 + exp(-x))",
          tanh: "Tanh(x) = tanh(x)",
          softmax: "Softmax(x) = exp(x) / Σexp(x_i)",
          leakyrelu: "LeakyReLU(x) = x if x>0 else 0.01*x",
          elu: "ELU(x) = x if x>=0 else exp(x)-1",
          linear: "Linear(x) = x"
        }[selectedNode.data.activation || "relu"]}
      </p>
    </div>

    <canvas width="200" height="150" ref={activationCanvasRef} style={{ border: "1px solid #ccc", marginTop: "10px" }} />
  </>
)}
              <button className="delete-btn" onClick={handleDelete}>删除节点</button>
            </>
          ) : <p className="hint">点击节点查看参数和动画演示</p>}
        </div>
      </div>

      {/* ==== 下面都是浮动 / 弹窗 / 生成代码面板（放在 drag-container 外，避免破坏布局） ==== */}

      <div className="code-gen-box">
        <h3>🧩 生成模型代码</h3>

        {/* Tabs 选择 Python / TFJS */}
        <div className="code-tabs">
          <button
            className={codeType === "python" ? "active" : ""}
            onClick={() => setCodeType("python")}
          >
            Python
          </button>
          <button
            className={codeType === "tfjs" ? "active" : ""}
            onClick={() => setCodeType("tfjs")}
          >
            TensorFlow.js
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="gen-code-btn" onClick={() => generateCode()}>⚙️ 生成代码</button>
          <button className="run-env-btn" onClick={runInVirtualEnv}>▶ 运行到虚拟实训环境</button>
        </div>

        <textarea
          value={generatedCode}
          readOnly
          placeholder="生成的代码会显示在这里..."
          style={{ width: "100%", minHeight: 160, marginTop: 12, borderRadius: 8, padding: 8 }}
        />
      </div>

      {/* 悬浮按钮（右下） */}
      <button
        className="fab-btn"
        onClick={() => setShowLangPanel(true)}
      >
        🛠
      </button>

      {/* 语言选择弹窗 */}
      {showLangPanel && (
        <div className="lang-panel">
          <h3>选择生成代码的语言</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setCodeType("python"); generateCode("python"); }}>
              Python
            </button>
            <button onClick={() => { setCodeType("tfjs"); generateCode("tfjs"); }}>
              TensorFlow.js
            </button>
          </div>

          <button className="close-panel" onClick={() => setShowLangPanel(false)}>
            关闭
          </button>
        </div>
      )}

      {/* 生成后操作面板（复制/返回/进入虚拟实训） */}
      {showPostActions && (
        <div className="post-actions">
          <button onClick={() => { setShowPostActions(false); }}>返回</button>
          <button onClick={copyCodeToClipboard}>复制代码</button>
          <button onClick={runInVirtualEnv}>
            进入虚拟实训环境 ▶
          </button>
        </div>
      )}
    </>
  );
}
