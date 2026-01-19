# راهنمای مدیریت کورس‌ها (Course Management Guide)

## 🎯 سیستم جدید: افزودن صفحات هفتگی

برای راحتی کار، یک سیستم خودکار ایجاد شده که با استفاده از فایل JSON، صفحات کورس را مدیریت می‌کند.

---

## 📝 چگونه صفحه جدید اضافه کنیم؟

### روش 1: استفاده از sessions.json (پیشنهادی)

1. **فایل `sessions.json` را در پوشه کورس باز کنید** (مثلاً `6670/sessions.json`)

2. **یک session جدید اضافه کنید:**

```json
{
  "course": {
    "code": "BCIS 6670",
    "title": "Topics in Information Systems",
    "semester": "Spring 2026",
    "instructor": "Dr. Anna Sidorova",
    "university": "University of North Texas"
  },
  "sessions": [
    {
      "week": 0,
      "id": "session0",
      "title": "Course Introduction",
      "description": "...",
      "file": "session0.html"
    },
    {
      "week": 3,
      "id": "session3",
      "title": "Week 3: New Topic",
      "description": "Description of week 3 content",
      "file": "session3.html"
    }
  ]
}
```

3. **فایل HTML جدید بسازید** (مثلاً `session3.html`)

4. **تمام!** صفحه جدید به صورت خودکار در لیست نمایش داده می‌شود.

---

## 📋 ساختار sessions.json

```json
{
  "course": {
    "code": "کد کورس",
    "title": "عنوان کورس",
    "semester": "ترم",
    "instructor": "نام استاد",
    "university": "نام دانشگاه"
  },
  "sessions": [
    {
      "week": 3,                    // شماره هفته (اختیاری)
      "id": "session3",             // شناسه یکتا
      "title": "عنوان جلسه",
      "description": "توضیحات",
      "file": "session3.html"       // نام فایل HTML
    }
  ]
}
```

---

## 🔧 مثال عملی

### قبل (روش قدیمی):
```html
<!-- باید دستی در index.html اضافه می‌کردید -->
<a href="session3.html" class="session-link-card">
    <h3>Week 3: New Topic</h3>
    <p>Description...</p>
</a>
```

### بعد (روش جدید):
```json
// فقط در sessions.json اضافه کنید
{
  "week": 3,
  "id": "session3",
  "title": "New Topic",
  "description": "Description...",
  "file": "session3.html"
}
```

---

## ✅ مزایای سیستم جدید

1. **سریع‌تر**: فقط JSON را ویرایش کنید، نیازی به ویرایش HTML نیست
2. **کم‌خطا**: ساختار JSON خطاهای تایپی را کاهش می‌دهد
3. **مرتب‌تر**: تمام اطلاعات کورس در یک فایل
4. **قابل استفاده مجدد**: می‌توانید از این JSON برای API یا ابزارهای دیگر استفاده کنید

---

## 🚀 نکات مهم

- فایل `sessions.json` باید در همان پوشه‌ای باشد که `index.html` قرار دارد
- نام فایل HTML باید دقیقاً با `file` در JSON مطابقت داشته باشد
- `course-loader.js` به صورت خودکار اجرا می‌شود و sessions را لود می‌کند
- اگر JSON لود نشود، پیام خطا نمایش داده می‌شود

---

## 📁 ساختار پیشنهادی برای کورس جدید

```
7770/
├── index.html          # صفحه اصلی کورس
├── sessions.json       # لیست جلسات (جدید!)
├── session0.html      # جلسه 0
├── session1.html      # جلسه 1
├── css/
│   └── style.css
└── images/
```

---

## 🔄 Migration (مهاجرت از روش قدیمی)

اگر کورس‌های قدیمی دارید:

1. فایل `sessions.json` را در پوشه کورس بسازید
2. اطلاعات جلسات را از `index.html` به JSON منتقل کنید
3. در `index.html`، بخش `<div class="session-grid">` را خالی بگذارید
4. `course-loader.js` را به scripts اضافه کنید

---

## 💡 پیشنهادات برای آینده

- [ ] اضافه کردن تاریخ برای هر session
- [ ] اضافه کردن تصویر برای هر session
- [ ] اضافه کردن وضعیت (published/draft)
- [ ] API endpoint برای دریافت sessions
- [ ] Admin panel برای مدیریت

---

**نویسنده:** Ali Safari  
**تاریخ:** 2026
