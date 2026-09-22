import { EXAMPLES } from "./examples";

export type Difficulty = "easy" | "medium" | "hard";

export const TOPICS = [
  "C Basics",
  "Array",
  "Pointer",
  "Function",
  "Struct",
  "Recursion",
  "Linked List",
  "Stack",
  "Queue",
  "Tree",
  "Graph",
  "Search",
  "Sort",
  "Traversal",
  "Complexity",
] as const;

export type Topic = (typeof TOPICS)[number];

export const SOURCES = [
  { id: "gd", label: "Guangdong Exam" },
  { id: "rookie", label: "Rookie" },
  { id: "fundamentals", label: "Fundamentals" },
  { id: "pta", label: "PTA" },
  { id: "leetcode", label: "LeetCode" },
  { id: "nowcoder", label: "NowCoder" },
  { id: "self", label: "C-Forge" },
] as const;

export type SourceId = (typeof SOURCES)[number]["id"];

export type ExamRelevance = "high" | "medium" | "low";

export const EXAM_RELEVANCES: readonly ExamRelevance[] = ["high", "medium", "low"];

export interface Problem {
  id: string;
  source: SourceId;
  title: string;
  difficulty: Difficulty;
  topics: Topic[];
  examRelevance: ExamRelevance;
  url: string;
  description: string;
  code: string;
  visualizable?: boolean;
  recommendedOrder?: number;
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
    examRelevance: "high",
    url: "",
    description: "Declare integers, compute a sum, and watch local variable writes step by step.",
    code: byExample("vars"),
    visualizable: true,
    recommendedOrder: 1,
  },
  {
    id: "cf-ptr-001",
    source: "fundamentals",
    title: "Pointer Basic",
    difficulty: "easy",
    topics: ["Pointer", "C Basics"],
    examRelevance: "high",
    url: "",
    description: "Take an address, store it in a pointer, and write through the pointer.",
    code: byExample("pointers"),
    visualizable: true,
    recommendedOrder: 2,
  },
  {
    id: "cf-arr-001",
    source: "fundamentals",
    title: "Array & Pointer Arithmetic",
    difficulty: "easy",
    topics: ["Array", "Pointer"],
    examRelevance: "high",
    url: "",
    description: "Index an array, advance a pointer, and update elements in a loop.",
    code: byExample("array"),
    visualizable: true,
    recommendedOrder: 3,
  },
  {
    id: "cf-fn-001",
    source: "fundamentals",
    title: "Function Call & Return",
    difficulty: "easy",
    topics: ["Function"],
    examRelevance: "high",
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
    visualizable: true,
    recommendedOrder: 4,
  },
  {
    id: "cf-if-001",
    source: "gd",
    title: "If / Else Branch",
    difficulty: "easy",
    topics: ["C Basics"],
    examRelevance: "high",
    url: "",
    description: "Classify a score with nested if/else and print the grade letter.",
    code: `#include <stdio.h>

int main(void) {
    int score = 72;
    char grade;
    if (score >= 90) {
        grade = 'A';
    } else if (score >= 60) {
        grade = 'C';
    } else {
        grade = 'F';
    }
    printf("score=%d grade=%c\\n", score, grade);
    return 0;
}
`,
    recommendedOrder: 5,
  },
  {
    id: "cf-for-001",
    source: "gd",
    title: "For Loop Sum",
    difficulty: "easy",
    topics: ["C Basics"],
    examRelevance: "high",
    url: "",
    description: "Accumulate 1..100 with a for loop; step through i and the running sum.",
    code: `#include <stdio.h>

int main(void) {
    int sum = 0;
    int i;
    for (i = 1; i <= 100; i++) {
        sum = sum + i;
    }
    printf("sum=%d\\n", sum);
    return 0;
}
`,
    recommendedOrder: 6,
  },
  {
    id: "cf-while-001",
    source: "rookie",
    title: "While Loop Countdown",
    difficulty: "easy",
    topics: ["C Basics"],
    examRelevance: "medium",
    url: "",
    description: "Count down with a while loop until the counter reaches zero.",
    code: `#include <stdio.h>

int main(void) {
    int n = 5;
    while (n > 0) {
        printf("n=%d\\n", n);
        n = n - 1;
    }
    printf("done\\n");
    return 0;
}
`,
    recommendedOrder: 7,
  },
  {
    id: "cf-switch-001",
    source: "gd",
    title: "Switch Statement",
    difficulty: "easy",
    topics: ["C Basics"],
    examRelevance: "medium",
    url: "",
    description: "Dispatch on a day number with switch/case/default.",
    code: `#include <stdio.h>

int main(void) {
    int day = 3;
    switch (day) {
        case 1: printf("Mon\\n"); break;
        case 2: printf("Tue\\n"); break;
        case 3: printf("Wed\\n"); break;
        default: printf("Other\\n"); break;
    }
    return 0;
}
`,
    recommendedOrder: 8,
  },
  {
    id: "cf-char-001",
    source: "rookie",
    title: "Char Array & Length",
    difficulty: "easy",
    topics: ["C Basics", "Array"],
    examRelevance: "medium",
    url: "",
    description: "Walk a char array until the null terminator and print its length.",
    code: `#include <stdio.h>

int main(void) {
    char s[] = "hello";
    int len = 0;
    while (s[len] != '\\0') {
        len = len + 1;
    }
    printf("len=%d\\n", len);
    return 0;
}
`,
    recommendedOrder: 9,
  },
  {
    id: "cf-struct-001",
    source: "fundamentals",
    title: "Struct Field Access",
    difficulty: "easy",
    topics: ["Struct"],
    examRelevance: "medium",
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
    recommendedOrder: 10,
  },
  {
    id: "cf-rec-001",
    source: "fundamentals",
    title: "Recursion Factorial",
    difficulty: "easy",
    topics: ["Function", "Recursion"],
    examRelevance: "high",
    url: "",
    description: "Compute 4! recursively; watch stack frames push and pop with each call/return.",
    code: byExample("recursion"),
    visualizable: true,
    recommendedOrder: 11,
  },
  {
    id: "cf-scope-001",
    source: "fundamentals",
    title: "Variable Scope",
    difficulty: "easy",
    topics: ["C Basics", "Function"],
    examRelevance: "medium",
    url: "",
    description: "Compare a global counter with a shadowed local of the same name.",
    code: `#include <stdio.h>

int counter = 100;

int bump(void) {
    int counter = 1;
    counter = counter + 1;
    return counter;
}

int main(void) {
    int r = bump();
    printf("local=%d global=%d\\n", r, counter);
    return 0;
}
`,
    recommendedOrder: 12,
  },
  {
    id: "cf-io-001",
    source: "gd",
    title: "Printf Format Specifiers",
    difficulty: "easy",
    topics: ["C Basics"],
    examRelevance: "high",
    url: "",
    description: "Print int, char, and double with the matching printf conversion specifiers.",
    code: `#include <stdio.h>

int main(void) {
    int n = 42;
    char c = 'Z';
    double x = 3.5;
    printf("n=%d c=%c x=%.1f\\n", n, c, x);
    return 0;
}
`,
    recommendedOrder: 13,
  },
  {
    id: "cf-ops-001",
    source: "gd",
    title: "Operator Precedence",
    difficulty: "medium",
    topics: ["C Basics"],
    examRelevance: "high",
    url: "",
    description: "Evaluate mixed arithmetic and comparison expressions the way C does.",
    code: `#include <stdio.h>

int main(void) {
    int a = 2;
    int b = 3;
    int c = 4;
    int r1 = a + b * c;
    int r2 = (a + b) * c;
    int r3 = a < b && b < c;
    printf("r1=%d r2=%d r3=%d\\n", r1, r2, r3);
    return 0;
}
`,
    recommendedOrder: 14,
  },
  {
    id: "cf-cast-001",
    source: "rookie",
    title: "Integer Division & Cast",
    difficulty: "medium",
    topics: ["C Basics"],
    examRelevance: "medium",
    url: "",
    description: "Show truncating integer division versus a cast to double.",
    code: `#include <stdio.h>

int main(void) {
    int a = 7;
    int b = 2;
    int q = a / b;
    double dq = (double)a / b;
    printf("q=%d dq=%.2f\\n", q, dq);
    return 0;
}
`,
    recommendedOrder: 15,
  },
  {
    id: "cf-matrix-001",
    source: "pta",
    title: "2D Array Fill & Print",
    difficulty: "easy",
    topics: ["Array", "C Basics"],
    examRelevance: "medium",
    url: "https://pintia.cn/",
    description: "Fill a 3x3 matrix in nested loops and print it row by row.",
    code: `#include <stdio.h>

int main(void) {
    int m[3][3];
    int i, j;
    for (i = 0; i < 3; i++) {
        for (j = 0; j < 3; j++) {
            m[i][j] = i * 3 + j + 1;
        }
    }
    for (i = 0; i < 3; i++) {
        for (j = 0; j < 3; j++) {
            printf("%d ", m[i][j]);
        }
        printf("\\n");
    }
    return 0;
}
`,
    recommendedOrder: 16,
  },
  {
    id: "cf-list-001",
    source: "self",
    title: "Linked List Insert",
    difficulty: "medium",
    topics: ["Linked List", "Pointer"],
    examRelevance: "high",
    url: "",
    description:
      "Build a singly linked list with push_front and insert_after; watch heap nodes and next pointers.",
    code: byExample("list"),
    visualizable: true,
    recommendedOrder: 20,
  },
  {
    id: "cf-list-002",
    source: "self",
    title: "Linked List Traversal",
    difficulty: "easy",
    topics: ["Linked List", "Traversal"],
    examRelevance: "high",
    url: "",
    description: "Walk a three-node list with a cursor and print each data field.",
    code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node *mk(int v) {
    struct Node *n = (struct Node *)malloc(sizeof(struct Node));
    n->data = v;
    n->next = NULL;
    return n;
}

int main(void) {
    struct Node *a = mk(1);
    struct Node *b = mk(2);
    struct Node *c = mk(3);
    a->next = b;
    b->next = c;
    struct Node *cur = a;
    while (cur != NULL) {
        printf("%d ", cur->data);
        cur = cur->next;
    }
    printf("\\n");
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 21,
  },
  {
    id: "cf-list-003",
    source: "self",
    title: "Linked List Delete Front",
    difficulty: "medium",
    topics: ["Linked List", "Pointer"],
    examRelevance: "medium",
    url: "",
    description: "Pop the head node, free it, and advance the head pointer.",
    code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node *push_front(struct Node *head, int v) {
    struct Node *n = (struct Node *)malloc(sizeof(struct Node));
    n->data = v;
    n->next = head;
    return n;
}

struct Node *pop_front(struct Node *head) {
    if (head == NULL) return NULL;
    struct Node *next = head->next;
    free(head);
    return next;
}

int main(void) {
    struct Node *head = NULL;
    head = push_front(head, 30);
    head = push_front(head, 20);
    head = push_front(head, 10);
    head = pop_front(head);
    printf("head=%d\\n", head->data);
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 22,
  },
  {
    id: "cf-list-004",
    source: "pta",
    title: "Linked List Length Count",
    difficulty: "easy",
    topics: ["Linked List", "Traversal"],
    examRelevance: "medium",
    url: "https://pintia.cn/",
    description: "Count nodes by walking next pointers until NULL.",
    code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

int main(void) {
    struct Node c3 = {3, NULL};
    struct Node c2 = {2, &c3};
    struct Node c1 = {1, &c2};
    int len = 0;
    struct Node *cur = &c1;
    while (cur != NULL) {
        len = len + 1;
        cur = cur->next;
    }
    printf("len=%d\\n", len);
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 23,
  },
  {
    id: "cf-list-005",
    source: "self",
    title: "Reverse Linked List",
    difficulty: "medium",
    topics: ["Linked List", "Pointer"],
    examRelevance: "high",
    url: "",
    description: "Invert next pointers one node at a time with prev/cur/tail.",
    code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node *mk(int v) {
    struct Node *n = (struct Node *)malloc(sizeof(struct Node));
    n->data = v;
    n->next = NULL;
    return n;
}

struct Node *reverse(struct Node *head) {
    struct Node *prev = NULL;
    struct Node *cur = head;
    while (cur != NULL) {
        struct Node *next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}

int main(void) {
    struct Node *a = mk(1);
    struct Node *b = mk(2);
    struct Node *c = mk(3);
    a->next = b;
    b->next = c;
    struct Node *r = reverse(a);
    while (r != NULL) {
        printf("%d ", r->data);
        r = r->next;
    }
    printf("\\n");
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 24,
  },
  {
    id: "cf-stack-001",
    source: "self",
    title: "Array Stack Push/Pop",
    difficulty: "easy",
    topics: ["Stack", "Array"],
    examRelevance: "high",
    url: "",
    description:
      "Implement a fixed array stack with push and pop; step through top and element writes.",
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
    visualizable: true,
    recommendedOrder: 25,
  },
  {
    id: "cf-stack-002",
    source: "pta",
    title: "Bracket Matching with Stack",
    difficulty: "medium",
    topics: ["Stack", "Array"],
    examRelevance: "high",
    url: "https://pintia.cn/",
    description: "Push opening brackets and pop on closings; report whether the string balances.",
    code: `#include <stdio.h>
#include <string.h>

#define CAP 64

int match(const char *s) {
    char st[CAP];
    int top = 0;
    int i;
    for (i = 0; s[i] != '\\0'; i++) {
        char c = s[i];
        if (c == '(' || c == '[' || c == '{') {
            if (top >= CAP) return 0;
            st[top++] = c;
        } else if (c == ')' || c == ']' || c == '}') {
            if (top <= 0) return 0;
            char open = st[--top];
            if (open == '(' && c != ')') return 0;
            if (open == '[' && c != ']') return 0;
            if (open == '{' && c != '}') return 0;
        }
    }
    return top == 0;
}

int main(void) {
    printf("a=%d\\n", match("{[()]}"));
    printf("b=%d\\n", match("(]"));
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 26,
  },
  {
    id: "cf-stack-003",
    source: "self",
    title: "Stack Top Peek",
    difficulty: "easy",
    topics: ["Stack"],
    examRelevance: "medium",
    url: "",
    description: "Peek the top element without removing it; guard against an empty stack.",
    code: `#include <stdio.h>

#define CAP 8

int push(int *st, int *top, int v) {
    if (*top >= CAP) return -1;
    st[(*top)++] = v;
    return 0;
}

int peek(int *st, int top) {
    if (top <= 0) return -1;
    return st[top - 1];
}

int main(void) {
    int st[CAP];
    int top = 0;
    push(st, &top, 7);
    push(st, &top, 9);
    printf("top=%d topVal=%d\\n", top, peek(st, top));
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 27,
  },
  {
    id: "cf-queue-001",
    source: "self",
    title: "Array Queue Enqueue/Dequeue",
    difficulty: "easy",
    topics: ["Queue", "Array"],
    examRelevance: "high",
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
    visualizable: true,
    recommendedOrder: 28,
  },
  {
    id: "cf-queue-002",
    source: "self",
    title: "Queue Front Peek",
    difficulty: "easy",
    topics: ["Queue"],
    examRelevance: "medium",
    url: "",
    description: "Read the front element without dequeuing; empty queue returns -1.",
    code: `#include <stdio.h>

#define CAP 8

void enqueue(int *q, int *rear, int v) {
    q[*rear] = v;
    *rear = (*rear + 1) % CAP;
}

int front_of(int *q, int front, int rear) {
    if (front == rear) return -1;
    return q[front];
}

int main(void) {
    int q[CAP];
    int front = 0, rear = 0;
    enqueue(q, &rear, 5);
    enqueue(q, &rear, 6);
    printf("front=%d\\n", front_of(q, front, rear));
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 29,
  },
  {
    id: "cf-queue-003",
    source: "pta",
    title: "Queue Size Count",
    difficulty: "easy",
    topics: ["Queue", "Array"],
    examRelevance: "medium",
    url: "https://pintia.cn/",
    description: "Compute how many elements sit between front and rear on a circular buffer.",
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

int size_of(int front, int rear) {
    if (rear >= front) return rear - front;
    return CAP - front + rear;
}

int main(void) {
    int q[CAP];
    int front = 0, rear = 0;
    enqueue(q, &rear, 1);
    enqueue(q, &rear, 2);
    enqueue(q, &rear, 3);
    dequeue(q, &front, &rear);
    printf("size=%d\\n", size_of(front, rear));
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 30,
  },
  {
    id: "cf-sort-001",
    source: "fundamentals",
    title: "Bubble Sort",
    difficulty: "easy",
    topics: ["Sort", "Array"],
    examRelevance: "high",
    url: "",
    description: "Classic bubble sort with compare and swap animations on an integer array.",
    code: byExample("bubble"),
    visualizable: true,
    recommendedOrder: 40,
  },
  {
    id: "cf-sort-002",
    source: "self",
    title: "Selection Sort",
    difficulty: "medium",
    topics: ["Sort", "Array"],
    examRelevance: "high",
    url: "",
    description: "Pick the minimum of the unsorted suffix and swap it into place each pass.",
    code: `#include <stdio.h>

int main(void) {
    int a[6] = {64, 25, 12, 22, 11, 90};
    int n = 6;
    int i, j, min, tmp;
    for (i = 0; i < n - 1; i++) {
        min = i;
        for (j = i + 1; j < n; j++) {
            if (a[j] < a[min]) min = j;
        }
        if (min != i) {
            tmp = a[i];
            a[i] = a[min];
            a[min] = tmp;
        }
    }
    for (i = 0; i < n; i++) printf("%d ", a[i]);
    printf("\\n");
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 41,
  },
  {
    id: "cf-sort-003",
    source: "self",
    title: "Insertion Sort",
    difficulty: "medium",
    topics: ["Sort", "Array"],
    examRelevance: "high",
    url: "",
    description: "Grow a sorted prefix by shifting larger elements right and inserting the key.",
    code: `#include <stdio.h>

int main(void) {
    int a[6] = {12, 11, 13, 5, 6, 7};
    int n = 6;
    int i, key, j;
    for (i = 1; i < n; i++) {
        key = a[i];
        j = i - 1;
        while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            j = j - 1;
        }
        a[j + 1] = key;
    }
    for (i = 0; i < n; i++) printf("%d ", a[i]);
    printf("\\n");
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 42,
  },
  {
    id: "cf-sort-004",
    source: "pta",
    title: "Merge Two Sorted Arrays",
    difficulty: "medium",
    topics: ["Sort", "Array", "Complexity"],
    examRelevance: "medium",
    url: "https://pintia.cn/",
    description: "Merge two already-sorted arrays into one with a two-pointer walk.",
    code: `#include <stdio.h>

int main(void) {
    int a[4] = {1, 3, 5, 7};
    int b[3] = {2, 4, 6};
    int c[7];
    int i = 0, j = 0, k = 0;
    while (i < 4 && j < 3) {
        if (a[i] <= b[j]) c[k++] = a[i++];
        else c[k++] = b[j++];
    }
    while (i < 4) c[k++] = a[i++];
    while (j < 3) c[k++] = b[j++];
    for (k = 0; k < 7; k++) printf("%d ", c[k]);
    printf("\\n");
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 43,
  },
  {
    id: "cf-search-001",
    source: "pta",
    title: "Binary Search",
    difficulty: "easy",
    topics: ["Search", "Array"],
    examRelevance: "high",
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
    visualizable: true,
    recommendedOrder: 44,
  },
  {
    id: "cf-search-002",
    source: "self",
    title: "Linear Search",
    difficulty: "easy",
    topics: ["Search", "Array"],
    examRelevance: "high",
    url: "",
    description: "Scan each element left to right until the key is found or the array ends.",
    code: `#include <stdio.h>

int lsearch(int *a, int n, int key) {
    int i;
    for (i = 0; i < n; i++) {
        if (a[i] == key) return i;
    }
    return -1;
}

int main(void) {
    int a[5] = {4, 2, 7, 1, 9};
    printf("idx=%d\\n", lsearch(a, 5, 7));
    printf("idx=%d\\n", lsearch(a, 5, 3));
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 45,
  },
  {
    id: "cf-search-003",
    source: "leetcode",
    title: "First Bad Version (Binary Search Shape)",
    difficulty: "medium",
    topics: ["Search", "Complexity"],
    examRelevance: "low",
    url: "https://leetcode.com/",
    description: "Locate the first true in a monotonic predicate with a halving search.",
    code: `#include <stdio.h>

int is_bad(int v) {
    return v >= 4;
}

int first_bad(int n) {
    int lo = 1;
    int hi = n;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (is_bad(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}

int main(void) {
    printf("first=%d\\n", first_bad(8));
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 46,
  },
  {
    id: "cf-tree-001",
    source: "self",
    title: "Binary Tree Inorder Walk",
    difficulty: "medium",
    topics: ["Tree", "Pointer", "Function"],
    examRelevance: "high",
    url: "",
    description:
      "Build a small binary tree with heap nodes and walk it in-order (stack frames + pointers).",
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
    visualizable: true,
    recommendedOrder: 31,
  },
  {
    id: "cf-tree-002",
    source: "self",
    title: "Binary Tree Preorder Walk",
    difficulty: "medium",
    topics: ["Tree", "Traversal", "Function"],
    examRelevance: "high",
    url: "",
    description: "Visit root, then left subtree, then right subtree (preorder recursion).",
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

void preorder(struct Node *r) {
    if (r == NULL) return;
    printf("%d ", r->val);
    preorder(r->left);
    preorder(r->right);
}

int main(void) {
    struct Node *root = mk(1);
    root->left = mk(2);
    root->right = mk(3);
    root->left->left = mk(4);
    root->left->right = mk(5);
    preorder(root);
    printf("\\n");
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 32,
  },
  {
    id: "cf-tree-003",
    source: "self",
    title: "Binary Tree Postorder Walk",
    difficulty: "medium",
    topics: ["Tree", "Traversal", "Function"],
    examRelevance: "medium",
    url: "",
    description: "Visit left, right, then root (postorder recursion).",
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

void postorder(struct Node *r) {
    if (r == NULL) return;
    postorder(r->left);
    postorder(r->right);
    printf("%d ", r->val);
}

int main(void) {
    struct Node *root = mk(1);
    root->left = mk(2);
    root->right = mk(3);
    root->left->left = mk(4);
    postorder(root);
    printf("\\n");
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 33,
  },
  {
    id: "cf-tree-004",
    source: "pta",
    title: "Tree Node Count",
    difficulty: "medium",
    topics: ["Tree", "Traversal", "Complexity"],
    examRelevance: "medium",
    url: "https://pintia.cn/",
    description: "Count nodes with a recursive post-order accumulation.",
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

int count(struct Node *r) {
    if (r == NULL) return 0;
    return 1 + count(r->left) + count(r->right);
}

int main(void) {
    struct Node *root = mk(4);
    root->left = mk(2);
    root->right = mk(6);
    root->left->left = mk(1);
    printf("n=%d\\n", count(root));
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 34,
  },
  {
    id: "cf-tree-005",
    source: "self",
    title: "Binary Search Tree Insert",
    difficulty: "medium",
    topics: ["Tree", "Search", "Pointer"],
    examRelevance: "high",
    url: "",
    description: "Insert keys into a BST by walking left/right comparisons; then inorder-print.",
    code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int val;
    struct Node *left;
    struct Node *right;
};

struct Node *insert(struct Node *root, int v) {
    if (root == NULL) {
        struct Node *n = (struct Node *)malloc(sizeof(struct Node));
        n->val = v;
        n->left = NULL;
        n->right = NULL;
        return n;
    }
    if (v < root->val) root->left = insert(root->left, v);
    else root->right = insert(root->right, v);
    return root;
}

void inorder(struct Node *r) {
    if (r == NULL) return;
    inorder(r->left);
    printf("%d ", r->val);
    inorder(r->right);
}

int main(void) {
    struct Node *root = NULL;
    root = insert(root, 5);
    root = insert(root, 3);
    root = insert(root, 8);
    root = insert(root, 1);
    root = insert(root, 4);
    inorder(root);
    printf("\\n");
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 35,
  },
  {
    id: "cf-rec-002",
    source: "fundamentals",
    title: "Recursion Fibonacci",
    difficulty: "medium",
    topics: ["Recursion", "Function", "Complexity"],
    examRelevance: "high",
    url: "",
    description: "Compute fib(6) with naive recursion; watch the call tree explode.",
    code: `#include <stdio.h>

int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

int main(void) {
    printf("fib(6)=%d\\n", fib(6));
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 17,
  },
  {
    id: "cf-rec-003",
    source: "fundamentals",
    title: "Recursion Sum 1..N",
    difficulty: "easy",
    topics: ["Recursion", "Function"],
    examRelevance: "medium",
    url: "",
    description: "Sum 1..n with a simple base-case + recursive-call pattern.",
    code: `#include <stdio.h>

int sum(int n) {
    if (n <= 0) return 0;
    return n + sum(n - 1);
}

int main(void) {
    printf("sum(10)=%d\\n", sum(10));
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 18,
  },
  {
    id: "cf-rec-004",
    source: "self",
    title: "Recursion GCD",
    difficulty: "medium",
    topics: ["Recursion", "Function"],
    examRelevance: "medium",
    url: "",
    description: "Euclidean algorithm as tail-ish recursion: gcd(a,b) = gcd(b, a%b).",
    code: `#include <stdio.h>

int gcd(int a, int b) {
    if (b == 0) return a;
    return gcd(b, a % b);
}

int main(void) {
    printf("gcd=%d\\n", gcd(48, 18));
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 19,
  },
  {
    id: "cf-rec-005",
    source: "pta",
    title: "Tower of Hanoi",
    difficulty: "hard",
    topics: ["Recursion", "Function", "Complexity"],
    examRelevance: "medium",
    url: "https://pintia.cn/",
    description: "Move n disks across three pegs with the classic three recursive calls.",
    code: `#include <stdio.h>

int steps = 0;

void hanoi(int n, char from, char aux, char to) {
    if (n <= 0) return;
    hanoi(n - 1, from, to, aux);
    steps = steps + 1;
    hanoi(n - 1, aux, from, to);
}

int main(void) {
    hanoi(3, 'A', 'B', 'C');
    printf("steps=%d\\n", steps);
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 36,
  },
  {
    id: "cf-graph-001",
    source: "self",
    title: "Adjacency Matrix Graph",
    difficulty: "medium",
    topics: ["Graph", "Array", "Traversal"],
    examRelevance: "medium",
    url: "",
    description: "Store a small undirected graph as an adjacency matrix and list each vertex's neighbors.",
    code: `#include <stdio.h>

int main(void) {
    int adj[4][4] = {
        {0, 1, 1, 0},
        {1, 0, 0, 1},
        {1, 0, 0, 1},
        {0, 1, 1, 0},
    };
    int i, j;
    for (i = 0; i < 4; i++) {
        printf("v%d:", i);
        for (j = 0; j < 4; j++) {
            if (adj[i][j]) printf(" %d", j);
        }
        printf("\\n");
    }
    return 0;
}
`,
    recommendedOrder: 37,
  },
  {
    id: "cf-graph-002",
    source: "self",
    title: "BFS on Adjacency Matrix",
    difficulty: "hard",
    topics: ["Graph", "Traversal", "Queue"],
    examRelevance: "high",
    url: "",
    description: "Breadth-first search from vertex 0 using a fixed queue and a visited array.",
    code: `#include <stdio.h>

#define N 6

void bfs(int adj[N][N], int start) {
    int visited[N] = {0};
    int queue[N];
    int front = 0, rear = 0;
    int i;
    visited[start] = 1;
    queue[rear++] = start;
    while (front < rear) {
        int u = queue[front++];
        printf("%d ", u);
        for (i = 0; i < N; i++) {
            if (adj[u][i] && !visited[i]) {
                visited[i] = 1;
                queue[rear++] = i;
            }
        }
    }
}

int main(void) {
    int adj[N][N] = {{0}};
    adj[0][1] = adj[1][0] = 1;
    adj[0][2] = adj[2][0] = 1;
    adj[1][3] = adj[3][1] = 1;
    adj[2][4] = adj[4][2] = 1;
    adj[3][5] = adj[5][3] = 1;
    bfs(adj, 0);
    printf("\\n");
    return 0;
}
`,
    recommendedOrder: 38,
  },
  {
    id: "cf-graph-003",
    source: "self",
    title: "DFS Recursive on Adjacency Matrix",
    difficulty: "hard",
    topics: ["Graph", "Traversal", "Function"],
    examRelevance: "high",
    url: "",
    description: "Depth-first search with a recursive helper and a visited array.",
    code: `#include <stdio.h>

#define N 5

int adj[N][N];
int visited[N];

void dfs(int u) {
    int v;
    visited[u] = 1;
    printf("%d ", u);
    for (v = 0; v < N; v++) {
        if (adj[u][v] && !visited[v]) dfs(v);
    }
}

int main(void) {
    adj[0][1] = adj[1][0] = 1;
    adj[0][2] = adj[2][0] = 1;
    adj[1][3] = adj[3][1] = 1;
    adj[2][4] = adj[4][2] = 1;
    dfs(0);
    printf("\\n");
    return 0;
}
`,
    recommendedOrder: 39,
  },
  {
    id: "cf-point-002",
    source: "gd",
    title: "Pointer Swap Two Ints",
    difficulty: "medium",
    topics: ["Pointer", "Function"],
    examRelevance: "high",
    url: "",
    description: "Swap two integers through pointers so the change is visible in the caller.",
    code: `#include <stdio.h>

void swap(int *a, int *b) {
    int t = *a;
    *a = *b;
    *b = t;
}

int main(void) {
    int x = 1;
    int y = 2;
    swap(&x, &y);
    printf("x=%d y=%d\\n", x, y);
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 47,
  },
  {
    id: "cf-point-003",
    source: "pta",
    title: "Pointer to Array Max",
    difficulty: "medium",
    topics: ["Pointer", "Array", "Function"],
    examRelevance: "medium",
    url: "https://pintia.cn/",
    description: "Find the maximum by walking a pointer across an array (no index variable).",
    code: `#include <stdio.h>

int max_of(int *a, int n) {
    int m = *a;
    int i;
    for (i = 1; i < n; i++) {
        if (*(a + i) > m) m = *(a + i);
    }
    return m;
}

int main(void) {
    int a[5] = {3, 9, 2, 7, 5};
    printf("max=%d\\n", max_of(a, 5));
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 48,
  },
  {
    id: "cf-fn-002",
    source: "gd",
    title: "Return by Value vs Pointer Out-param",
    difficulty: "medium",
    topics: ["Function", "Pointer"],
    examRelevance: "high",
    url: "",
    description: "Contrast returning a sum with writing it through an out-parameter.",
    code: `#include <stdio.h>

int sum_ret(int a, int b) {
    return a + b;
}

void sum_out(int a, int b, int *out) {
    *out = a + b;
}

int main(void) {
    int r = sum_ret(3, 4);
    int out = 0;
    sum_out(5, 6, &out);
    printf("ret=%d out=%d\\n", r, out);
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 49,
  },
  {
    id: "cf-fn-003",
    source: "self",
    title: "Recursion Call Stack Depth",
    difficulty: "medium",
    topics: ["Function", "Recursion", "Complexity"],
    examRelevance: "medium",
    url: "",
    description: "Depth-first recursion that returns the current call depth at the base case.",
    code: `#include <stdio.h>

int depth(int n) {
    if (n <= 0) return 0;
    return 1 + depth(n - 1);
}

int main(void) {
    printf("depth=%d\\n", depth(5));
    return 0;
}
`,
    visualizable: true,
    recommendedOrder: 50,
  },
];

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}
