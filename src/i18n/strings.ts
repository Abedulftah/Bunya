import { MAX_LIST, MAX_QUEUE, MAX_STACK, MAX_VALUE_LEN } from '../constants';
import type { Value } from '../types';

/** Single source of truth for every Arabic string in the UI. */
export const S = {
  appTitle: 'بُنيَة',
  appSubtitle: 'تصوّر هياكل البيانات والخوارزميات خطوة بخطوة',

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
  declCreated: (t?: string) => `ننشئ هيكلًا جديدًا فارغًا${t ? ` من النوع <${t}>` : ''} ✓`,
  isEmptyCheck: 'نفحص: هل الهيكل فارغ؟ (size == 0)',
  isEmptyResult: (empty: boolean) =>
    `isEmpty()‎ أعادت ${empty ? 'true — الهيكل فارغ' : 'false — الهيكل ليس فارغًا'}`,

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
    anyTypeNote: 'الهياكل عامّة النوع (Generic) — تقبل أي نوع مثل القالب T: أعدادًا أو نصوصًا بين علامتي اقتباس، لكن جميع عناصر الهيكل الواحد من النوع نفسه.',
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
    newStructure: 'إنشاء هيكل جديد — new',
    push: 'الإدخال إلى المكدس — insert',
    pop: 'الإخراج من المكدس — remove',
    top: 'قراءة القمة دون إزالة — top',
    enqueue: 'الإضافة إلى الطابور — insert',
    dequeue: 'الإزالة من الطابور — remove',
    head: 'قراءة المقدمة دون إزالة — head',
    isEmpty: 'هل الهيكل فارغ؟ — isEmpty',
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
    emptyErrTop: 'خطأ: المكدس فارغ! لا توجد قمة لقراءتها',
    peek: (v: Value) => `نقرأ قيمة القمة: ${v} — دون إزالتها`,
    peekDone: (v: Value) => `top()‎ أعادت ${v} والمكدس لم يتغيّر ✓`,
  },

  queue: {
    empty: 'الطابور فارغ',
    front: 'المقدمة Front',
    rear: 'المؤخرة Rear',
    exitDir: 'اتجاه الخروج',
    checkFull: 'نتحقق: هل الطابور ممتلئ؟',
    full: `خطأ: الطابور ممتلئ! (الحد الأقصى ${MAX_QUEUE} عناصر)`,
    checkEmpty: 'نتحقق: هل الطابور فارغ؟ (head == null)',
    emptyErr: 'خطأ: الطابور فارغ! remove تُعيد null',
    // insert(x): linked-list of Node<T> with head + tail (instruction.md)
    newNode: (v: Value) => `ننشئ عقدة جديدة: Node n = new Node(${v})`,
    linkHead: 'الطابور فارغ — نجعل المقدمة: this.head = n',
    linkTail: 'نربط العقدة بالمؤخرة: this.tail.setNext(n)',
    advanceTail: 'نُحدِّث مؤشر المؤخرة: this.tail = n',
    enqueued: (v: Value) => `انضم ${v} إلى الطابور ✓`,
    // remove(): unlink the head node
    readFront: (v: Value) => `نقرأ قيمة المقدمة: T v = this.head.getValue() = ${v}`,
    advanceHead: 'نُقدِّم المقدمة: this.head = this.head.getNext()',
    tailReset: 'الطابور أصبح فارغًا — نجعل this.tail = null',
    dequeued: (v: Value) => `غادر ${v} الطابور ✓`,
    emptyErrHead: 'خطأ: الطابور فارغ! head() تُعيد null',
    peek: (v: Value) => `نقرأ قيمة المقدمة: this.head.getValue() = ${v} — دون إزالتها`,
    peekDone: (v: Value) => `head()‎ أعادت ${v} والطابور لم يتغيّر ✓`,
  },

  sort: {
    start: (n: number) => `نبدأ فرز الفقاعات على ${n} عناصر`,
    scan: (j: number) => `الحلقة الداخلية j = ${j}: ننظر إلى العنصرين عند j و j+1`,
    compare: (a: number, b: number) => `نقارن بين ${a} و ${b}`,
    swap: (a: number, b: number) => `‏${a} أكبر من ${b} — نبدّل بينهما`,
    locked: (v: Value) => `العنصر ${v} وصل إلى مكانه النهائي`,
    done: 'اكتمل الفرز! المصفوفة مرتّبة ✓',
    newArray: (n: number) => `تمّ ضبط المصفوفة بـ ${n} عناصر جاهزة للفرز ✓`,
  },

  list: {
    empty: 'القائمة فارغة — head = ∅',
    checkEmpty: 'نتحقق: هل القائمة فارغة؟',
    emptyErr: 'خطأ: القائمة فارغة! لا يوجد ما نحذفه',
    full: `خطأ: القائمة ممتلئة! (الحد الأقصى ${MAX_LIST} عقد)`,
    badIndex: (i: number) => `خطأ: الموقع ${i} غير صالح في هذه القائمة!`,
    newNode: (v: Value) => `ننشئ عقدة جديدة قيمتها ${v}`,
    pointNext: 'نضبط مؤشر العقدة الجديدة: n.setNext(...)',
    updateHead: 'نحدّث this.head ليشير إلى العقدة الجديدة',
    updateTail: 'نحدّث this.tail ليشير إلى العقدة الجديدة',
    linkPrev: 'نربط العقدة السابقة بالجديدة: cur.setNext(n)',
    linkTailNext: 'نربط المؤخرة بالعقدة الجديدة: this.tail.setNext(n)',
    cursorStart: 'نبدأ من الرأس: cur = this.head',
    cursorMove: (k: number) => `نتقدّم خطوة: cur = cur.getNext() (الموقع ${k})`,
    inserted: (v: Value) => `تمت إضافة ${v} إلى القائمة ✓`,
    headAdvance: 'نحرّك head إلى العقدة التالية: this.head = this.head.getNext()',
    bypass: 'نتجاوز العقدة المحذوفة: cur.setNext(cur.getNext().getNext())',
    cutTail: 'نقطع الرابط الأخير: cur.setNext(null)',
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
    badIndex: 'موقع غير صالح — يجب أن يكون رقمًا صحيحًا غير سالب',
    needQuotes: 'النصوص تُكتب بين علامتي اقتباس، مثل: insert("أحمد")',
    tooLong: `القيمة طويلة — الحد الأقصى ${MAX_VALUE_LEN} رموز`,
    typeMismatch: (v: Value, t: string, name: string) =>
      `القيمة ${typeof v === 'string' ? `"${v}"` : v} لا تطابق النوع <${t}> الخاص بالمتغير ${name}`,
    typeMixed: (v: Value, t: string) =>
      `خطأ: القيمة ${typeof v === 'string' ? `"${v}"` : v} لا تطابق نوع عناصر الهيكل <${t}> — كل العناصر من نوع واحد، مثل القالب T`,
    syntax: 'صيغة غير مفهومة — تحقق من كتابة السطر',
    emptyProgram: 'لا يوجد كود قابل للتنفيذ — اكتب عمليات مثل ;mystack.insert(5)',
  },

  footer: 'صُمّم كمشروع تعليمي لطلاب المرحلة الثانوية ',

  fn: {
    modeLabel: 'وضع الدالة',
    localsTitle: 'المتغيرات المحلية',
    expectedLabel: 'المخرجات المتوقعة',
    expectedPlaceholder: 'مثال: s: [3,2,1], return: 3',
    testPass: 'النتيجة صحيحة ✓',
    testFail: 'النتيجة خاطئة ✗',
    actualLabel: 'الناتج الفعلي:',
    expectedLabelShort: 'المتوقع:',
    argsLabel: 'قيم المعاملات',
    argStructPlaceholder: 'مثال: [1, 2, 3]',
    argScalarPlaceholder: 'مثال: 5',
    unknownExpectedVar: (v: string) => `«${v}» ليس معاملاً أو متغيراً في الدالة`,
    noSignature: 'لم يُعثر على توقيع الدالة — اكتب: public static type name(args) {',
    noClass: 'يجب وضع الكود داخل صف: class Name { public static ... }',
    missingClassBrace: 'ينقص قوس فتح { بعد اسم الصف',
    badParam: (p: string) => `المعامل "${p}" غير صالح — مثال: Stack<int> s أو int n أو int[] arr`,
    wrongTab: 'وضع الدالة متاح فقط في تبويبَي المكدس والطابور',
    notAnArray: (v: string) => `"${v}" ليس مصفوفة — bubbleSort يعمل على مصفوفة int[]`,
    declStruct: (name: string, type: string, tp: string) =>
      `أنشأنا هيكلًا محليًا: ${type}<${tp}> ${name} = new ${type}()`,
    declArray: (name: string, n: number) =>
      `أنشأنا المصفوفة ${name} المكوّنة من ${n} عناصر`,
    declVar: (name: string, val: unknown) =>
      `أعلنّا المتغير ${name} = ${val}`,
    assignVar: (name: string, val: unknown) =>
      `حدّثنا المتغير ${name} = ${val}`,
    returned: (val: unknown) =>
      `الدالة أعادت القيمة: ${val}`,
    tooManyIterations: (max: number) =>
      `تجاوزت الحلقة الحد الأقصى (${max} تكرار) — تحقق من شرط الإنهاء`,
    emptyFunction: 'الدالة لا تحتوي على أي عمليات',
    whileCheck: 'نفحص شرط الحلقة while',
    whileExit: 'شرط while أصبح خاطئاً — نخرج من الحلقة',
    ifCheck: 'نفحص شرط if',

    // strict-parser errors
    badStatement: 'صيغة غير صالحة — تحقّق من كتابة السطر (فاصلة منقوطة؟ أقواس؟)',
    badExpr: (e: string) => `تعبير غير مفهوم: «${e}»`,
    unknownMethod: (m: string) =>
      `العملية "${m}" غير معروفة — المتاح: insert / remove / push / pop / enqueue / dequeue / top / head / isEmpty`,
    needsArg: (m: string) => `العملية "${m}" تحتاج معاملاً واحداً بين القوسين`,
    needsArgs: (m: string, n: number) =>
      `العملية "${m}" تحتاج ${n === 1 ? 'معاملاً واحداً' : `${n} معاملات`} بين القوسين`,
    noArgs: (m: string) => `العملية "${m}" لا تأخذ معاملات`,
    undeclaredVar: (v: string) => `المتغير "${v}" غير معرّف — أعلِن عنه قبل استخدامه`,
    notAStructure: (v: string) => `"${v}" ليس هيكل بيانات — لا يمكن استدعاء عمليات عليه`,
    assignToStructure: (v: string) => `لا يمكن إسناد قيمة إلى الهيكل "${v}" مباشرة`,
    strayElse: 'else بدون if مطابق',
    missingBrace: 'قوس إغلاق } مفقود — أغلق جميع الكتل',
    missingOpenBrace: 'ينقص قوس فتح { بعد توقيع الدالة',
    emptyBody: 'جسم الكتلة فارغ — أضف جملة واحدة على الأقل',
    extraAfterEnd: 'يوجد كود بعد قوس إغلاق الدالة — انقله إلى داخل الدالة',
    declMismatch: 'نوعا البنية على طرفَي الإعلان غير متطابقين',
    unsupportedKeyword: (k: string) => `"${k}" غير مدعوم في وضع الدالة`,
  },
};
