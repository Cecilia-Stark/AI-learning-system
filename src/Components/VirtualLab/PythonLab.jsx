import React, { useState, useEffect } from "react";
import "./PythonLab.css";
import { Play, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export default function PythonLab() {
  const [sessionId, setSessionId] = useState(null);
  const [cells, setCells] = useState([{ id: 1, code: "", output: "" }]);

  useEffect(() => {
    const createSession = async () => {
      const res = await fetch("http://localhost:5000/create_session", { method: "POST" });
      const data = await res.json();
      setSessionId(data.session_id);
    };
    createSession();
  }, []);

  const runCell = async (cellId) => {
    const target = cells.find(c => c.id === cellId);
    if (!target) return;

    const res = await fetch("http://localhost:5000/run_cell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        code: target.code
      }),
    });

    const data = await res.json();

    setCells(prev =>
      prev.map(c =>
        c.id === cellId ? { ...c, output: data.output } : c
      )
    );
  };

  const insertCell = (index) => {
    const newCell = { id: Date.now(), code: "", output: "" };
    setCells(prev => {
      const updated = [...prev];
      updated.splice(index, 0, newCell);
      return updated;
    });
  };

  const deleteCell = (id) => setCells(prev => prev.filter(c => c.id !== id));

  const moveUp = (i) => {
    if (i === 0) return;
    setCells(prev => {
      const list = [...prev];
      [list[i - 1], list[i]] = [list[i], list[i - 1]];
      return list;
    });
  };

  const moveDown = (i) => {
    if (i === cells.length - 1) return;
    setCells(prev => {
      const list = [...prev];
      [list[i], list[i + 1]] = [list[i + 1], list[i]];
      return list;
    });
  };

  return (
    <div className="lab-container">

      <h1 className="lab-title">🧪 Python 虚拟实训环境</h1>
      <p className="lab-desc">支持实时执行 Python 代码，多代码块编辑，类似 Jupyter Notebook</p>

      {cells.map((cell, idx) => (
        <div key={cell.id} className="cell-card">

          {/* 工具栏 */}
          <div className="toolbar">
            <button className="t-btn" onClick={() => insertCell(idx)}>
              <Plus size={16}/> 上方
            </button>
            <button className="t-btn" onClick={() => insertCell(idx + 1)}>
              <Plus size={16}/> 下方
            </button>
            <button className="t-btn" onClick={() => moveUp(idx)}>
              <ArrowUp size={16}/>
            </button>
            <button className="t-btn" onClick={() => moveDown(idx)}>
              <ArrowDown size={16}/>
            </button>
            <button className="t-btn del-btn" onClick={() => deleteCell(cell.id)}>
              <Trash2 size={16}/>
            </button>

            <button className="run-btn" onClick={() => runCell(cell.id)}>
              <Play size={16}/> 运行
            </button>
          </div>

          {/* 代码区 */}
          <textarea
            className="code-area"
            value={cell.code}
            onChange={(e) =>
              setCells(prev =>
                prev.map(c => c.id === cell.id ? { ...c, code: e.target.value } : c)
              )
            }
            placeholder="输入 Python 代码，例如 print('Hello')"
          />

          {/* 输出区 */}
          {cell.output && (
            <pre className="output-box">
              {cell.output}
            </pre>
          )}
        </div>
      ))}

      <button className="add-bottom" onClick={() => insertCell(cells.length)}>
        <Plus size={18}/> 新建代码块
      </button>

    </div>
  );
}
