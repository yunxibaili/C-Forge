export interface ExampleItem {
  id: string;
  name: string;
  code: string;
}

export const EXAMPLES: ExampleItem[] = [
  {
    id: "pointers",
    name: "Pointers",
    code: `#include <stdio.h>

int main(void) {
    int x = 10;
    int *p = &x;
    *p = 20;
    printf("x=%d\\n", x);
    return 0;
}
`,
  },
  {
    id: "vars",
    name: "Variables",
    code: `#include <stdio.h>

int main(void) {
    int a = 10;
    int b = 20;
    int c = a + b;
    printf("a=%d b=%d c=%d\\n", a, b, c);
    return 0;
}
`,
  },
  {
    id: "array",
    name: "Array",
    code: `#include <stdio.h>

int main(void) {
    int a[4] = {10, 20, 30, 40};
    int *p = a;
    printf("a[0]=%d\\n", a[0]);
    p++;
    printf("after p++: *p=%d\\n", *p);
    int i;
    for (i = 0; i < 4; i++) {
        a[i] = a[i] + 1;
    }
    printf("a[3]=%d\\n", a[3]);
    return 0;
}
`,
  },
  {
    id: "list",
    name: "Linked List",
    code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node *push_front(struct Node *head, int value) {
    struct Node *node = (struct Node *)malloc(sizeof(struct Node));
    node->data = value;
    node->next = head;
    return node;
}

void insert_after(struct Node *prev, int value) {
    struct Node *node = (struct Node *)malloc(sizeof(struct Node));
    node->data = value;
    node->next = prev->next;
    prev->next = node;
}

int main(void) {
    struct Node *head = NULL;
    head = push_front(head, 30);
    head = push_front(head, 20);
    head = push_front(head, 10);
    insert_after(head, 15);
    struct Node *cur = head;
    while (cur != NULL) {
        printf("%d ", cur->data);
        cur = cur->next;
    }
    printf("\\n");
    return 0;
}
`,
  },
  {
    id: "recursion",
    name: "Recursion",
    code: `#include <stdio.h>

int fact(int n) {
    if (n <= 1) return 1;
    return n * fact(n - 1);
}

int main(void) {
    int r = fact(4);
    printf("4!=%d\\n", r);
    return 0;
}
`,
  },
  {
    id: "bubble",
    name: "Bubble Sort",
    code: `#include <stdio.h>

int main(void) {
    int a[5] = {5, 2, 8, 1, 3};
    int n = 5;
    int i, j, tmp;
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {
                tmp = a[j];
                a[j] = a[j + 1];
                a[j + 1] = tmp;
            }
        }
    }
    for (i = 0; i < n; i++) {
        printf("%d ", a[i]);
    }
    printf("\\n");
    return 0;
}
`,
  },
  {
    id: "stack",
    name: "Stack",
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
    v = st[top - 1];
    printf("peek=%d top=%d\\n", v, top);
    return 0;
}
`,
  },
  {
    id: "queue",
    name: "Queue",
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
    printf("deq=%d front=%d rear=%d\\n", v, front, rear);
    v = dequeue(q, &front, &rear);
    printf("deq=%d front=%d rear=%d\\n", v, front, rear);
    printf("front_val=%d\\n", q[front]);
    return 0;
}
`,
  },
  {
    id: "bsearch",
    name: "Binary Search",
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
    return 0;
}
`,
  },
];
