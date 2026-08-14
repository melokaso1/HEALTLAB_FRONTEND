import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '../services/api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: string;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  timeAgo: string;
  avatarBg: string;
}

interface SignalRContextType {
  connection: signalR.HubConnection | null;
  isConnected: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  recentActivities: ActivityItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  addActivity: (user: string, action: string, target: string, avatarBg?: string) => void;
  addNotification: (title: string, message: string, type?: string) => void;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    user: 'Dr. Alejandro Silva',
    action: 'actualizó historial de',
    target: 'María Rodríguez',
    timestamp: new Date().toISOString(),
    timeAgo: 'Hace 10 minutos',
    avatarBg: '#00A896',
  },
  {
    id: 'act-2',
    user: 'Nuevo paciente',
    action: 'registrado en el sistema:',
    target: 'Sarah Jenkins',
    timestamp: new Date().toISOString(),
    timeAgo: 'Hace 45 minutos',
    avatarBg: '#6366F1',
  },
  {
    id: 'act-3',
    user: 'Cita médica',
    action: 'reprogramada por',
    target: 'Carlos Restrepo',
    timestamp: new Date().toISOString(),
    timeAgo: 'Hace 1 hora',
    avatarBg: '#EC4899',
  },
];

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);

  useEffect(() => {
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
    const hubUrl = `${baseUrl}/hubs/notifications`;

    const token = localStorage.getItem('token');
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || '',
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    setConnection(newConnection);

    newConnection.on('ReceiveNotification', (notification: NotificationItem) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    newConnection.on('ReceiveActivity', (activity: ActivityItem) => {
      setRecentActivities((prev) => [activity, ...prev.filter((a) => a.id !== activity.id)]);
    });

    newConnection
      .start()
      .then(() => {
        setIsConnected(true);
        console.info('[SignalR] Conectado exitosamente al Hub de Notificaciones');
      })
      .catch((err) => {
        console.warn('[SignalR] No se pudo conectar al Hub (modo local activo):', err?.message || err);
        setIsConnected(false);
      });

    return () => {
      newConnection.stop();
    };
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addActivity = (user: string, action: string, target: string, avatarBg = '#00A896') => {
    const newAct: ActivityItem = {
      id: String(Date.now()),
      user,
      action,
      target,
      timestamp: new Date().toISOString(),
      timeAgo: 'Hace un momento',
      avatarBg,
    };
    setRecentActivities((prev) => [newAct, ...prev]);
  };

  const addNotification = (title: string, message: string, type = 'info') => {
    const newNotif: NotificationItem = {
      id: String(Date.now()),
      title,
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SignalRContext.Provider
      value={{
        connection,
        isConnected,
        notifications,
        unreadCount,
        recentActivities,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        addActivity,
        addNotification,
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error('useSignalR debe usarse dentro de un SignalRProvider');
  }
  return context;
};
