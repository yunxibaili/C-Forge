#include <stdio.h>

int main(void) {
    int a[4] = {10, 20, 30, 40};
    int *p = a;
    printf("a[0]=%d\n", a[0]);
    p++;
    printf("after p++: *p=%d\n", *p);
    int i;
    for (i = 0; i < 4; i++) {
        a[i] = a[i] + 1;
    }
    printf("a[3]=%d\n", a[3]);
    return 0;
}
