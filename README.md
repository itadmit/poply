# Poply - Marketing Automation Platform

פלטפורמת אוטומציה שיווקית מתקדמת המבוססת על פלאשי, נבנתה עם React + Vite ו-PostgreSQL + Prisma.

## תכונות עיקריות

- 🎯 **אוטומציה שיווקית** - זרימות עבודה אוטומטיות
- 📧 **אימייל מרקטינג** - קמפיינים ממוקדים ואישיים
- 🎪 **פופאפים חכמים** - המרת מבקרים ללקוחות
- 📱 **SMS והתראות Push** - תקשורת מיידית
- 🛍️ **המלצות מוצרים** - AI לגדילת מכירות
- 📊 **מעקב וניתוח** - נתונים מפורטים
- 👥 **ניהול אנשי קשר** - סגמנטים וקטגוריות
- 🛒 **ניהול מוצרים** - קטלוג מלא

## טכנולוגיות

### Frontend
- **React 18** - ספריית UI מודרנית
- **Vite** - כלי בנייה מהיר
- **TypeScript** - טיפוסים חזקים
- **Tailwind CSS** - עיצוב מודרני
- **Lucide React** - אייקונים יפים
- **React Router** - ניווט
- **React Hook Form** - ניהול טפסים
- **Zod** - ולידציה
- **TanStack Query** - ניהול state

### Backend
- **Node.js** - סביבת ריצה
- **Express** - framework web
- **PostgreSQL** - מסד נתונים
- **Prisma** - ORM מתקדם
- **JWT** - אימות
- **bcryptjs** - הצפנת סיסמאות
- **Nodemailer** - שליחת אימיילים
- **Twilio** - SMS
- **Web Push** - התראות
- **Bull Queue** - תור עבודות לשליחה ברקע (קמפיינים ו-SMS)
- **Redis** - מסד נתונים לתור

## התקנה

### דרישות מוקדמות
- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (לתור קמפיינים)
- Yarn (מומלץ) או npm

**הערה חשובה:** מומלץ להשתמש ב-Yarn במקום npm עקב בעיות תאימות עם חלק מהחבילות.

### התקנת הפרויקט

#### אפשרות 1: הפעלה מהירה (מומלץ)
```bash
# הפעלת הסקריפט האוטומטי
./run.sh
```

#### אפשרות 2: התקנה ידנית

1. **שכפול הפרויקט**
```bash
git clone <repository-url>
cd poply
```

2. **התקנת תלויות**
```bash
# התקנת תלויות השרת
yarn install

# התקנת תלויות הלקוח
cd client && yarn install && cd ..

# התקנת תלויות נוספות חסרות
yarn add uuid
cd client && yarn add react-is && cd ..
```

3. **הגדרת מסד נתונים**
```bash
# יצירת קובץ .env
cp env.example .env

# עריכת קובץ .env עם פרטי המסד נתונים
# DATABASE_URL="postgresql://[USERNAME]@localhost:5432/poply?schema=public"
# החלף [USERNAME] בשם המשתמש שלך במערכת
```

4. **הגדרת מסד הנתונים**
```bash
# יצירת המסד נתונים
createdb poply

# התקנת והפעלת Redis (macOS)
brew install redis
brew services start redis

# התקנת והפעלת Redis (Ubuntu/Debian)
# sudo apt update && sudo apt install redis-server
# sudo systemctl start redis-server

# סנכרון סכמת המסד נתונים
npx prisma db push

# יצירת לקוח Prisma
npx prisma generate
```

5. **הפעלת הפרויקט**
```bash
# הפעלה במצב פיתוח (שרת + לקוח)
npm run dev

# או הפעלה נפרדת:
# שרת: npm run server (פורט 3001)
# לקוח: npm run client (פורט 5173)
```

### גישה לאפליקציה
- **לקוח (Frontend)**: http://localhost:5173
- **שרת (API)**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## מבנה הפרויקט

```
poply/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # רכיבים משותפים
│   │   ├── pages/         # דפי האפליקציה
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # שירותי API
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # פונקציות עזר
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/            # נתיבי API
│   ├── controllers/       # בקרים
│   ├── models/           # מודלים
│   ├── middleware/       # middleware
│   ├── services/         # שירותים
│   └── utils/            # פונקציות עזר
├── prisma/               # Prisma schema
│   └── schema.prisma
├── package.json
└── README.md
```

## API Endpoints

### אימות
- `POST /api/auth/register` - רישום משתמש חדש
- `POST /api/auth/login` - התחברות
- `GET /api/auth/me` - פרטי משתמש נוכחי

### אנשי קשר
- `GET /api/contacts` - רשימת אנשי קשר
- `POST /api/contacts` - יצירת קונטקט
- `PUT /api/contacts/:id` - עדכון קונטקט
- `DELETE /api/contacts/:id` - מחיקת קונטקט
- `POST /api/contacts/import` - ייבוא אנשי קשר

### קמפיינים
- `GET /api/campaigns` - רשימת קמפיינים
- `POST /api/campaigns` - יצירת קמפיין
- `PUT /api/campaigns/:id` - עדכון קמפיין
- `DELETE /api/campaigns/:id` - מחיקת קמפיין
- `POST /api/campaigns/:id/send` - שליחת קמפיין (ברקע)
- `POST /api/campaigns/:id/cancel` - ביטול קמפיין
- `GET /api/campaigns/:id/stats` - סטטיסטיקות קמפיין

### אוטומציות
- `GET /api/automations` - רשימת אוטומציות
- `POST /api/automations` - יצירת אוטומציה
- `PUT /api/automations/:id` - עדכון אוטומציה
- `DELETE /api/automations/:id` - מחיקת אוטומציה
- `PATCH /api/automations/:id/toggle` - הפעלה/השהיה

### פופאפים
- `GET /api/popups` - רשימת פופאפים
- `POST /api/popups` - יצירת פופאפ
- `PUT /api/popups/:id` - עדכון פופאפ
- `DELETE /api/popups/:id` - מחיקת פופאפ
- `GET /api/popups/:id/stats` - סטטיסטיקות פופאפ

### מוצרים
- `GET /api/products` - רשימת מוצרים
- `POST /api/products` - יצירת מוצר
- `PUT /api/products/:id` - עדכון מוצר
- `DELETE /api/products/:id` - מחיקת מוצר
- `POST /api/products/import` - ייבוא מוצרים

### אירועים
- `POST /api/events` - מעקב אירוע
- `GET /api/events` - רשימת אירועים
- `GET /api/events/stats` - סטטיסטיקות אירועים
- `GET /api/events/contact/:id` - אירועי קונטקט

### סגמנטים
- `GET /api/segments` - רשימת סגמנטים
- `POST /api/segments` - יצירת סגמנט
- `PUT /api/segments/:id` - עדכון סגמנט
- `DELETE /api/segments/:id` - מחיקת סגמנט
- `POST /api/segments/:id/contacts` - הוספת אנשי קשר לסגמנט

## פיתוח

### הרצה במצב פיתוח
```bash
# עם yarn (מומלץ)
DATABASE_URL="postgresql://[USERNAME]@localhost:5432/poply?schema=public" yarn dev

# או עם npm
DATABASE_URL="postgresql://[USERNAME]@localhost:5432/poply?schema=public" npm run dev
```

### בניית הפרויקט
```bash
yarn build
# או
npm run build
```

### בדיקת מסד נתונים
```bash
npx prisma studio
```

### יצירת migration
```bash
npx prisma migrate dev --name <migration-name>
```

## שליחת קמפיינים ברקע

המערכת משתמשת ב-Bull Queue ו-Redis לשליחת קמפיינים ברקע, תוך שימוש בשירותי השליחה הקיימים:

### תכונות מתקדמות
- **שימוש בשירותים קיימים** - קמפיינים משתמשים בשירותי SMS ואימייל הקיימים
- **קיצור קישורים אוטומטי** - ב-SMS עם מעקב קליקים
- **מעקב אימיילים** - פיקסל מעקב ומעקב קליקים
- **שם שולח מותאם אישית** - לכל משתמש
- **ניהול יתרות** - בדיקה אוטומטית של יתרת SMS
- **שליחה ברקע** - ללא חסימת הממשק
- **תזמון מתקדם** - שליחה מיידית או מתוזמנת

### ארכיטקטורה
- **קמפיינים** - פאנל ניהול ותזמון בלבד
- **שירותי שליחה** - SMS ואימייל עם כל התכונות המתקדמות
- **תור עבודות** - עיבוד ברקע עם Bull Queue
- **מסד נתונים** - מעקב מלא אחרי כל שליחה

### ניטור התור
```bash
# צפייה בסטטוס התור (מנהלים בלבד)
GET /api/campaigns/queue/stats
GET /api/sms/queue/stats
```

## מעקב קישורים מתקדם (כמו פלאשי)

המערכת כוללת מעקב קישורים מתקדם עם טוכנים ייחודיים לכל נמען:

### תכונות
- **קישורים ייחודיים לכל נמען** - כל איש קשר מקבל קישור ייחודי
- **מעקב רציף** - מעקב אחר פעילות גם אחרי שהמשתמש עזב ושב
- **ניהול sessions** - זיהוי אוטומטי של משתמשים חוזרים (30 יום)
- **אירועי אוטומציה** - הפעלת אוטומציות על בסיס קליקים
- **קיצור קישורים אוטומטי** - כל קישור בהודעה מתקצר אוטומטית

### מימוש טכני
- **טוקנים ייחודיים** - כל קישור מקבל טוקן ייחודי לנמען
- **מעקב IP ו-User Agent** - זיהוי מדויק של המשתמש
- **שמירת היסטוריה** - כל קליק נשמר עם פרטים מלאים
- **אינטגרציה עם אוטומציות** - קליקים מפעילים אוטומציות

## מערכת הסרה מדיוור

המערכת כוללת מערכת הסרה מדיוור מתקדמת עם ממשק ידידותי:

### תכונות
- **הסרה נפרדת לEmail ו-SMS** - בחירה מה להסיר
- **לינקים מקוצרים** - לינקי הסרה מקוצרים ונוחים
- **ממשק ידידותי** - דף הסרה מעוצב ונוח
- **הרשמה מחדש** - אפשרות להירשם מחדש בקלות
- **מעקב פעולות** - רישום כל פעולות ההסרה וההרשמה
- **הוספה אוטומטית** - לינק הסרה נוסף אוטומטית לכל הודעה

### נתיבי API
- `GET /api/unsubscribe/:token` - קבלת פרטי טוקן הסרה
- `POST /api/unsubscribe/:token/unsubscribe` - הסרה מדיוור
- `POST /api/unsubscribe/:token/resubscribe` - הרשמה מחדש
- `GET /api/unsubscribe/status/:contactId/:messageType` - בדיקת סטטוס

### דף הסרה
- נגיש בכתובת: `/unsubscribe/:token`
- ממשק ידידותי עם פרטי איש הקשר
- אפשרות הסרה או הרשמה מחדש
- תמיכה בעברית מלאה

## רישיון

MIT License

## תרומה

1. Fork הפרויקט
2. צור branch חדש (`git checkout -b feature/amazing-feature`)
3. Commit השינויים (`git commit -m 'Add amazing feature'`)
4. Push ל-branch (`git push origin feature/amazing-feature`)
5. פתח Pull Request

## תמיכה

לשאלות ותמיכה, אנא פתח issue ב-GitHub או צור קשר.

---

**Poply** - פלטפורמת אוטומציה שיווקית מתקדמת 🚀
