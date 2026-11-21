// frontend/src/components/Alerts/AlertsInbox.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Waves,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Check,
  MapPin,
  Loader2,
  Clock,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { AlertItem } from '@/types';
import { fetchAlerts, markAlertsRead } from '@/lib/api';
import { useDemoUser } from '@/lib/demo-user';

export default function AlertsInbox() {
  const router = useRouter();
  const { t, language } = useDemoUser();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'salinity' | 'verification'>('all');
  const [markingAll, setMarkingAll] = useState<boolean>(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleMarkRead = async (alertId: string) => {
    try {
      await markAlertsRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAlertsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleJumpToMap = (alert: AlertItem) => {
    if (alert.location) {
      router.push(`/?lat=${alert.location.lat}&lng=${alert.location.lng}`);
    } else {
      router.push('/');
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'salinity') {
      return alert.category === 'salinity' || alert.category === 'cluster';
    }
    if (filterCategory === 'verification') {
      return alert.category === 'verification';
    }
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-20">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
                {t('alertsTitle')}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">{t('alertsDesc')}</p>
            </div>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl text-xs transition border border-gray-200 disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4 text-emerald-700" />
            <span>{t('markAllRead')}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-2 rounded-xl transition border flex items-center gap-1.5 ${
            filterCategory === 'all'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <span>{t('filterAll')}</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filterCategory === 'all'
                ? 'bg-emerald-900/60 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {alerts.length}
          </span>
        </button>

        <button
          onClick={() => setFilterCategory('salinity')}
          className={`px-3 py-2 rounded-xl transition border flex items-center gap-1.5 ${
            filterCategory === 'salinity'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Waves className="w-3.5 h-3.5 text-blue-600" />
          <span>{t('filterSalinityClusters')}</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filterCategory === 'salinity'
                ? 'bg-emerald-900/60 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {alerts.filter((a) => a.category === 'salinity' || a.category === 'cluster').length}
          </span>
        </button>

        <button
          onClick={() => setFilterCategory('verification')}
          className={`px-3 py-2 rounded-xl transition border flex items-center gap-1.5 ${
            filterCategory === 'verification'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('filterVerification')}</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filterCategory === 'verification'
                ? 'bg-emerald-900/60 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {alerts.filter((a) => a.category === 'verification').length}
          </span>
        </button>
      </div>

      {/* Alert Feed List */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
          <span>Loading notification inbox...</span>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 text-xs">
          {t('noAlertsFound')}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isRead = alert.is_read;

            let icon = <Bell className="w-4 h-4 text-emerald-700" />;
            if (alert.category === 'salinity') {
              icon = <Waves className="w-4 h-4 text-blue-600" />;
            } else if (alert.category === 'cluster') {
              icon = <AlertTriangle className="w-4 h-4 text-amber-600" />;
            } else if (alert.category === 'verification') {
              icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
            }

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border p-4 transition shadow-sm ${
                  isRead
                    ? 'bg-white border-gray-200 opacity-80'
                    : 'bg-emerald-50/30 border-emerald-200 shadow'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 border ${
                        alert.alert_level === 'Danger'
                          ? 'bg-red-50 border-red-200'
                          : alert.alert_level === 'Warning'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      {icon}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-extrabold text-sm text-gray-900">
                          {alert.title}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            alert.alert_level === 'Danger'
                              ? 'bg-red-100 text-red-800'
                              : alert.alert_level === 'Warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {alert.alert_level}
                        </span>

                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        )}
                      </div>

                      <p className="text-xs text-gray-700 leading-relaxed font-medium">
                        {alert.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>
                            {new Date(alert.timestamp).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            •{' '}
                            {new Date(alert.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>

                        {alert.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>
                              {alert.location.lat.toFixed(3)}, {alert.location.lng.toFixed(3)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleJumpToMap(alert)}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 font-bold rounded-xl text-xs transition border border-gray-200 flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{t('jumpToLocation')}</span>
                    </button>

                    {!isRead && (
                      <button
                        onClick={() => handleMarkRead(alert.id)}
                        className="p-1.5 text-gray-400 hover:text-emerald-700 transition"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
