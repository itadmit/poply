import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  CheckCircle, 
  Info,
  Globe,
  Smartphone,
  Link2,
  BarChart3
} from 'lucide-react';
import { getTrackingScript } from '../services/trackingService';

const TrackingSetup: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const trackingScript = getTrackingScript();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">הטמעת סקריפט מעקב</h1>
        <p className="text-gray-600">
          הטמע את סקריפט המעקב באתר שלך כדי לעקוב אחרי לקוחות שהגיעו דרך קישורי SMS
        </p>
      </div>

      {/* יתרונות */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <Link2 className="h-8 w-8 text-blue-600 mb-3" />
          <h3 className="font-medium mb-1">קישורים מקוצרים</h3>
          <p className="text-sm text-gray-600">קיצור אוטומטי של קישורים ל-22 תווים</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <Smartphone className="h-8 w-8 text-green-600 mb-3" />
          <h3 className="font-medium mb-1">קישורים ייחודיים</h3>
          <p className="text-sm text-gray-600">כל נמען מקבל קישור מותאם אישית</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <Globe className="h-8 w-8 text-purple-600 mb-3" />
          <h3 className="font-medium mb-1">מעקב מתמשך</h3>
          <p className="text-sm text-gray-600">זיהוי לקוחות גם אחרי 30 יום</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <BarChart3 className="h-8 w-8 text-orange-600 mb-3" />
          <h3 className="font-medium mb-1">נתונים מפורטים</h3>
          <p className="text-sm text-gray-600">דוחות מעקב מלאים על כל קליק</p>
        </div>
      </div>

      {/* הוראות הטמעה */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Code className="w-5 h-5 mr-2" />
          שלב 1: הוסף את הסקריפט לאתר שלך
        </h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-600">הוסף את הקוד הבא לפני תגית ה-&lt;/body&gt; באתר שלך:</p>
            <button
              onClick={copyToClipboard}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  הועתק!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  העתק
                </>
              )}
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
            <code>{trackingScript}</code>
          </pre>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                הסקריפט טוען באופן אסינכרוני ולא משפיע על ביצועי האתר
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* אירועים נעקבים */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">שלב 2: אירועים שנעקבים אוטומטית</h2>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3" />
            <div>
              <p className="font-medium">צפייה בעמוד</p>
              <p className="text-sm text-gray-600">כל כניסה לעמוד נרשמת אוטומטית</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3" />
            <div>
              <p className="font-medium">קליקים על כפתורים וקישורים</p>
              <p className="text-sm text-gray-600">מעקב אחרי כל קליק על אלמנט לחיץ</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3" />
            <div>
              <p className="font-medium">שליחת טפסים</p>
              <p className="text-sm text-gray-600">רישום כל שליחת טופס באתר</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3" />
            <div>
              <p className="font-medium">זמן שהייה בעמוד</p>
              <p className="text-sm text-gray-600">מדידת זמן השהייה ואחוז הגלילה</p>
            </div>
          </div>
        </div>
      </div>

      {/* מעקב מותאם אישית */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">שלב 3: מעקב מותאם אישית (אופציונלי)</h2>
        
        <p className="text-gray-600 mb-4">
          ניתן לשלוח אירועים מותאמים אישית באמצעות הפונקציה:
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <pre className="text-sm">
            <code>{`// דוגמה: מעקב אחרי הוספה לעגלה
window.Poply.track('ADD_TO_CART', {
  productId: '12345',
  productName: 'מוצר לדוגמה',
  price: 99.90,
  quantity: 1
});

// דוגמה: מעקב אחרי רכישה
window.Poply.track('PURCHASE', {
  orderId: 'ORD-12345',
  total: 299.90,
  items: 3
});`}</code>
          </pre>
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <Info className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                אירועים מותאמים אישית יכולים לשמש לטריגרים באוטומציות
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingSetup;
