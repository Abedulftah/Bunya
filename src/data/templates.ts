import type { OpKind, TabKind } from '../types';

/** Initial editor program per tab (Java/C#-style, parsed by the interpreter). */
export const CODE_TEMPLATES: Record<TabKind, string> = {
  stack: `// جرّب بنفسك: عدّل الكود ثم اضغط "تشغيل الكود"
Stack<int> mystack = new Stack<int>();
mystack.push(5);
mystack.push(12);
mystack.push(8);
mystack.pop();`,
  queue: `// الطابور: أول من يدخل أول من يخرج (FIFO)
Queue<int> myqueue = new Queue<int>();
myqueue.enqueue(3);
myqueue.enqueue(7);
myqueue.enqueue(11);
myqueue.dequeue();`,
  sort: `// عرّف المصفوفة ثم نفّذ فرز الفقاعات
int[] arr = {29, 10, 45, 18, 33};
bubbleSort(arr);`,
  list: `// القائمة الموصولة: insertAt(الموقع, القيمة)
LinkedList<int> mylist = new LinkedList<int>();
mylist.insertHead(7);
mylist.insertTail(20);
mylist.insertAt(1, 13);
mylist.deleteAt(1);`,
};

/** Which operation's pseudo-code to show when a tab is first opened. */
export const DEFAULT_PSEUDO_OP: Record<TabKind, OpKind> = {
  stack: 'push',
  queue: 'enqueue',
  sort: 'bubbleSort',
  list: 'insertAt',
};
