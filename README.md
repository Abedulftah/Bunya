# فيجوالجو بالعربية — Arabic VisuAlgo

تطبيق ويب تفاعلي بالعربية (RTL) لتصوّر هياكل البيانات والخوارزميات خطوة بخطوة، مستوحى من [VisuAlgo](https://visualgo.net)، وموجّه لطلاب المرحلة الثانوية العرب استعدادًا لامتحان البجروت.

An interactive RTL Arabic web app that visualizes data structures and algorithms step by step, inspired by VisuAlgo and aimed at Arab high-school students preparing for the Bagrut matriculation exam.

## Features — الميزات

- **أربعة هياكل بيانات**: المكدس (Stack)، الطابور (Queue)، فرز الفقاعات (Bubble Sort)، القائمة الموصولة (Linked List)
- **محاكاة قابلة للتمرير**: تشغيل، إيقاف مؤقت، خطوة للأمام **وللخلف**، شريط سرعة، إعادة تعيين
- **محرر كود تفاعلي**: العمليات المعرّفة في تعليمات المشروع — `push`, `pop`, `enqueue`, `dequeue` — تتحول إلى حركة سطرًا بسطر، مع تمييز السطر النشط ورسائل خطأ بالعربية (هيكلا الفرز والقائمة يُحرَّكان من أزرار العمليات)
- **عام النوع مثل القالب T**: القيم أعداد أو نصوص (`push("أحمد")‎`)، ومَن يصرّح `Stack<int>` يُمنع من إدخال نص — رسالة خطأ تشرح عدم تطابق النوع
- **كود برمجي متزامن**: يُضاء سطر الكود المقابل لكل خطوة في الحركة
- يدعم الأرقام العربية المشرقية (٠١٢٣٤٥٦٧٨٩) في محرر الكود

## Run locally — التشغيل محليًا

```bash
npm install
npm run dev      # http://localhost:5173
```

Other commands:

```bash
npm run build    # type-check + production build (dist/)
npm run lint     # eslint
node scripts/verify-app.mjs   # browser-driven smoke test (needs dev server + Chrome)
```

## Deployment — النشر

Pushing to `main` on GitHub auto-deploys to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) (enable **Settings → Pages → Source: GitHub Actions** once).

## Tech

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · lucide-react

---

مشروع تعليمي شخصي ضمن مساق التدريب العملي في التخنيون. Educational personal project for a Technion teaching-practicum course; inspired by VisuAlgo.net (not affiliated).
