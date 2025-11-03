import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

import Layout from '@/components/layout/Layout';
import Login from '@/components/auth/Login';
import Dashboard from '@/components/dashboard/Dashboard';
import CRM from '@/components/crm/CRM';
import ClientProfile from '@/components/crm/ClientProfile';
import Team from '@/components/team/Team';
import Calendar from '@/components/calendar/Calendar';
import Journal from '@/components/journal/Journal';
import Analytics from '@/components/analytics/Analytics';
import Profile from '@/components/profile/Profile';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';

// Financial Components
import FinancialDashboard from '@/components/financial/FinancialDashboard';
import BudgetManagement from '@/components/financial/BudgetManagement';
import PaymentManagement from '@/components/financial/PaymentManagement';
import ExpenseManagement from '@/components/financial/ExpenseManagement';
import VendorManagement from '@/components/financial/VendorManagement';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import ReportsCenter from '@/components/reports/ReportsCenter';

// Protected Route Component
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

// App Routes Component
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/crm" 
        element={
          <ProtectedRoute>
            <CRM />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/crm/client/:id" 
        element={
          <ProtectedRoute>
            <ClientProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/team" 
        element={
          <ProtectedRoute>
            <Team />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/calendar" 
        element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/journal" 
        element={
          <ProtectedRoute>
            <Journal />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/financial" 
        element={
          <ProtectedRoute>
            <FinancialDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/financial/budgets" 
        element={
          <ProtectedRoute>
            <BudgetManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/financial/payments" 
        element={
          <ProtectedRoute>
            <PaymentManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/financial/expenses" 
        element={
          <ProtectedRoute>
            <ExpenseManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/financial/vendors" 
        element={
          <ProtectedRoute>
            <VendorManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <AnalyticsDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <ReportsCenter />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <PWAInstallPrompt />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
