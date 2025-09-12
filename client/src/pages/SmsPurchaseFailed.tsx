import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const SmsPurchaseFailed: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            התשלום לא הושלם
          </h1>
          <p className="text-gray-600">
            התשלום בוטל או נכשל. לא חויבת.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">מה עכשיו?</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• ודא שפרטי התשלום נכונים</li>
            <li>• בדוק שיש יתרה מספקת בכרטיס</li>
            <li>• נסה שוב או פנה לתמיכה</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/sms/purchase')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            נסה שוב
          </button>
          
          <button
            onClick={() => navigate('/sms')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            חזרה לניהול SMS
          </button>
        </div>

        {orderId && (
          <p className="text-xs text-gray-500 text-center mt-4">
            מספר הזמנה: {orderId}
          </p>
        )}
      </div>
    </div>
  );
};

export default SmsPurchaseFailed;
