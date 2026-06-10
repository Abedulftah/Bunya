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
await clickBtn('pop');
await sleep(900);
await shot('03-stack-pop-mid');
check('stack pop finishes', !!(await waitStatus('تمت إزالة', 8000)));

// --- Step backward then forward ---
await clickBtn('push');
await waitStatus('تمت إضافة', 8000);
const backBtn = 'خطوة للخلف';
await page.evaluate(t => {
  [...document.querySelectorAll('button')].find(b => (b.getAttribute('title') || '').includes(t)).click();
}, backBtn);
await sleep(300);
const stepCounter = await page.evaluate(() => [...document.querySelectorAll('span')].map(s => s.textContent).find(t => t?.includes('الخطوة')));
check('step backward works', !!stepCounter, stepCounter ?? '');
await shot('04-step-back');

// --- Queue ---
await clickBtn('Queue');
await sleep(400);
await clickBtn('enqueue');
await sleep(900);
await shot('05-queue-enqueue-mid');
check('enqueue finishes', !!(await waitStatus('انضم', 8000)));
await clickBtn('dequeue');
check('dequeue finishes', !!(await waitStatus('غادر', 8000)));
await shot('06-queue-after');

// --- Sort ---
await clickBtn('Bubble Sort');
await sleep(400);
await clickBtn('ابدأ الفرز');
await sleep(1800);
await shot('07-sort-comparing');
await setSpeed(4);
check('sort completes', !!(await waitStatus('اكتمل الفرز', 60000)));
await shot('08-sort-done');

// --- Linked list: insertAt with traversal + bypass arrow ---
await clickBtn('Linked List');
await sleep(400);
await setSpeed(1);
await clickBtn('في موقع'); // insertAt(1, 7)
await sleep(2800);
await shot('09-list-insert-mid');
check('insertAt finishes', !!(await waitStatus('تمت إضافة', 15000)));
await setSpeed(2);
await clickBtn('من موقع'); // deleteAt(1)
await sleep(1600);
await shot('10-list-delete-mid');
check('deleteAt finishes', !!(await waitStatus('تم حذف', 15000)));
await shot('11-list-after');

// --- Code runner on stack tab ---
await clickBtn('Stack');
await sleep(400);
await setSpeed(4);
await clickBtn('تشغيل الكود');
await sleep(1200);
await shot('12-editor-running');
check('code run reaches pop', !!(await waitStatus('تمت إزالة', 30000)));

// --- Interpreter error reporting ---
await page.evaluate(() => {
  const ta = document.querySelector('textarea');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(ta, 'mystack.push(5);\nmystack.fly();');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(200);
await clickBtn('تشغيل الكود');
await sleep(400);
const errText = await page.evaluate(() => document.body.textContent.includes('عملية غير معروفة'));
check('interpreter reports unknown op with line', errText);
await shot('13-editor-error');

// --- Wrong-tab op error ---
await page.evaluate(() => {
  const ta = document.querySelector('textarea');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(ta, 'myqueue.enqueue(3);');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(200);
await clickBtn('تشغيل الكود');
await sleep(400);
check('wrong-tab op rejected', await page.evaluate(() => document.body.textContent.includes('غير متاحة')));

// --- Empty pop underflow (pop repeatedly) ---
await page.evaluate(() => {
  const ta = document.querySelector('textarea');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(ta, 'mystack.pop();\nmystack.pop();\nmystack.pop();\nmystack.pop();\nmystack.pop();\nmystack.pop();\nmystack.pop();\nmystack.pop();');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(200);
await clickBtn('تشغيل الكود');
check('runtime underflow halts with error', !!(await waitStatus('المكدس فارغ', 30000)));
await shot('14-underflow-error');

console.log('\n--- summary ---');
console.log(results.filter(r => r.ok).length + '/' + results.length + ' passed');
await browser.close();
process.exit(results.every(r => r.ok) ? 0 : 1);
