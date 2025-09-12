import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { FormInput, FormButtons } from '../components/form';

export const TestEmail: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/test-email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: `מייל נשלח בהצלחה ל-${email}!` });
        setEmail('');
      } else {
        setResult({ success: false, message: data.error || 'שגיאה בשליחת המייל' });
      }
    } catch (error) {
      setResult({ success: false, message: 'שגיאה בחיבור לשרת' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Send className="h-6 w-6 ml-2 text-primary-600" />
            בדיקת שליחת אימייל
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            בדוק שמערכת שליחת האימיילים עובדת כראוי
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            id="email"
            label="כתובת אימייל"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">מה יישלח?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• מייל בדיקה עם עיצוב HTML</li>
              <li>• נושא: "בדיקת מערכת Poply"</li>
              <li>• שולח: noreply@poply.co.il</li>
            </ul>
          </div>

          <FormButtons
            submitText={loading ? 'שולח...' : 'שלח מייל בדיקה'}
            onCancel={() => {
              setEmail('');
              setResult(null);
            }}
            cancelText="נקה"
            loading={loading}
          />
        </form>

        {result && (
          <div className={`mt-4 p-4 rounded-md ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
              )}
              <p className={`text-sm font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">הוראות בדיקה:</h2>
        <ol className="space-y-2 text-sm text-gray-600">
          <li>1. וודא שהוספת את ה-API Key של SendGrid לקובץ .env</li>
          <li>2. וודא שאימות הדומיין הושלם ב-SendGrid</li>
          <li>3. הזן כתובת אימייל תקינה</li>
          <li>4. לחץ על "שלח מייל בדיקה"</li>
          <li>5. בדוק את תיבת הדואר שלך (כולל תיקיית ספאם)</li>
        </ol>
      </div>
    </div>
  );
};
