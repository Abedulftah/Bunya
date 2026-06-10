import { createRequire } from 'module';
import { mkdirSync } from 'fs';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const URL = process.env.APP_URL ?? 'http://localhost:5173/';
const OUT = '/tmp/visverify';
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];

function check(name, ok, extra = '') {
  results.push({ name, ok, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
}

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 950 });
page.on('pageerror', e => console.log('PAGE ERROR:', e.message));

const shot = name => page.screenshot({ path: `${OUT}/${name}.png` });
const status = () => page.evaluate(() => document.querySelector('[role=status]')?.textContent ?? '');
const bodyHas = text => page.evaluate(t => document.body.textContent.includes(t), text);
const clickBtn = text =>
  page.evaluate(t => {
    const el = [...document.querySelectorAll('button')].find(b => b.textContent.includes(t) && !b.disabled);
    if (!el) throw new Error('button not found/disabled: ' + t);
    el.click();
  }, text);
const setSpeed = v =>
  page.evaluate(v => {
    const r = document.querySelector('input[type=range]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(r, String(v));
    r.dispatchEvent(new Event('input', { bubbles: true }));
  }, v);
const setToolbarValue = v =>
  page.evaluate(v => {
    const input = document.querySelector('input[type=text]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, v);
const setEditor = text =>
  page.evaluate(t => {
    const ta = document.querySelector('textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, t);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }, text);
async function waitStatus(substr, timeout = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const s = await status();
    if (s.includes(substr)) return s;
    await sleep(300);
  }
  return null;
}

await page.goto(URL, { waitUntil: 'networkidle0' });
await sleep(800);
await shot('01-stack-initial');

// --- Stack push/pop via buttons ---
await setSpeed(2);
await clickBtn('push');
await sleep(900);
await shot('02-stack-push-mid');
check('stack push finishes', !!(await waitStatus('تمت إضافة', 8000)));

// homogeneity: the stack currently holds ints — a string must be rejected
await setToolbarValue('أحمد');
await sleep(150);
await clickBtn('push');
check('toolbar rejects mixing string into int stack', !!(await waitStatus('نوع عناصر الهيكل', 8000)));
await shot('03-type-mixed-toolbar');

await clickBtn('pop');
check('stack pop finishes', !!(await waitStatus('تمت إزالة', 8000)));

// --- Step backward then forward ---
await setToolbarValue('42');
await sleep(150);
await clickBtn('push');
await waitStatus('تمت إضافة', 8000);
await page.evaluate(t => {
  [...document.querySelectorAll('button')].find(b => (b.getAttribute('title') || '').includes(t)).click();
}, 'خطوة للخلف');
await sleep(300);
const stepCounter = await page.evaluate(() => [...document.querySelectorAll('span')].map(s => s.textContent).find(t => t?.includes('الخطوة')));
check('step backward works', !!stepCounter, stepCounter ?? '');

// --- Queue ---
await clickBtn('Queue');
await sleep(400);
await clickBtn('enqueue');
await sleep(900);
await shot('04-queue-enqueue-mid');
check('enqueue finishes', !!(await waitStatus('انضم', 8000)));
await clickBtn('dequeue');
check('dequeue finishes', !!(await waitStatus('غادر', 8000)));
await setToolbarValue('سارة');
await sleep(150);
await clickBtn('enqueue');
check('toolbar rejects mixing string into int queue', !!(await waitStatus('نوع عناصر الهيكل', 8000)));

// --- Sort (toolbar-only; editor replaced by info card) ---
await clickBtn('Bubble Sort');
await sleep(400);
check('sort tab shows code-unavailable card', await bodyHas('تنفيذ الكود متاح'));
await clickBtn('ابدأ الفرز');
await sleep(1800);
await shot('05-sort-comparing');
await setSpeed(4);
check('sort completes', !!(await waitStatus('اكتمل الفرز', 60000)));

// --- Linked list: insertAt with traversal + bypass arrow (toolbar-only) ---
await clickBtn('Linked List');
await sleep(400);
check('list tab shows code-unavailable card', await bodyHas('تنفيذ الكود متاح'));
await setToolbarValue('13'); // list holds ints — keep T consistent
await sleep(150);
await setSpeed(1);
await clickBtn('في موقع'); // insertAt(1, 13)
await sleep(2800);
await shot('06-list-insert-mid');
check('insertAt finishes', !!(await waitStatus('تمت إضافة', 15000)));
await setSpeed(2);
await clickBtn('من موقع'); // deleteAt(1)
check('deleteAt finishes', !!(await waitStatus('تم حذف', 15000)));

// --- Code runner on stack tab: declaration resets, then string pushes ---
await clickBtn('Stack');
await sleep(400);
await setSpeed(4);
await clickBtn('تشغيل الكود');
await sleep(1200);
await shot('07-editor-running');
check('template (declare + string pushes) runs to pop', !!(await waitStatus('تمت إزالة', 30000)));

// --- Interpreter error reporting ---
await setEditor('mystack.push(5);\nmystack.fly();');
await sleep(200);
await clickBtn('تشغيل الكود');
await sleep(400);
check('unknown method rejected with line', await bodyHas('عملية غير معروفة'));
await shot('08-editor-error');

await setEditor('mylist.insertHead(5);');
await sleep(200);
await clickBtn('تشغيل الكود');
await sleep(400);
check('non-spec method (insertHead) rejected from code', await bodyHas('عملية غير معروفة'));

await setEditor('myqueue.enqueue(3);');
await sleep(200);
await clickBtn('تشغيل الكود');
await sleep(400);
check('wrong-tab op rejected', await bodyHas('غير متاحة'));

// --- Generic type enforcement (like template T) ---
await setEditor('Stack<int> s = new Stack<int>();\ns.push("أحمد");');
await sleep(200);
await clickBtn('تشغيل الكود');
await sleep(400);
check('declared Stack<int> rejects a string value', await bodyHas('لا تطابق النوع'));
await shot('09-type-mismatch');

await setEditor('Stack<string> s = new Stack<string>();\ns.push("نور");\ns.push("هدى");\ns.pop();');
await sleep(200);
await clickBtn('تشغيل الكود');
check('Stack<string> accepts strings', !!(await waitStatus('تمت إزالة هدى', 20000)));

await setEditor('mystack.push(hello);');
await sleep(200);
await clickBtn('تشغيل الكود');
await sleep(400);
check('unquoted text gets quotes hint', await bodyHas('علامتي اقتباس'));

// declaration creates a FRESH empty structure: ints work right after a string stack
await setEditor('Stack<int> s = new Stack<int>();\ns.push(1);');
await sleep(200);
await clickBtn('تشغيل الكود');
check('declaration resets structure (int push after string stack)', !!(await waitStatus('تمت إضافة 1', 15000)));

// without a declaration, ops chain onto current (int) data — a string now fails at runtime
await setEditor('mystack.push("نور");');
await sleep(200);
await clickBtn('تشغيل الكود');
check('undeclared mixing fails at runtime', !!(await waitStatus('نوع عناصر الهيكل', 15000)));

// --- Empty pop underflow (runtime error halts) ---
await setEditor(Array(10).fill('mystack.pop();').join('\n'));
await sleep(200);
await clickBtn('تشغيل الكود');
check('runtime underflow halts with error', !!(await waitStatus('المكدس فارغ', 30000)));
await shot('10-underflow-error');

console.log('\n--- summary ---');
console.log(results.filter(r => r.ok).length + '/' + results.length + ' passed');
await browser.close();
process.exit(results.every(r => r.ok) ? 0 : 1);
