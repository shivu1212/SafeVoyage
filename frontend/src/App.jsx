import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { TripProvider } from './context/TripContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

import AppLayout from './components/layout/AppLayout.jsx';
import LandingPage from './pages/Landing/LandingPage.jsx';
import LoginPage from './pages/Login/LoginPage.jsx';
import RegisterPage from './pages/Register/RegisterPage.jsx';
import TravellerDetailsPage from './pages/TravellerDetails/TravellerDetailsPage.jsx';
import TripDetailsPage from './pages/TripDetails/TripDetailsPage.jsx';
import ItineraryPage from './pages/Itinerary/ItineraryPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import SafetyAlertsPage from './pages/SafetyAlerts/SafetyAlertsPage.jsx';
import HealthSafetyPage from './pages/HealthSafety/HealthSafetyPage.jsx';
import EmergencySOSPage from './pages/EmergencySOS/EmergencySOSPage.jsx';
import FamilyContactsPage from './pages/FamilyContacts/FamilyContactsPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import SettingsPage from './pages/Settings/SettingsPage.jsx';
import AIAssistantPage from './pages/Assistant/AIAssistantPage.jsx';

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TripProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Landing & Auth Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Dashboard Layout Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/traveller-details" element={<TravellerDetailsPage />} />
                  <Route path="/trip" element={<TripDetailsPage />} />
                  <Route path="/itinerary" element={<ItineraryPage />} />
                  <Route path="/safety-alerts" element={<SafetyAlertsPage />} />
                  <Route path="/safety" element={<SafetyAlertsPage />} />
                  <Route path="/alerts" element={<SafetyAlertsPage />} />
                  <Route path="/health-safety" element={<HealthSafetyPage />} />
                  <Route path="/emergency" element={<EmergencySOSPage />} />
                  <Route path="/emergency-sos" element={<EmergencySOSPage />} />
                  <Route path="/sos" element={<EmergencySOSPage />} />
                  <Route path="/family" element={<FamilyContactsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/assistant" element={<AIAssistantPage />} />
                </Route>

                {/* Catch all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </TripProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
