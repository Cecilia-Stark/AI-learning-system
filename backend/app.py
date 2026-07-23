from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import subprocess
import tempfile
import os

app = Flask(__name__)
CORS(app)

# 存放所有 Python 会话（session_id -> 文件路径）
sessions = {}

@app.route("/")
def home():
    return jsonify({"message": "Backend Running", "status": "ok"})

# ------------------------------
# 创建 Python 会话
# ------------------------------
@app.route("/create_session", methods=["POST"])
def create_session():
    session_id = str(uuid.uuid4())
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".py")
    temp_file.close()
    sessions[session_id] = temp_file.name
    return jsonify({"session_id": session_id})

# ------------------------------
# 运行代码单元
# ------------------------------
@app.route("/run_cell", methods=["POST"])
def run_cell():
    data = request.get_json()
    session_id = data.get("session_id")
    code = data.get("code")

    if session_id not in sessions:
        return jsonify({"error": "Invalid session_id"}), 400

    file_path = sessions[session_id]

    # 追加代码到 session 文件中（保持变量）
    with open(file_path, "a", encoding="utf-8") as f:
        f.write("\n")
        f.write(code)
        f.write("\n")

    # 使用虚拟环境的 python 执行
    python_path = os.path.join(os.getcwd(), "venv", "Scripts", "python.exe")

    try:
        result = subprocess.run(
            [python_path, file_path],
            capture_output=True,
            text=True,
            timeout=15  # 超时防止死循环
        )
        output = result.stdout if result.stdout else result.stderr
    except subprocess.TimeoutExpired:
        output = "Error: Execution timed out."
    except Exception as e:
        output = str(e)

    return jsonify({"output": output})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
