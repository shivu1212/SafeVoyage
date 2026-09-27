import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api.js';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeSmsModal, setActiveSmsModal] = useState(null); // { message, recipient, timestamp, mode }
  const [smsLogs, setSmsLogs] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || res.notifications.filter(n => !n.read).length);
      }
      if (res.smsLogs) {
        setSmsLogs(res.smsLogs);
      }
    } catch (err) {
      console.warn('[Notifications load fallback]', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
    } catch (e) {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
    } catch (e) {}
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const triggerSmsToast = (message, recipient = "+91 98765 43210", mode = "DEMO SMS") => {
    const modalData = {
      message,
      recipient,
      mode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setActiveSmsModal(modalData);
    setSmsLogs(prev => [modalData, ...prev]);
  };

  const closeSmsModal = () => {
    setActiveSmsModal(null);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        smsLogs,
        activeSmsModal,
        markAsRead,
        markAllAsRead,
        triggerSmsToast,
        closeSmsModal,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
