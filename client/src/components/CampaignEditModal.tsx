import React, { useState, useEffect } from 'react';
import { X, Mail, MessageSquare, Bell, Calendar, Type, FileText, Edit } from 'lucide-react';
import type { Campaign, UpdateCampaignData } from '../services/campaignsService';

interface CampaignEditModalProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: UpdateCampaignData) => Promise<void>;
  isLoading?: boolean;
}

const campaignTypes = [
  { value: 'EMAIL', label: 'אימייל', icon: Mail, description: 'שליחת קמפיין אימייל עם תוכן עשיר' },
  { value: 'SMS', label: 'SMS', icon: MessageSquare, description: 'הודעת SMS קצרה ויעילה' },
  { value: 'PUSH', label: 'התראה', icon: Bell, description: 'התראת דחיפה למכשירים ניידים' },
];

const statusOptions = [
  { value: 'DRAFT', label: 'טיוטה' },
  { value: 'SCHEDULED', label: 'מתוזמן' },
  { value: 'SENDING', label: 'נשלח' },
  { value: 'SENT', label: 'נשלח' },
  { value: 'FAILED', label: 'נכשל' },
];

export const CampaignEditModal: React.FC<CampaignEditModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<UpdateCampaignData>({
    name: '',
    subject: '',
    content: '',
    type: 'EMAIL',
    status: 'DRAFT',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedType, setSelectedType] = useState<'EMAIL' | 'SMS' | 'PUSH'>('EMAIL');

  useEffect(() => {
    if (campaign && isOpen) {
      setFormData({
        name: campaign.name,
        subject: campaign.subject,
        content: campaign.content,
        type: campaign.type,
        status: campaign.status,
        scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.slice(0, 16) : undefined,
      });
      setSelectedType(campaign.type);
    }
  }, [campaign, isOpen]);

  const handleInputChange = (field: keyof UpdateCampaignData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTypeChange = (type: 'EMAIL' | 'SMS' | 'PUSH') => {
    setSelectedType(type);
    setFormData(prev => ({ ...prev, type }));
    if (errors.type) {
      setErrors(prev => ({ ...prev, type: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'שם הקמפיין הוא שדה חובה';
    }

    if (!formData.subject?.trim()) {
      newErrors.subject = 'נושא הקמפיין הוא שדה חובה';
    }

    if (!formData.content?.trim()) {
      newErrors.content = 'תוכן הקמפיין הוא שדה חובה';
    }

    // SMS specific validation
    if (formData.type === 'SMS' && formData.content && formData.content.length > 160) {
      newErrors.content = 'הודעת SMS לא יכולה להיות ארוכה מ-160 תווים';
    }

    // Cannot edit sent campaigns
    if (campaign?.status === 'SENT' || campaign?.status === 'SENDING') {
      newErrors.general = 'לא ניתן לערוך קמפיין שכבר נשלח';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaign || !validateForm()) {
      return;
    }

    try {
      await onSave(campaign.id, formData);
      handleClose();
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      subject: '',
      content: '',
      type: 'EMAIL',
      status: 'DRAFT',
    });
    setSelectedType('EMAIL');
    setErrors({});
    onClose();
  };

  const getCharacterCount = () => {
    if (selectedType === 'SMS') {
      return `${(formData.content || '').length}/160`;
    }
    return `${(formData.content || '').length} תווים`;
  };

  const getContentPlaceholder = () => {
    switch (selectedType) {
      case 'EMAIL':
        return 'כתוב כאן את תוכן האימייל שלך...\n\nאתה יכול להשתמש במשתנים:\n{{firstName}} - שם פרטי\n{{lastName}} - שם משפחה\n{{email}} - כתובת אימייל';
      case 'SMS':
        return 'כתוב כאן את הודעת ה-SMS שלך (עד 160 תווים)...\n\nמשתנים זמינים: {{firstName}}, {{lastName}}';
      case 'PUSH':
        return 'כתוב כאן את תוכן ההתראה שלך...\n\nמשתנים זמינים: {{firstName}}, {{lastName}}';
      default:
        return '';
    }
  };

  const isReadOnly = campaign?.status === 'SENT' || campaign?.status === 'SENDING';

  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-2 ml-3">
              <Edit className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                ערוך קמפיין
              </h2>
              <p className="text-sm text-gray-500">
                {campaign.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Read-only warning */}
        {isReadOnly && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6 mb-0">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  קמפיין זה כבר נשלח ולא ניתן לערוך אותו. אתה יכול לצפות בפרטים בלבד.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Campaign Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                סוג הקמפיין
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {campaignTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.value}
                      className={`relative rounded-lg border-2 ${
                        isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'
                      } transition-all ${
                        selectedType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => !isReadOnly && handleTypeChange(type.value as 'EMAIL' | 'SMS' | 'PUSH')}
                    >
                      <div className="p-4">
                        <div className="flex items-center">
                          <Icon className={`h-5 w-5 ml-2 ${
                            selectedType === type.value ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            selectedType === type.value ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {type.label}
                          </span>
                        </div>
                        <p className={`mt-1 text-sm ${
                          selectedType === type.value ? 'text-blue-700' : 'text-gray-500'
                        }`}>
                          {type.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Type className="h-4 w-4 inline ml-1" />
                  שם הקמפיין
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`form-input ${errors.name ? 'border-red-300' : ''}`}
                  placeholder="הכנס שם לקמפיין..."
                  disabled={isLoading || isReadOnly}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline ml-1" />
                  {selectedType === 'EMAIL' ? 'נושא האימייל' : 
                   selectedType === 'SMS' ? 'כותרת ההודעה' : 'כותרת ההתראה'}
                </label>
                <input
                  type="text"
                  value={formData.subject || ''}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className={`form-input ${errors.subject ? 'border-red-300' : ''}`}
                  placeholder={
                    selectedType === 'EMAIL' ? 'הכנס נושא לאימייל...' :
                    selectedType === 'SMS' ? 'הכנס כותרת להודעה...' : 'הכנס כותרת להתראה...'
                  }
                  disabled={isLoading || isReadOnly}
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>
            </div>

            {/* Status and Scheduled Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סטטוס הקמפיין
                </label>
                <select
                  value={formData.status || 'DRAFT'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="form-input"
                  disabled={isLoading || isReadOnly}
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline ml-1" />
                  תזמון שליחה (אופציונלי)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt || ''}
                  onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                  className="form-input"
                  disabled={isLoading || isReadOnly}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="mt-1 text-sm text-gray-500">
                  השאר ריק לשליחה מיידית
                </p>
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  תוכן הקמפיין
                </label>
                <span className={`text-sm ${
                  selectedType === 'SMS' && (formData.content || '').length > 160 
                    ? 'text-red-600' 
                    : 'text-gray-500'
                }`}>
                  {getCharacterCount()}
                </span>
              </div>
              <textarea
                value={formData.content || ''}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className={`form-input min-h-[200px] ${errors.content ? 'border-red-300' : ''}`}
                placeholder={getContentPlaceholder()}
                disabled={isLoading || isReadOnly}
                rows={selectedType === 'SMS' ? 4 : 8}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
              
              {/* Content Tips */}
              {!isReadOnly && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">טיפים לכתיבה:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {selectedType === 'EMAIL' && (
                      <>
                        <li>• השתמש בכותרות ברורות ומעניינות</li>
                        <li>• הוסף קישורים רלוונטיים</li>
                        <li>• כלול קריאה לפעולה ברורה</li>
                      </>
                    )}
                    {selectedType === 'SMS' && (
                      <>
                        <li>• שמור על הודעה קצרה וברורה</li>
                        <li>• הוסף קישור קצר אם נדרש</li>
                        <li>• הימנע מתווים מיוחדים</li>
                      </>
                    )}
                    {selectedType === 'PUSH' && (
                      <>
                        <li>• כתוב הודעה קצרה ומושכת</li>
                        <li>• השתמש בפעלים חזקים</li>
                        <li>• הוסף רגש או דחיפות</li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              {isReadOnly ? 'סגור' : 'ביטול'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'שומר...' : 'שמור שינויים'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}; 