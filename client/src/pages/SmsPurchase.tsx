import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Check,
  TrendingUp,
  Zap,
  ArrowLeft,
  CreditCard,
  Package,
  Clock,
  AlertCircle
} from 'lucide-react';
import { smsPackagesService, SmsPackageTemplate } from '../services/smsPackagesService';
import { smsService } from '../services/smsService';

const SmsPurchase: React.FC = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<SmsPackageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [packagesData, balanceData] = await Promise.all([
        smsPackagesService.getAvailablePackages(),
        smsService.getSmsBalance()
      ]);
      setPackages(packagesData);
      setCurrentBalance(balanceData.balance);
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasing(true);
      setError(null);
      setSelectedPackage(packageId);

      const result = await smsPackagesService.purchasePackage(packageId);

      if (result.success && result.paymentLink) {
        // הפניה לדף התשלום של PayPlus
        window.location.href = result.paymentLink;
      } else {
        setError(result.error || 'שגיאה ביצירת קישור תשלום');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה ברכישת החבילה');
    } finally {
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/sms')}
          className="p-2 hover:bg-gray-100 rounded-lg mr-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">רכישת חבילות SMS</h1>
          <p className="text-gray-600 mt-1">
            יתרה נוכחית: <span className="font-bold text-blue-600">{currentBalance}</span> הודעות
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <Zap className="h-8 w-8 text-yellow-500 mb-3" />
          <h3 className="font-semibold mb-2">שליחה מיידית</h3>
          <p className="text-sm text-gray-600">
            הודעות זמינות לשימוש מיד לאחר הרכישה
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <TrendingUp className="h-8 w-8 text-green-500 mb-3" />
          <h3 className="font-semibold mb-2">מעקב מלא</h3>
          <p className="text-sm text-gray-600">
            דוחות מפורטים על כל הודעה שנשלחה
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <Clock className="h-8 w-8 text-blue-500 mb-3" />
          <h3 className="font-semibold mb-2">ללא תפוגה</h3>
          <p className="text-sm text-gray-600">
            ההודעות שלך לא יפוגו - השתמש בהן מתי שתרצה
          </p>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const finalPrice = parseFloat(pkg.finalPrice || pkg.price.toString());
          const pricePerSms = parseFloat(pkg.pricePerSms || '0');
          const isSelected = selectedPackage === pkg.id;
          
          return (
            <div
              key={pkg.id}
              className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                pkg.isPopular ? 'border-blue-500' : 'border-gray-200'
              } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            >
              {pkg.isPopular && (
                <div className="bg-blue-500 text-white text-sm font-medium py-2 px-4 text-center">
                  הכי פופולרי
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                
                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(finalPrice)}
                    </span>
                    {pkg.discount > 0 && (
                      <span className="ml-2 text-sm line-through text-gray-400">
                        {formatPrice(pkg.price)}
                      </span>
                    )}
                  </div>
                  {pkg.discount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      חיסכון של {pkg.discount}%
                    </span>
                  )}
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-600">
                    <Package className="w-4 h-4 mr-2" />
                    <span>{pkg.amount.toLocaleString()} הודעות SMS</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CreditCard className="w-4 h-4 mr-2" />
                    <span>{pricePerSms.toFixed(3)}₪ להודעה</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchasing}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    pkg.isPopular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasing && isSelected ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      מעבד...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      רכוש עכשיו
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Note */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Check className="h-5 w-5 text-green-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">תשלום מאובטח</h3>
            <p className="mt-1 text-sm text-gray-600">
              כל התשלומים מעובדים באופן מאובטח דרך PayPlus, ספק הסליקה המוביל בישראל.
              אנחנו לא שומרים פרטי כרטיס אשראי במערכת.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsPurchase;
