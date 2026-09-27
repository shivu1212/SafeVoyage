import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../navigation/Sidebar.jsx';
import Header from '../navigation/Header.jsx';
import SmsToastModal from '../common/SmsToastModal.jsx';
import AIAssistantWidget from '../assistant/AIAssistantWidget.jsx';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Desktop Fixed Sidebar */}
      <div className="desktop-sidebar-container">
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 990
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{ width: 'var(--sidebar-width)', height: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Live / Demo SMS Mobile Toast */}
      <SmsToastModal />

      {/* Floating Sentinel AI Assistant Widget */}
      <AIAssistantWidget />
    </div>
  );
}
