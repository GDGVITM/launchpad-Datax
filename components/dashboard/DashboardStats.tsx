// components/dashboard/DashboardStats.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { MetricCard } from '@/components/ui/MetricCard';
import { apiClient } from '../../lib/api';

interface DashboardStatsData {
  totalLogs: number;
  totalThreats: number;
  totalAlerts: number;
  activeThreats: number;
  criticalAlerts: number;
  logsTrend: number;
  threatsTrend: number;
  alertsTrend: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData>({
    totalLogs: 0,
    totalThreats: 0,
    totalAlerts: 0,
    activeThreats: 0,
    criticalAlerts: 0,
    logsTrend: 0,
    threatsTrend: 0,
    alertsTrend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [logsResponse, threatsResponse, alertsResponse] = await Promise.all([
        apiClient.getLogStats(),
        apiClient.getThreatStats(),
        apiClient.getAlertStats(),
      ]);

      if (logsResponse.success && threatsResponse.success && alertsResponse.success) {
        setStats({
          totalLogs: logsResponse.data?.total || 0,
          totalThreats: threatsResponse.data?.total || 0,
          totalAlerts: alertsResponse.data?.total || 0,
          activeThreats: threatsResponse.data?.active || 0,
          criticalAlerts: alertsResponse.data?.critical || 0,
          logsTrend: logsResponse.data?.trend || 0,
          threatsTrend: threatsResponse.data?.trend || 0,
          alertsTrend: alertsResponse.data?.trend || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg mb-8">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={fetchDashboardStats}
          className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <MetricCard
          title="Total Security Logs"
          value={stats.totalLogs.toLocaleString()}
          trend={stats.logsTrend}
          icon={DocumentTextIcon}
          color="blue"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <MetricCard
          title="Active Threats"
          value={stats.activeThreats.toLocaleString()}
          trend={stats.threatsTrend}
          icon={ExclamationTriangleIcon}
          color="red"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <MetricCard
          title="Critical Alerts"
          value={stats.criticalAlerts.toLocaleString()}
          trend={stats.alertsTrend}
          icon={BellIcon}
          color="yellow"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <MetricCard
          title="Total Threats"
          value={stats.totalThreats.toLocaleString()}
          trend={stats.threatsTrend}
          icon={ShieldCheckIcon}
          color="green"
        />
      </motion.div>
    </motion.div>
  );
}
