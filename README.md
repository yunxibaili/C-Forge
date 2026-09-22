# C-Forge

C / 数据结构可视化实验室 —— 专升本学习用。写 C，真实编译执行，执行过程变成动画。

## 环境要求

- gcc + gdb（推荐 MSYS2 ucrt64，已在 PATH 中）
- Python 3.12+
- Node 18+

## 运行

```bash
# 后端
cd backend
pip install -r requirements.txt
python main.py            # 或 uvicorn main:app --port 8000

# 前端（另一个终端）
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## 支持范围（MVP）

- int / float / char、数组、指针、struct、函数调用栈
- 链表（malloc 节点自动发现）、冒泡排序（compare / swap 动画）
- 行级 Step、变量变化、指针箭头、内存地址、stdout、执行时间轴拖动

## 示例

见 `examples/`：vars.c、pointers.c、array_pointer.c、linkedlist.c、bubble_sort.c
