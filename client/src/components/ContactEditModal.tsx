import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { Contact, UpdateContactData } from '../services/contactsService';

interface ContactEditModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateContactData) => Promise<void>;
  isLoading?: boolean;
}

const statusOptions = [
  { value: 'ACTIVE', label: 'פעיל' },
  { value: 'INACTIVE', label: 'לא פעיל' },
  { value: 'UNSUBSCRIBED', label: 'ביטל הרשמה' },
  { value: 'BOUNCED', label: 'נדחה' },
];

export const ContactEditModal: React.FC<ContactEditModalProps> = ({
  contact,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<UpdateContactData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    status: 'ACTIVE',
    tags: []
  });
  const [tagsInput, setTagsInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contact && isOpen) {
      setFormData({
        email: contact.email,
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        phone: contact.phone || '',
        company: contact.company || '',
        status: contact.status,
        tags: contact.tags || []
      });
      setTagsInput((contact.tags || []).join(', '));
    }
  }, [contact, isOpen]);

  const handleInputChange = (field: keyof UpdateContactData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email?.trim()) {
      newErrors.email = 'אימייל הוא שדה חובה';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'אימייל לא תקין';
    }

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'שם פרטי הוא שדה חובה';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'שם משפחה הוא שדה חובה';
    }

    if (formData.phone && !/^[\+]?[0-9\-\s\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'מספר טלפון לא תקין';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      company: '',
      status: 'ACTIVE',
      tags: []
    });
    setTagsInput('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {contact ? 'עריכת איש קשר' : 'איש קשר חדש'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם פרטי *
                </label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={isLoading}
                  placeholder="הכנס שם פרטי"
                  className={`form-input w-full ${errors.firstName ? 'border-red-500' : ''}`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם משפחה *
                </label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={isLoading}
                  placeholder="הכנס שם משפחה"
                  className={`form-input w-full ${errors.lastName ? 'border-red-500' : ''}`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                אימייל *
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                placeholder="example@domain.com"
                className={`form-input w-full ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  טלפון
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={isLoading}
                  placeholder="+972-50-123-4567"
                  className={`form-input w-full ${errors.phone ? 'border-red-500' : ''}`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  חברה
                </label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  disabled={isLoading}
                  placeholder="שם החברה"
                  className="form-input w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סטטוס
              </label>
              <select
                value={formData.status || 'ACTIVE'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                disabled={isLoading}
                className="form-input w-full"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תגיות
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => handleTagsChange(e.target.value)}
                disabled={isLoading}
                placeholder="הפרד תגיות בפסיקים (VIP, לקוח חדש, וכו')"
                className="form-input w-full"
              />
              <p className="mt-1 text-sm text-gray-500">
                הפרד תגיות בפסיקים
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="btn btn-secondary"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  שמור
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 