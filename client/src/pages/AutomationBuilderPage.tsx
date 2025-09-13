import React from 'react';
import { AutomationBuilder } from '../components/AutomationBuilder';

export const AutomationBuilderPage: React.FC = () => {
  const handleSave = (automation: any) => {
    console.log('שמירת אוטומציה:', automation);
    // כאן ניתן להוסיף לוגיקה לשמירה בשרת
  };

  return (
    <div className="h-screen">
      <AutomationBuilder onSave={handleSave} />
    </div>
  );
}; 