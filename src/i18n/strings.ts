import { MAX_LIST, MAX_QUEUE, MAX_STACK, MAX_VALUE_LEN } from '../constants';
import type { Value } from '../types';

/** Single source of truth for every Arabic string in the UI. */
export const S = {
  appTitle: 'فيجوالجو بالعربية',
  appSubtitle: 'تصوّر هياكل البيانات والخوارزميات خطوة بخطوة — لطلاب البجروت',
  inspiredBy: 'مشروع تعليمي مستوحى من VisuAlgo.net',

  tabs: {
    stack: 'المكدس',
    queue: 'الطابور',
    sort: 'فرز الفقاعات',
    list: 'القائمة الموصولة',
  },
  tabsEn: {
    stack: 'Stack',
    queue: 'Queue',
    sort: 'Bubble Sort',
    list: 'Linked List',
  },

  controls: {
    play: 'تشغيل',
    replay: 'إعادة التشغيل',
    pause: 'إيقاف مؤقت',
    stepF: 'خطوة للأمام',
    stepB: 'خطوة للخلف',
    reset: 'إعادة التعيين',
    speed: 'السرعة',
    slow: 'بطيء',
    fast: 'سريع',
    step: (a: number, b: number) => `الخطوة ${a} / ${b}`,
  },

  statusIdle: 'اختر عمليةً من الأزرار أو شغّل الكود في المحرر لبدء المحاكاة',

  legend: {
    title: 'مفتاح الألوان:',
    default: 'عادي',
    active: 'نشط',
    comparing: 'مقارنة',
    swapping: 'تبديل',
    sorted: 'مرتّب',
    entering: 'جديد',
  },

  editor: {
    title: 'محرر الكود — جرّب بنفسك',
    run: 'تشغيل الكود',
    running: 'جارٍ التنفيذ…',
    resetCode: 'استرجاع المثال',
    pseudoTitle: 'الكود البرمجي للعملية',
    codeOnlyFor: 'تنفيذ الكود متاح لتبويبَي المكدس والطابور، وفق العمليات المعرّفة في تعليمات المشروع:',
    anyTypeNote: 'الهياكل عامّة النوع (Generic) — تقبل أي قيمة مثل القالب T: أعدادًا أو نصوصًا بين علامتي اقتباس.',
    useButtons: 'استخدم أزرار العمليات أعلى اللوحة لتحريك هذا الهيكل خطوة بخطوة.',
  },

  toolbar: {
    value: 'القيمة',
    index: 'الموقع',
    size: 'عدد العناصر',
    shuffle: 'ترتيب عشوائي',
    startSort: 'ابدأ الفرز',
  },

  ops: {
    push: 'الإدخال إلى المكدس — push',
    pop: 'الإخراج من المكدس — pop',
    enqueue: 'الإضافة إلى الطابور — enqueue',
    dequeue: 'الإزالة من الطابور — dequeue',
    bubbleSort: 'فرز الفقاعات — Bubble Sort',
    insertHead: 'إضافة في البداية — insertHead',
    insertTail: 'إضافة في النهاية — insertTail',
    insertAt: 'إضافة في موقع — insertAt',
    deleteHead: 'حذف من البداية — deleteHead',
    deleteTail: 'حذف من النهاية — deleteTail',
    deleteAt: 'حذف من موقع — deleteAt',
  } as Record<string, string>,

  stack: {
    empty: 'المكدس فارغ',
    top: 'القمة Top',
    checkFull: 'نتحقق: هل المكدس ممتلئ؟',
    full: `خطأ: المكدس ممتلئ! (الحد الأقصى ${MAX_STACK} عناصر)`,
    checkEmpty: 'نتحقق: هل المكدس فارغ؟',
    emptyErr: 'خطأ: المكدس فارغ! لا يمكن تنفيذ pop',
    raiseTop: 'نرفع مؤشر القمة top بمقدار 1',
    place: (v: Value) => `نضع القيمة ${v} في قمة المكدس`,
    pushed: (v: Value) => `تمت إضافة ${v} إلى المكدس ✓`,
    readTop: (v: Value) => `نقرأ قيمة القمة: ${v}`,
    lowerTop: 'نخفض مؤشر القمة top بمقدار 1',
    popped: (v: Value) => `تمت إزالة ${v} من المكدس ✓`,
  },

  queue: {
    empty: 'الطابور فارغ',
    front: 'المقدمة Front',
    rear: 'المؤخرة Rear',
    exitDir: 'اتجاه الخروج',
    checkFull: 'نتحقق: هل الطابور ممتلئ؟',
    full: `خطأ: الطابور ممتلئ! (الحد الأقصى ${MAX_QUEUE} عناصر)`,
    checkEmpty: 'نتحقق: هل الطابور فارغ؟',
    emptyErr: 'خطأ: الطابور فارغ! لا يمكن تنفيذ dequeue',
    placeRear: (v: Value) => `نضع القيمة ${v} في مؤخرة الطابور`,
    advanceRear: 'نقدّم مؤشر المؤخرة rear',
    enqueued: (v: Value) => `انضم ${v} إلى الطابور ✓`,
    readFront: (v: Value) => `نقرأ قيمة المقدمة: ${v}`,
    advanceFront: 'نقدّم مؤشر المقدمة front',
    dequeued: (v: Value) => `غادر ${v} الطابور ✓`,
  },

  sort: {
    start: (n: number) => `نبدأ فرز الفقاعات على ${n} عناصر`,
    compare: (a: number, b: number) => `نقارن بين ${a} و ${b}`,
    swap: (a: number, b: number) => `‏${a} أكبر من ${b} — نبدّل بينهما`,
    locked: (v: Value) => `العنصر ${v} وصل إلى مكانه النهائي`,
    done: 'اكتمل الفرز! المصفوفة مرتّبة ✓',
  },

  list: {
    empty: 'القائمة فارغة — head = ∅',
    checkEmpty: 'نتحقق: هل القائمة فارغة؟',
    emptyErr: 'خطأ: القائمة فارغة! لا يوجد ما نحذفه',
    full: `خطأ: القائمة ممتلئة! (الحد الأقصى ${MAX_LIST} عقد)`,
    badIndex: (i: number) => `خطأ: الموقع ${i} غير صالح في هذه القائمة!`,
    newNode: (v: Value) => `ننشئ عقدة جديدة قيمتها ${v}`,
    pointNext: 'نوجّه مؤشر العقدة الجديدة: n.next',
    updateHead: 'نحدّث head ليشير إلى العقدة الجديدة',
    updateTail: 'نحدّث tail ليشير إلى العقدة الجديدة',
    linkPrev: 'نوجّه cur.next إلى العقدة الجديدة',
    linkTailNext: 'نوجّه tail.next إلى العقدة الجديدة',
    cursorStart: 'نبدأ من الرأس: cur = head',
    cursorMove: (k: number) => `نتقدّم خطوة: cur = cur.next (الموقع ${k})`,
    inserted: (v: Value) => `تمت إضافة ${v} إلى القائمة ✓`,
    headAdvance: 'نحرّك head إلى العقدة التالية: head = head.next',
    bypass: 'نتجاوز العقدة المحذوفة: cur.next = cur.next.next',
    cutTail: 'نقطع الرابط الأخير: cur.next = null',
    removeNode: (v: Value) => `نحذف العقدة ${v}`,
    deleted: (v: Value) => `تم حذف ${v} من القائمة ✓`,
    onlyNode: 'هذه هي العقدة الوحيدة — ستصبح القائمة فارغة (head = null)',
  },

  errors: {
    line: (n: number, msg: string) => `السطر ${n}: ${msg}`,
    unknownOp: (m: string) => `عملية غير معروفة "${m}"`,
    wrongTab: (m: string) => `العملية "${m}" غير متاحة في هذا التبويب`,
    badArgs: (m: string, c: number) => `عدد المعاملات غير صحيح — ${m} يحتاج إلى ${c}`,
    badValue: 'قيمة غير صالحة — اكتب عددًا صحيحًا أو نصًا بين علامتي اقتباس',
    needQuotes: 'النصوص تُكتب بين علامتي اقتباس، مثل: push("أحمد")',
    tooLong: `القيمة طويلة — الحد الأقصى ${MAX_VALUE_LEN} رموز`,
    typeMismatch: (v: Value, t: string, name: string) =>
      `القيمة ${typeof v === 'string' ? `"${v}"` : v} لا تطابق النوع <${t}> الخاص بالمتغير ${name}`,
    syntax: 'صيغة غير مفهومة — تحقق من كتابة السطر',
    emptyProgram: 'لا يوجد كود قابل للتنفيذ — اكتب عمليات مثل ;mystack.push(5)',
  },

  footer: 'صُمّم كمشروع تعليمي لطلاب المرحلة الثانوية — هياكل البيانات للبجروت',
};
