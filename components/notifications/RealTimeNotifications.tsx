// components/notifications/RealTimeNotifications.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  ExclamationTriangleIcon,
  BellIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { socketManager } from '../../lib/socket';

interface Notification {
  id: string;
  type: 'alert' | 'threat' | 'log';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export default function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Set up real-time event listeners
    socketManager.onNewAlert((alert: any) => {
      addNotification({
        id: alert._id,
        type: 'alert',
        title: 'New Security Alert',
        message: alert.title || alert.description,
        severity: alert.severity,
        timestamp: new Date().toISOString(),
      });
    });

    socketManager.onNewThreat((threat: any) => {
      addNotification({
        id: threat._id,
        type: 'threat',
        title: 'Threat Detected',
        message: threat.description,
        severity: threat.severity,
        timestamp: new Date().toISOString(),
      });
    });

    socketManager.onNewLog((log: any) => {
      if (log.severity === 'high' || log.severity === 'critical') {
        addNotification({
          id: log._id,
          type: 'log',
          title: 'Critical Security Event',
          message: log.message,
          severity: log.severity,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return () => {
      socketManager.removeAllListeners();
    };
  }, []);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only last 5
    
    // Auto-remove after 10 seconds for non-critical notifications
    if (notification.severity !== 'critical') {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 10000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string, severity: string) => {
    switch (type) {
      case 'alert':
        return BellIcon;
      case 'threat':
        return ExclamationTriangleIcon;
      case 'log':
        return ShieldExclamationIcon;
      default:
        return BellIcon;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-900/30';
      case 'high':
        return 'border-orange-500 bg-orange-900/30';
      case 'medium':
        return 'border-yellow-500 bg-yellow-900/30';
      case 'low':
        return 'border-blue-500 bg-blue-900/30';
      default:
        return 'border-gray-500 bg-gray-900/30';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => {
          const IconComponent = getIcon(notification.type, notification.severity);
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`border rounded-lg p-4 backdrop-blur-lg ${getSeverityColor(notification.severity)}`}
            >
              <div className="flex items-start space-x-3">
                <IconComponent className="h-6 w-6 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
