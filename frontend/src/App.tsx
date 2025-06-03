import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ApplicationFormPage from './pages/ApplicationFormPage';
import ApplicationListPage from './pages/ApplicationListPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import EventBudgetsPage from './pages/EventBudgetsPage';
import BudgetComparisonPage from './pages/BudgetComparisonPage';
import UserApplicationListPage from './pages/UserApplicationListPage';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider, useAuth } from './AuthContext';
import CashbookPage from './pages/CashbookPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Header /> {/* prüft selbst, ob User eingeloggt ist */}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
          <Route
            path="/applicationslist"
            element={
              <PrivateRoute>
                <UserApplicationListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/applications/:id"
            element={
              <PrivateRoute>
                <ApplicationDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/budgets"
            element={
              <PrivateRoute>
                <EventBudgetsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/comparison"
            element={
              <PrivateRoute>
                <BudgetComparisonPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/cashbook"
            element={
              <PrivateRoute>
                <CashbookPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
