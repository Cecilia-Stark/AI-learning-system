import sys
import io

# 所有代码共享一个上下文 (类似 Jupyter Notebook 的 global 变量区)
EXEC_CONTEXT = {}

def run_user_code(code: str):
    """
    执行用户代码，捕获输出并返回。
    """
    # 备份 stdout
    old_stdout = sys.stdout
    sys.stdout = io.StringIO()

    try:
        exec(code, EXEC_CONTEXT)
        output = sys.stdout.getvalue()
        return {"output": output, "error": None}

    except Exception as e:
        return {"output": None, "error": str(e)}

    finally:
        sys.stdout = old_stdout
