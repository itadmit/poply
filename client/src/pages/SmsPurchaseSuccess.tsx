import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Package } from 'lucide-react';
import { smsPackagesService } from '../services/smsPackagesService';
import { smsService } from '../services/smsService';

const SmsPurchaseSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [newBalance, setNewBalance] = useState(0);

  useEffect(() => {
    if (orderId) {
      checkOrderStatus();
    }
  }, [orderId]);

  const checkOrderStatus = async () => {
    try {
      // קבלת יתרה מעודכנת - תמיד
      const balanceData = await smsService.getSmsBalance();
      setNewBalance(balanceData.balance);
      
      // בדיקת סטטוס ההזמנה
      const status = await smsPackagesService.checkOrderStatus(orderId!);
      
      if (status.status === 'completed') {
        setOrderDetails(status.package);
        setLoading(false);
      } else {
        // אם ההזמנה עדיין לא הושלמה, ננסה שוב בעוד כמה שניות
        setTimeout(checkOrderStatus, 3000);
      }
    } catch (error) {
      console.error('Error checking order status:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">מאמת את התשלום...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                התשלום בוצע בהצלחה!
              </h1>
              <p className="text-gray-600">
                החבילה נוספה לחשבונך
              </p>
            </div>

            {orderDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">פרטי הרכישה:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">חבילה:</span>
                    <span className="font-medium">{orderDetails.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">כמות הודעות:</span>
                    <span className="font-medium">{orderDetails.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">מחיר:</span>
                    <span className="font-medium">₪{orderDetails.price}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    יתרה חדשה: {newBalance.toLocaleString()} הודעות
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/sms')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                חזרה לניהול SMS
              </button>
              
              <button
                onClick={() => navigate('/sms/purchase')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                רכוש חבילה נוספת
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SmsPurchaseSuccess;
