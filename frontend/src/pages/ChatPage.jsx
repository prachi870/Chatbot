import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import ChatWindow from '../components/chat/ChatWindow';
import Sidebar from '../components/chat/Sidebar';
import StarField from '../components/ui/StarField';
import { ChatProvider } from '../contexts/ChatContext';
import DashboardPage from './DashboardPage';
import SettingsPage from './SettingsPage';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ChatProvider>
      <StarField />
      <div className="app-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-main">
          <Routes>
            <Route path="/" element={<ChatWindow onOpenSidebar={() => setSidebarOpen(true)} />} />
            <Route path="/dashboard" element={
              <div className="dashboard-wrapper">
                <header className="dash-header">
                  <button className="chat-header__menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
                    <span className="hamburger-icon"><span/><span/><span/></span>
                  </button>
                  <span className="dash-header__title">Mission Control</span>
                  <div className="chat-header__badge">
                    <span className="badge-pulse" aria-hidden="true"/>
                    Gemini · Online
                  </div>
                </header>
                <div className="dashboard-scroll">
                  <DashboardPage />
                </div>
              </div>
            } />
            <Route path="/settings" element={
              <div className="dashboard-wrapper">
                <header className="dash-header">
                  <button className="chat-header__menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
                    <span className="hamburger-icon"><span/><span/><span/></span>
                  </button>
                  <span className="dash-header__title">Settings</span>
                  <div className="chat-header__badge">
                    <span className="badge-pulse" aria-hidden="true"/>
                    Gemini · Online
                  </div>
                </header>
                <div className="dashboard-scroll">
                  <SettingsPage />
                </div>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </ChatProvider>
  );
}
