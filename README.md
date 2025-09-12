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

## התקנה

### דרישות מוקדמות
- Node.js 18+
- PostgreSQL 14+
- npm או yarn

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
# התקנת כל התלויות
npm run install-all
```

3. **הגדרת מסד נתונים**
```bash
# יצירת קובץ .env
cp env.example .env

# עריכת קובץ .env עם פרטי המסד נתונים
# DATABASE_URL="postgresql://tadmitinteractive@localhost:5432/poply?schema=public"
```

4. **הגדרת מסד הנתונים**
```bash
# יצירת המסד נתונים
createdb poply

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
- `POST /api/campaigns/:id/send` - שליחת קמפיין

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
npm run dev
```

### בניית הפרויקט
```bash
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
