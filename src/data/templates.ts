import type { OpKind, TabKind } from '../types';

/**
 * Initial editor program per tab. Only the operations named in
 * instruction.md are executable from code (push/pop, enqueue/dequeue);
 * the sort and linked-list tabs are driven from the toolbar instead.
 */
export const CODE_TEMPLATES: Record<TabKind, string> = {
  stack: `// المكدس عام النوع — مثل القالب T: جرّب أعدادًا أو نصوصًا
Stack<string> mystack = new Stack<string>();
mystack.push("أحمد");
mystack.push("ليلى");
mystack.push("سارة");
mystack.pop();`,
  queue: `// الطابور يقبل أي نوع T — أول من يدخل أول من يخرج (FIFO)
Queue<T> myqueue = new Queue<T>();
myqueue.enqueue("سامي");
myqueue.enqueue(7);
myqueue.enqueue("نور");
myqueue.dequeue();`,
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
