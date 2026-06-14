import type { OpKind, TabKind } from '../types';

/**
 * Initial editor program per tab — LeetCode-style: a class with one
 * `public static` method whose single structure parameter is bound to the
 * on-screen canvas. The body uses the Ministry of Education class interfaces.
 * Stack — push/pop/top/isEmpty; Queue — add/remove/head/isEmpty;
 * Linked List — insertHead/insertTail/insertAt/deleteHead/deleteTail/deleteAt;
 * Sort — bubbleSort(arr) on an int[].
 */
export const CODE_TEMPLATES: Record<TabKind, string> = {
  stack: `// المكدس عام النوع T — جرّب <int> أو <string>
class Solution {
  public static int demo(Stack<int> s) {
    s.push(10);
    s.push(20);
    int t = s.top();
    s.pop();
    return t;
  }
}`,

  queue: `// الطابور — أول من يدخل أول من يخرج (FIFO)
class Solution {
  public static int demo(Queue<int> q) {
    q.add(5);
    q.add(8);
    int h = q.head();
    q.remove();
    return h;
  }
}`,

  list: `// القائمة الموصولة — تقبل أي نوع T
class Solution {
  public static void demo(LinkedList<int> list) {
    list.insertHead(9);
    list.insertTail(4);
    list.insertAt(1, 7);
    list.deleteAt(0);
  }
}`,

  sort: `// فرز الفقاعات — استدعِ bubbleSort على المصفوفة
class Solution {
  public static void demo(int[] arr) {
    bubbleSort(arr);
  }
}`,
};

/** Which operation's pseudo-code to show when a tab is first opened. */
export const DEFAULT_PSEUDO_OP: Record<TabKind, OpKind> = {
  stack: 'push',
  queue: 'enqueue',
  sort: 'bubbleSort',
  list: 'insertAt',
};
