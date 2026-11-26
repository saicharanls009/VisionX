import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { FarmerVerificationView } from './components/farmers/FarmerVerificationView';
import { FarmerRegistrationView } from './components/farmers/FarmerRegistrationView';
import { AppointmentBookingView } from './components/booking/AppointmentBookingView';
import { TodaysQueueView } from './components/queue/TodaysQueueView';
import { FarmerStatusView } from './components/status/FarmerStatusView';
import { PrintableTokenView } from './components/token/PrintableTokenView';
import { Farmer, Appointment } from './types';

const MainPortalApp: React.FC = () => {
  const { session } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('APT-2026-00045');
  const [targetFarmerIdForStatus, setTargetFarmerIdForStatus] = useState<string>('DEMO-FARMER-001');

  if (!session || !session.isAuthenticated) {
    return <LoginView />;
  }

  // Navigation callbacks
  const handleSelectFarmerForBooking = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setCurrentTab('booking');
  };

  const handleViewFarmerStatus = (farmerId: string) => {
    setTargetFarmerIdForStatus(farmerId);
    setCurrentTab('status');
  };

  const handlePrintTokenSlip = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setCurrentTab('token-print');
  };

  const handleBookingSuccess = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
  };

  const handleSidebarSelect = (tab: NavTab) => {
    setCurrentTab(tab);
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-slate-100">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSidebarSelect}
        />

        {/* View Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onSelectAppointmentForSlip={handlePrintTokenSlip}
              onTrackFarmer={handleViewFarmerStatus}
            />
          )}

          {currentTab === 'farmers' && (
            <FarmerVerificationView
              onSelectFarmerForBooking={handleSelectFarmerForBooking}
              onViewFarmerStatus={handleViewFarmerStatus}
              onRegisterNewFarmerClick={() => setCurrentTab('register-farmer')}
              onPrintToken={handlePrintTokenSlip}
            />
          )}

          {currentTab === 'register-farmer' && (
            <FarmerRegistrationView
              onRegistrationComplete={(farmer) => setSelectedFarmer(farmer)}
              onNavigateToBooking={handleSelectFarmerForBooking}
            />
          )}

          {currentTab === 'booking' && (
            <AppointmentBookingView
              initialFarmer={selectedFarmer}
              onBookingSuccess={handleBookingSuccess}
              onViewTokenReceipt={handlePrintTokenSlip}
            />
          )}

          {currentTab === 'queue' && (
            <TodaysQueueView
              onSelectAppointmentForSlip={handlePrintTokenSlip}
              onTrackFarmer={handleViewFarmerStatus}
            />
          )}

          {currentTab === 'status' && (
            <FarmerStatusView
              initialFarmerId={targetFarmerIdForStatus}
            />
          )}

          {currentTab === 'token-print' && (
            <PrintableTokenView
              initialAppointmentId={selectedAppointmentId}
              onDone={() => setCurrentTab('dashboard')}
            />
          )}
        </main>
      </div>

    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainPortalApp />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
