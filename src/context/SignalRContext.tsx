import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '../services/api';
import { useAuth } from './AuthContext';
import { getAppointmentsApi } from '../services/appointments.service';
import { getPatientsApi } from '../services/patients.service';

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

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!token) {
      const resetTimer = window.setTimeout(() => {
        setConnection(null);
        setIsConnected(false);
        setNotifications([]);
        setRecentActivities([]);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    let isCurrent = true;
    const loadRealActivities = async () => {
      try {
        const [apps, patients] = await Promise.all([
          getAppointmentsApi().catch(() => []),
          getPatientsApi().catch(() => []),
        ]);
        const mapped: ActivityItem[] = [];

        // 1. Citas reales
        apps.slice(0, 5).forEach((app) => {
          mapped.push({
            id: `app-act-${app.id}`,
            user: app.professionalName || 'Médico',
            action: app.status === 'Atendida' ? 'atendió la cita de' : app.status === 'Cancelada' ? 'canceló la cita de' : 'agendó cita para',
            target: app.patientName || 'Paciente',
            timestamp: app.createdAt || new Date().toISOString(),
            timeAgo: app.date ? `Fecha: ${app.date}` : 'Reciente',
            avatarBg: app.status === 'Atendida' ? '#00A896' : app.status === 'Cancelada' ? '#EF4444' : '#6366F1',
          });
        });

        // 2. Pacientes reales
        patients.slice(0, 3).forEach((pat) => {
          mapped.push({
            id: `pat-act-${pat.id}`,
            user: 'Nuevo paciente',
            action: 'registrado en el sistema:',
            target: pat.name,
            timestamp: new Date().toISOString(),
            timeAgo: 'Reciente',
            avatarBg: '#EC4899',
          });
        });

        if (isCurrent && mapped.length > 0) {
          setRecentActivities((prev) => (prev.length === 0 ? mapped : prev));
        }
      } catch (e) {
        console.warn('[SignalRContext] Error cargando actividades reales:', e);
      }
    };

    loadRealActivities();

    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
    const hubUrl = `${baseUrl}/hubs/notifications`;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('token') || '',
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    newConnection.on('ReceiveNotification', (notification: NotificationItem) => {
      setNotifications((prev) =>
        prev.some((item) => item.id === notification.id) ? prev : [notification, ...prev],
      );
    });

    newConnection.on('LoadActivities', (activities: ActivityItem[]) => {
      if (Array.isArray(activities) && isCurrent) {
        setRecentActivities(activities);
      }
    });

    newConnection.on('ReceiveActivity', (activity: ActivityItem) => {
      if (isCurrent) {
        setRecentActivities((prev) => [activity, ...prev.filter((a) => a.id !== activity.id)]);
      }
    });

    newConnection
      .start()
      .then(() => {
        if (!isCurrent) return;
        setConnection(newConnection);
        setIsConnected(true);
        console.info('[SignalR] Conectado exitosamente al Hub de Notificaciones');
      })
      .catch((err) => {
        if (!isCurrent) return;
        console.warn('[SignalR] Modo local / SignalR:', err?.message || err);
        setIsConnected(false);
      });

    return () => {
      isCurrent = false;
      setIsConnected(false);
      setConnection((current) => (current === newConnection ? null : current));
      void newConnection.stop();
    };
  }, [token]);

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

    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      connection.invoke('BroadcastActivity', user, action, target, avatarBg).catch((err) => {
        console.warn('[SignalR] Error enviando actividad:', err);
      });
    }
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
