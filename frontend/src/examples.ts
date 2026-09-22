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
];
