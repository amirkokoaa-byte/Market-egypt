# دليل سلاسل السوبر ماركت في مصر | Egypt Supermarkets Hub 🇪🇬

المنصة الشاملة لإدارة واستعراض سلاسل وفروع السوبر ماركت والهايبر ماركت في مصر، مع إمكانية رفع الفروع مباشرة من ملفات Excel، أرقام الخطوط الساخنة، وروابط التواصل، وأعياد ميلاد السلاسل.

---

## 🚀 كيفية رفع وتشغيل المشروع على GitHub و Vercel

المشروع جاهز 100% ومتوافق تماماً مع **Vercel** و **GitHub**:

### 1. الرفع على GitHub (Push to GitHub)
إذا كنت تستخدم Git محلياً:
```bash
git init
git add .
git commit -m "Initial commit - Supermarket Hub"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

---

### 2. النشر على Vercel (Deploy on Vercel)
تم تجهيز ملف `vercel.json` تلقائياً لتفادي مشاكل المسارات وشاشات الـ 404:
1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard).
2. انقر على **"Add New..."** ثم **"Project"**.
3. اختر مستودع الـ GitHub الخاص بك واضغط **"Import"**.
4. الإعدادات الافتراضية ستكون مضبوطة تلقائياً:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. انقر **"Deploy"** وخلال أقل من 30 ثانية سيعمل موقعك بنجاح!

---

### 3. حل مشكلة الشاشة البيضاء أو عدم ظهور الموقع (Fix White Screen & 404):
- تم ضبط `base: './'` في `vite.config.ts` لضمان تحميل جميع ملفات الـ CSS والـ JS بروابط نسبية صحيحة سواء على النطاق الرئيسي أو أي مجلد فرعي.
- تم ضبط `vercel.json` لتوجيه جميع المسارات (SPA Rewrites) إلى `index.html`.
- تم إضافة سير عمل جاهز لـ GitHub Actions في `.github/workflows/deploy.yml` للنشر التلقائي على GitHub Pages في حال رغبت بذلك.

---

## 🛠️ التشغيل محلياً (Local Development)
```bash
npm install
npm run dev
```

لعمل بناء الإنتاج (Production Build):
```bash
npm run build
```
