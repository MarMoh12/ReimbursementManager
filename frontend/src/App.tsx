import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ApplicationFormPage from './pages/ApplicationFormPage';
import ApplicationListPage from './pages/ApplicationListPage';
import EventBudgetsPage from './pages/EventBudgetsPage';
import BudgetComparisonPage from './pages/BudgetComparisonPage';
import UserApplicationListPage from './pages/UserApplicationListPage';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './AuthContext';
import CashbookPage from './pages/CashbookPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Für alle eingeloggten Nutzer */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <ApplicationFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/list"
            element={
              <PrivateRoute>
                <ApplicationListPage />
              </PrivateRoute>
            }
          />

          {/* Nur für Admins / Superuser */}
          <Route
            path="/budgets"
            element={
              <PrivateRoute requiredRole="admin">
                <EventBudgetsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/comparison"
            element={
              <PrivateRoute requiredRole="admin">
                <BudgetComparisonPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/cashbook"
            element={
              <PrivateRoute requiredRole="admin">
                <CashbookPage />
              </PrivateRoute>
            }
          />

          {/* Optional: Detail- und Listenansicht für einzelne Anträge */}
          <Route
            path="/applicationslist"
            element={
              <PrivateRoute>
                <UserApplicationListPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
