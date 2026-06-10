import type { OpKind, TabKind } from '../types';

/**
 * Initial editor program per tab, using the Ministry of Education class interfaces.
 * Stack — insert/remove/top/isEmpty; Queue — insert/remove/head/isEmpty.
 * Linked List — insertHead/insertTail/insertAt/deleteHead/deleteTail/deleteAt.
 * Sort — array declaration + bubbleSort call.
 */
export const CODE_TEMPLATES: Record<TabKind, string> = {
  stack: `// المكدس عام النوع T — جرّب <int> أو <string>، كل العناصر من نوع واحد
Stack<string> mystack = new Stack<string>();
mystack.insert("أحمد");
mystack.insert("ليلى");
mystack.top();
mystack.remove();`,

  queue: `// الطابور عام النوع T — أول من يدخل أول من يخرج (FIFO)
Queue<string> myqueue = new Queue<string>();
myqueue.insert("سامي");
myqueue.insert("نور");
myqueue.head();
myqueue.remove();`,

  list: `// القائمة الموصولة — تقبل أي نوع T
LinkedList<int> mylist = new LinkedList<int>();
mylist.insertHead(9);
mylist.insertTail(4);
mylist.insertAt(1, 7);
mylist.deleteAt(0);`,

  sort: `// ضع القيم التي تريد فرزها، ثم استدعِ bubbleSort
int[] arr = {5, 2, 8, 1, 9, 3};
bubbleSort(arr);`,
};

/** Which operation's pseudo-code to show when a tab is first opened. */
export const DEFAULT_PSEUDO_OP: Record<TabKind, OpKind> = {
  stack: 'push',
  queue: 'enqueue',
  sort: 'bubbleSort',
  list: 'insertAt',
};
