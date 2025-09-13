import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Contacts } from './pages/Contacts';
import { Campaigns } from './pages/Campaigns';
import { Automations } from './pages/Automations';
import { Popups } from './pages/Popups';
import { Products } from './pages/Products';
import { Events } from './pages/Events';
import { Segments } from './pages/Segments';
import { Reports } from './pages/Reports';
import { TestEmail } from './pages/TestEmail';
import SmsManager from './pages/SmsManager';
import SmsTracking from './pages/SmsTracking';
import SmsPurchase from './pages/SmsPurchase';
import SmsPurchaseSuccess from './pages/SmsPurchaseSuccess';
import SmsPurchaseFailed from './pages/SmsPurchaseFailed';
import TrackingSetup from './pages/TrackingSetup';
// import { AutomationBuilderPage } from './pages/AutomationBuilderPage';
import UnsubscribePage from './pages/UnsubscribePage';
import { ProtectedRoute } from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unsubscribe/:token" element={<UnsubscribePage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/contacts" element={<Contacts />} />
                        <Route path="/campaigns" element={<Campaigns />} />
                        <Route path="/automations" element={<Automations />} />
                        <Route path="/popups" element={<Popups />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/segments" element={<Segments />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/test-email" element={<TestEmail />} />
                        <Route path="/sms" element={<SmsManager />} />
                        <Route path="/sms/tracking/:messageId" element={<SmsTracking />} />
                        <Route path="/sms/purchase" element={<SmsPurchase />} />
                        <Route path="/sms/purchase-success" element={<SmsPurchaseSuccess />} />
                        <Route path="/sms/purchase-failed" element={<SmsPurchaseFailed />} />
                        <Route path="/tracking-setup" element={<TrackingSetup />} />
                        {/* <Route path="/automation-builder" element={<AutomationBuilderPage />} /> */}
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;