// components/system/SystemStatus.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../lib/api';
import { socketManager } from '../../lib/socket';

interface SystemStatus {
  api: boolean;
  database: boolean;
  blockchain: boolean;
  websocket: boolean;
}

export default function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    api: false,
    database: false,
    blockchain: false,
    websocket: false,
  });
  const [loading, setLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check API health
      const healthResponse = await apiClient.getHealthStatus();
      const statusResponse = await apiClient.getSystemStatus();
      
      if (healthResponse.success) {
        setStatus(prev => ({ ...prev, api: true }));
      }

      if (statusResponse.success) {
        setSystemInfo(statusResponse.data);
        setStatus(prev => ({
          ...prev,
          database: true,
          blockchain: (statusResponse.data as any)?.blockchain?.enabled || false,
        }));
      }

      // Check WebSocket connection
      const socket = socketManager.getSocket();
      setStatus(prev => ({ 
        ...prev, 
        websocket: socket?.connected || false 
      }));

    } catch (error) {
      console.error('System status check failed:', error);
      setStatus({
        api: false,
        database: false,
        blockchain: false,
        websocket: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isOnline: boolean, isLoading: boolean) => {
    if (isLoading) {
      return <ClockIcon className="h-5 w-5 text-yellow-400 animate-spin" />;
    }
    return isOnline 
      ? <CheckCircleIcon className="h-5 w-5 text-green-400" />
      : <XCircleIcon className="h-5 w-5 text-red-400" />;
  };

  const getStatusText = (isOnline: boolean, isLoading: boolean) => {
    if (isLoading) return 'Checking...';
    return isOnline ? 'Online' : 'Offline';
  };

  const getStatusColor = (isOnline: boolean, isLoading: boolean) => {
    if (isLoading) return 'text-yellow-400';
    return isOnline ? 'text-green-400' : 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 backdrop-blur-lg border border-gray-700 rounded-lg p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">API Server</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.api, loading)}
            <span className={getStatusColor(status.api, loading)}>
              {getStatusText(status.api, loading)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">Database</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.database, loading)}
            <span className={getStatusColor(status.database, loading)}>
              {getStatusText(status.database, loading)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">Blockchain</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.blockchain, loading)}
            <span className={getStatusColor(status.blockchain, loading)}>
              {getStatusText(status.blockchain, loading)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">WebSocket</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.websocket, loading)}
            <span className={getStatusColor(status.websocket, loading)}>
              {getStatusText(status.websocket, loading)}
            </span>
          </div>
        </div>
      </div>

      {systemInfo && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 space-y-1">
            <div>Environment: {systemInfo.environment}</div>
            <div>Version: {systemInfo.version}</div>
            {systemInfo.blockchain?.chainShield && (
              <div>ChainShield: {systemInfo.blockchain.chainShield.deployed ? 'Deployed' : 'Not Deployed'}</div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
