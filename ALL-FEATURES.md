# 🚀 Poply - כל הפיצ'רים במערכת

## 📋 סקירה כללית
Poply היא מערכת CRM ושיווק מתקדמת עם יכולות אוטומציה, ניהול קמפיינים רב-ערוציים ומעקב מתקדם אחרי לקוחות.

---

## 🔐 מערכת הרשאות ומשתמשים

### תפקידים
- **USER** - משתמש רגיל
- **ADMIN** - מנהל מערכת
- **SUPER_ADMIN** - מנהל ראשי

### יכולות
- הרשמה והתחברות מאובטחת
- ניהול פרופיל משתמש
- הרשאות מבוססות תפקידים
- JWT authentication

---

## 👥 ניהול אנשי קשר

### תכונות בסיסיות
- הוספה, עריכה ומחיקה של אנשי קשר
- ייבוא מקובץ CSV
- ייצוא לקובץ CSV
- חיפוש וסינון מתקדם
- תיוג אנשי קשר (tags)

### שדות איש קשר
- פרטים אישיים (שם, אימייל, טלפון)
- פרטי חברה
- סטטוס (פעיל/לא פעיל/הסרה מרשימה)
- תגיות מותאמות אישית
- היסטוריית פעילות

### סטטוסים
- **ACTIVE** - פעיל
- **INACTIVE** - לא פעיל
- **UNSUBSCRIBED** - הוסר מרשימת תפוצה
- **BOUNCED** - כתובת לא תקינה

---

## 📧 מערכת קמפיינים

### סוגי קמפיינים
- **EMAIL** - קמפיין אימייל
- **SMS** - קמפיין SMS
- **PUSH** - התראות דחיפה

### יכולות
- עורך טקסט עשיר (Rich Text Editor)
- תבניות מוכנות
- תזמון קמפיינים
- A/B Testing
- מעקב אחרי ביצועים

### סטטוסי קמפיין
- **DRAFT** - טיוטה
- **SCHEDULED** - מתוזמן
- **SENDING** - בשליחה
- **SENT** - נשלח
- **FAILED** - נכשל

---

## 📱 מערכת SMS מתקדמת

### אינטגרציה עם SMS4FREE
- שליחת SMS בודד ומרובה
- ניהול יתרות SMS
- חבילות SMS למשתמשים
- הגדרת שם שולח מותאם אישית

### קיצור קישורים אוטומטי
- **קיצור ל-22 תווים** - חיסכון בעלויות
- **קישורים ייחודיים** - טוקן אישי לכל נמען
- **מעקב קליקים** - דיווח מלא על כל קליק
- **זיהוי לקוחות** - מעקב גם אחרי 30 יום

### API לשליחת SMS
- API פשוט ללקוחות חיצוניים
- אימות באמצעות API keys
- תיעוד API מלא
- דוגמאות קוד

### נתיבי API:
```
POST /api/v1/sms/send - שליחת SMS בודד
POST /api/v1/sms/send-bulk - שליחת SMS מרובה
GET /api/v1/sms/balance - בדיקת יתרה
GET /api/v1/sms/history - היסטוריית הודעות
GET /api/v1/sms/docs - תיעוד API
```

---

## 📊 מערכת מעקב מתקדמת

### סקריפט מעקב
- טעינה אסינכרונית (לא משפיע על ביצועים)
- מעקב אוטומטי אחרי:
  - צפיות בעמודים
  - קליקים על כפתורים וקישורים
  - שליחת טפסים
  - זמן שהייה בעמוד
  - עומק גלילה

### Sessions ומעקב המשכי
- יצירת session ייחודי לכל מבקר
- Cookie למשך 30 יום
- מעקב אחרי כל הפעילות באתר
- קישור פעילות לאיש קשר

### אירועים מותאמים אישית
```javascript
window.Poply.track('EVENT_NAME', {
  property1: 'value1',
  property2: 'value2'
});
```

---

## 🤖 מערכת אוטומציה

### טריגרים זמינים
- **CONTACT_CREATED** - איש קשר חדש נוצר
- **CONTACT_UPDATED** - איש קשר עודכן
- **ORDER_CREATED** - הזמנה חדשה
- **ORDER_COMPLETED** - הזמנה הושלמה
- **CART_ABANDONED** - עגלה נטושה
- **PAGE_VISITED** - ביקור בעמוד
- **EMAIL_OPENED** - אימייל נפתח
- **EMAIL_CLICKED** - קליק על קישור באימייל
- **SMS_LINK_CLICKED** - קליק על קישור ב-SMS
- **CUSTOM** - אירוע מותאם אישית

### פעולות אוטומטיות
- שליחת אימייל
- שליחת SMS
- עדכון תגיות
- הוספה לסגמנט
- Webhook לשירות חיצוני

---

## 💬 מערכת פופאפים

### סוגי פופאפים
- **EXIT_INTENT** - כוונת יציאה
- **TIME_DELAY** - השהיית זמן
- **SCROLL_PERCENTAGE** - אחוז גלילה
- **PAGE_VIEWS** - מספר צפיות בעמוד
- **CUSTOM** - מותאם אישית

### עיצוב ותכנון
- עורך ויזואלי
- תבניות מוכנות
- A/B Testing
- כללי תצוגה מתקדמים

---

## 📦 ניהול מוצרים

### יכולות
- קטלוג מוצרים מלא
- תמונות מוצר
- קטגוריות ותגיות
- ניהול מלאי
- מחירים ומבצעים

### סטטוסי מוצר
- **ACTIVE** - פעיל
- **INACTIVE** - לא פעיל
- **OUT_OF_STOCK** - אזל מהמלאי

---

## 🛒 ניהול הזמנות

### מעקב הזמנות
- פרטי הזמנה מלאים
- סטטוס הזמנה
- היסטוריית שינויים
- קישור לאיש קשר ומוצר

### סטטוסי הזמנה
- **PENDING** - ממתין
- **COMPLETED** - הושלם
- **CANCELLED** - בוטל
- **REFUNDED** - הוחזר

---

## 🎯 סגמנטים

### יצירת סגמנטים דינמיים
- תנאים מורכבים
- עדכון אוטומטי
- שילוב תנאים (AND/OR)
- סגמנטים מבוססי התנהגות

### דוגמאות לסגמנטים
- לקוחות שקנו בחודש האחרון
- אנשי קשר שפתחו אימייל אך לא לחצו
- מבקרים שביקרו בעמוד מסוים
- לקוחות עם ערך הזמנה גבוה

---

## 📈 דוחות ואנליטיקס

### דוחות זמינים
- ביצועי קמפיינים
- פעילות אנשי קשר
- המרות ומכירות
- דוחות SMS ומעקב קליקים
- דוחות אוטומציה

### מדדים מרכזיים
- שיעורי פתיחה
- שיעורי קליק
- שיעורי המרה
- ROI
- LTV

---

## 📬 מעקב אימיילים

### יכולות מעקב
- פיקסל מעקב לפתיחות
- מעקב קליקים על קישורים
- זיהוי bounces
- מעקב הסרות מרשימה

### אינטגרציה עם SendGrid
- Webhook לקבלת אירועים
- עדכון סטטוסים בזמן אמת
- דיווחים מפורטים

---

## 🔑 ניהול API Keys

### יכולות
- יצירת מפתחות API למשתמשים
- ניהול והשבתה של מפתחות
- הגבלת גישה לפי מפתח
- לוג שימוש

---

## 🎨 ממשק משתמש

### עיצוב
- עיצוב מודרני ונקי
- Responsive - עובד על כל המכשירים
- תמיכה מלאה בעברית (RTL)
- Dark mode (בקרוב)

### טכנולוגיות
- React + TypeScript
- Tailwind CSS
- Lucide Icons
- React Query

---

## 🔧 תשתית טכנית

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT Authentication

### Frontend
- React 18
- TypeScript
- Vite
- TanStack Query

### DevOps
- Docker support
- Environment variables
- Scalable architecture

---

## 🚀 התקנה מהירה

```bash
# Clone the repository
git clone https://github.com/yourusername/poply.git

# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Start development
npm run dev
```

---

## 📝 רשיון
MIT License - ניתן להשתמש בקוד לכל מטרה

---

## 🤝 תרומה
אנו מזמינים תרומות! אנא קראו את CONTRIBUTING.md לפרטים.

---

**פותח עם ❤️ על ידי צוות Poply**
