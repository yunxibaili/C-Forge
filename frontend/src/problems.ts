import { EXAMPLES } from "./examples";

export type Difficulty = "easy" | "medium" | "hard";

export const TOPICS = [
  "C Basics",
  "Array",
  "Pointer",
  "Function",
  "Struct",
  "Linked List",
  "Stack",
  "Queue",
  "Tree",
  "Search",
  "Sort",
] as const;

export type Topic = (typeof TOPICS)[number];

export const SOURCES = [
  { id: "rookie", label: "Rookie" },
  { id: "fundamentals", label: "Fundamentals" },
  { id: "pta", label: "PTA" },
  { id: "self", label: "C-Forge" },
] as const;

export type SourceId = (typeof SOURCES)[number]["id"];

export interface Problem {
  id: string;
  source: SourceId;
  title: string;
  difficulty: Difficulty;
  topics: Topic[];
  url: string;
  description: string;
  code: string;
}

const byExample = (id: string): string => {
  const ex = EXAMPLES.find((e) => e.id === id);
  if (!ex) throw new Error("missing example " + id);
  return ex.code;
};

export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

export const PROBLEMS: Problem[] = [
  {
    id: "cf-vars-001",
    source: "fundamentals",
    title: "Variables & Assignment",
    difficulty: "easy",
    topics: ["C Basics"],
    url: "",
    description: "Declare integers, compute a sum, and watch local variable writes step by step.",
    code: byExample("vars"),
  },
  {
    id: "cf-ptr-001",
    source: "fundamentals",
    title: "Pointer Basic",
    difficulty: "easy",
    topics: ["Pointer", "C Basics"],
    url: "",
    description: "Take an address, store it in a pointer, and write through the pointer.",
    code: byExample("pointers"),
  },
  {
    id: "cf-arr-001",
    source: "fundamentals",
    title: "Array & Pointer Arithmetic",
    difficulty: "easy",
    topics: ["Array", "Pointer"],
    url: "",
    description: "Index an array, advance a pointer, and update elements in a loop.",
    code: byExample("array"),
  },
  {
    id: "cf-fn-001",
    source: "fundamentals",
    title: "Function Call & Return",
    difficulty: "easy",
    topics: ["Function"],
    url: "",
    description: "Call a simple add function and observe parameters, locals, and return.",
    code: `#include <stdio.h>

int add(int a, int b) {
    int sum = a + b;
    return sum;
}

int main(void) {
    int x = 3;
    int y = 4;
    int r = add(x, y);
    printf("r=%d\\n", r);
    return 0;
}
`,
  },
  {
    id: "cf-struct-001",
    source: "fundamentals",
    title: "Struct Field Access",
    difficulty: "easy",
    topics: ["Struct"],
    url: "",
    description: "Initialize a struct, read and write its fields, and print the result.",
    code: `#include <stdio.h>

struct Point {
    int x;
    int y;
};

int main(void) {
    struct Point p;
    p.x = 3;
    p.y = 4;
    p.x = p.x + 1;
    printf("p=(%d,%d)\\n", p.x, p.y);
    return 0;
}
`,
  },
  {
    id: "cf-list-001",
    source: "self",
    title: "Linked List Insert",
    difficulty: "medium",
    topics: ["Linked List", "Pointer"],
    url: "",
    description: "Build a singly linked list with push_front and insert_after; watch heap nodes and next pointers.",
    code: byExample("list"),
  },
  {
    id: "cf-stack-001",
    source: "self",
    title: "Array Stack Push/Pop",
    difficulty: "easy",
    topics: ["Stack", "Array"],
    url: "",
    description: "Implement a fixed array stack with push and pop; step through top and element writes.",
    code: `#include <stdio.h>

#define CAP 8

int push(int *st, int *top, int v) {
    if (*top >= CAP) return -1;
    st[*top] = v;
    *top = *top + 1;
    return 0;
}

int pop(int *st, int *top) {
    if (*top <= 0) return -1;
    *top = *top - 1;
    return st[*top];
}

int main(void) {
    int st[CAP];
    int top = 0;
    push(st, &top, 10);
    push(st, &top, 20);
    push(st, &top, 30);
    int v = pop(st, &top);
    printf("pop=%d top=%d\\n", v, top);
    v = pop(st, &top);
    printf("pop=%d top=%d\\n", v, top);
    return 0;
}
`,
  },
  {
    id: "cf-queue-001",
    source: "self",
    title: "Array Queue Enqueue/Dequeue",
    difficulty: "easy",
    topics: ["Queue", "Array"],
    url: "",
    description: "Circular-friendly array queue with enqueue and dequeue; watch front/rear indices.",
    code: `#include <stdio.h>

#define CAP 8

void enqueue(int *q, int *rear, int v) {
    q[*rear] = v;
    *rear = (*rear + 1) % CAP;
}

int dequeue(int *q, int *front, int *rear) {
    if (*front == *rear) return -1;
    int v = q[*front];
    *front = (*front + 1) % CAP;
    return v;
}

int main(void) {
    int q[CAP];
    int front = 0, rear = 0;
    enqueue(q, &rear, 11);
    enqueue(q, &rear, 22);
    enqueue(q, &rear, 33);
    int v = dequeue(q, &front, &rear);
    printf("deq=%d\\n", v);
    v = dequeue(q, &front, &rear);
    printf("deq=%d\\n", v);
    return 0;
}
`,
  },
  {
    id: "cf-sort-001",
    source: "fundamentals",
    title: "Bubble Sort",
    difficulty: "easy",
    topics: ["Sort", "Array"],
    url: "",
    description: "Classic bubble sort with compare and swap animations on an integer array.",
    code: byExample("bubble"),
  },
  {
    id: "cf-search-001",
    source: "pta",
    title: "Binary Search",
    difficulty: "easy",
    topics: ["Search", "Array"],
    url: "https://pintia.cn/",
    description: "Search a sorted array by halving the range; step through mid comparisons.",
    code: `#include <stdio.h>

int bsearch_int(int *a, int n, int key) {
    int lo = 0;
    int hi = n - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (a[mid] == key) return mid;
        if (a[mid] < key) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}

int main(void) {
    int a[8] = {1, 3, 5, 7, 9, 11, 13, 15};
    int idx = bsearch_int(a, 8, 11);
    printf("idx=%d\\n", idx);
    idx = bsearch_int(a, 8, 2);
    printf("idx=%d\\n", idx);
    return 0;
}
`,
  },
  {
    id: "cf-tree-001",
    source: "self",
    title: "Binary Tree Inorder Walk",
    difficulty: "medium",
    topics: ["Tree", "Pointer", "Function"],
    url: "",
    description: "Build a small binary tree with heap nodes and walk it in-order (stack frames + pointers).",
    code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int val;
    struct Node *left;
    struct Node *right;
};

struct Node *mk(int v) {
    struct Node *n = (struct Node *)malloc(sizeof(struct Node));
    n->val = v;
    n->left = NULL;
    n->right = NULL;
    return n;
}

void inorder(struct Node *r) {
    if (r == NULL) return;
    inorder(r->left);
    printf("%d ", r->val);
    inorder(r->right);
}

int main(void) {
    struct Node *root = mk(4);
    root->left = mk(2);
    root->right = mk(6);
    root->left->left = mk(1);
    root->left->right = mk(3);
    inorder(root);
    printf("\\n");
    return 0;
}
`,
  },
  {
    id: "cf-rec-001",
    source: "fundamentals",
    title: "Recursion Factorial",
    difficulty: "easy",
    topics: ["Function"],
    url: "",
    description: "Compute 4! recursively; watch stack frames push and pop with each call/return.",
    code: byExample("recursion"),
  },
];

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}
