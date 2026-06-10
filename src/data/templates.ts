import type { OpKind, TabKind } from '../types';

/**
 * Initial editor program per tab, using the Bagrut class interfaces:
 * Stack — push/pop/top/isEmpty; Queue — insert/remove/head/isEmpty.
 * The sort and linked-list tabs are driven from the toolbar instead.
 */
export const CODE_TEMPLATES: Record<TabKind, string> = {
  stack: `// المكدس عام النوع T — جرّب <int> أو <string>، كل العناصر من نوع واحد
Stack<string> mystack = new Stack<string>();
mystack.push("أحمد");
mystack.push("ليلى");
mystack.top();
mystack.pop();`,
  queue: `// الطابور عام النوع T — أول من يدخل أول من يخرج (FIFO)
Queue<string> myqueue = new Queue<string>();
myqueue.insert("سامي");
myqueue.insert("نور");
myqueue.head();
myqueue.remove();`,
  sort: '',
  list: '',
};

/** Which operation's pseudo-code to show when a tab is first opened. */
export const DEFAULT_PSEUDO_OP: Record<TabKind, OpKind> = {
  stack: 'push',
  queue: 'enqueue',
  sort: 'bubbleSort',
  list: 'insertAt',
};
