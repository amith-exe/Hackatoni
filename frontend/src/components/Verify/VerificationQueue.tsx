// frontend/src/components/Verify/VerificationQueue.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ReportItem, VerificationStatus } from '@/types';
import { fetchMapFeed, confirmReport, verifyReport } from '@/lib/api';
import { useDemoUser } from '@/lib/demo-user';
import {
  CheckCircle2,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Loader2,
  RefreshCw,
  Droplet,
  Wheat,
  Bird,
  ShieldAlert,
  TrendingDown,
} from 'lucide-react';

export default function VerificationQueue() {
  const { currentUser, isOfficer } = useDemoUser();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'unconfirmed' | 'community_confirmed' | 'all'>('unconfirmed');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchMapFeed();
      setReports(data.reports);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to load reports', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirm = async (reportId: string) => {
    setActionLoadingId(reportId);
    setStatusMessage(null);
    try {
      const updated = await confirmReport(reportId, currentUser.id);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setStatusMessage({
        text: `Successfully confirmed! Confirmations now: ${updated.confirmations_count}`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOfficialVerify = async (reportId: string, status: 'officially_verified' | 'rejected') => {
    setActionLoadingId(reportId);
    setStatusMessage(null);
    try {
      const updated = await verifyReport(
        reportId,
        currentUser.id,
        status,
        `Officer verification logged by ${currentUser.name}`
      );
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setStatusMessage({
        text: `Report officially marked as ${status.replace('_', ' ')}`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (activeTab === 'unconfirmed') return r.verification_status === 'unconfirmed';
    if (activeTab === 'community_confirmed') return r.verification_status === 'community_confirmed';
    return true;
  });

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'crop_disease':
        return <Wheat className="w-4 h-4 text-emerald-600" />;
      case 'salinity':
        return <Droplet className="w-4 h-4 text-blue-600" />;
      case 'bird_deaths':
        return <Bird className="w-4 h-4 text-rose-600" />;
      case 'bund_seepage':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      default:
        return <TrendingDown className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 pb-20">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <span>Trust Verification & Peer Review</span>
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Acting as: <b className="text-emerald-800">{currentUser.name}</b> (
              <span className={isOfficer ? 'text-blue-700 font-bold' : 'text-emerald-700 font-bold'}>
                {currentUser.role === 'officer' ? '🏛️ Krishi Bhavan Officer' : '🌾 Neighbor Farmer'}
              </span>
              )
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 transition self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Role guidance callout */}
        <div className="mt-3 p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
          <span className="text-sm">💡</span>
          <div>
            {isOfficer ? (
              <span>
                <b>Officer Inspection Mode:</b> You can officially verify or reject community reports to seal government insurance records.
              </span>
            ) : (
              <span>
                <b>Farmer Peer Review Mode:</b> Tap <b>"Confirm Report"</b> if you observed the same issue in your padasekharam. At <b>2 confirmations</b>, reports automatically promote to <b>Community Confirmed</b>.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toast message */}
      {statusMessage && (
        <div
          className={`p-3 mb-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-100 border border-emerald-200 text-emerald-800'
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('unconfirmed')}
          className={`pb-2.5 px-4 transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'unconfirmed'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>Pending Confirmation</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">
            {reports.filter((r) => r.verification_status === 'unconfirmed').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('community_confirmed')}
          className={`pb-2.5 px-4 transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'community_confirmed'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>Community Confirmed</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px]">
            {reports.filter((r) => r.verification_status === 'community_confirmed').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2.5 px-4 transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>All Reports ({reports.length})</span>
        </button>
      </div>

      {/* Report Cards List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
          <span>Loading verification queue...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-xs">
          No reports found in this queue category.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const isProcessing = actionLoadingId === report.id;

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow transition"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                      {getReportIcon(report.report_type)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 capitalize">
                        {report.report_type.replace('_', ' ')}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{report.canal_name || 'Nearest Canal'}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                      report.verification_status === 'officially_verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : report.verification_status === 'community_confirmed'
                        ? 'bg-blue-100 text-blue-800'
                        : report.verification_status === 'rejected'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {report.verification_status.replace('_', ' ')}
                  </span>
                </div>

                {/* Report Details */}
                <div className="text-xs text-gray-700 my-2 space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  {report.details?.disease_code && (
                    <div>
                      Pathogen: <b className="text-gray-900">{report.details.disease_code}</b> (Confidence:{' '}
                      {Math.round((report.details.confidence || 0) * 100)}%)
                    </div>
                  )}
                  {report.details?.salinity_ppt && (
                    <div>
                      Salinity Reading: <b className="text-blue-700">{report.details.salinity_ppt} ppt</b>
                    </div>
                  )}
                  {report.details?.dead_count && (
                    <div>
                      Mortality: <b className="text-rose-700">{report.details.dead_count} Dead</b> |{' '}
                      {report.details.sick_count || 0} Sick
                    </div>
                  )}
                  {report.details?.water_level_diff_feet && (
                    <div>
                      Head Differential: <b>{report.details.water_level_diff_feet} ft</b> ({report.details.seepage_type})
                    </div>
                  )}
                  {report.notes_text && (
                    <div className="italic text-gray-600 pt-1 border-t border-gray-200">
                      "{report.notes_text}"
                    </div>
                  )}
                </div>

                {/* Footer with action buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 mt-2">
                  <div className="text-[11px] text-gray-500 font-semibold flex items-center gap-1.5">
                    <span>Neighbor Confirmations:</span>
                    <span className="px-1.5 py-0.2 rounded bg-gray-100 font-bold text-gray-800">
                      {report.confirmations_count}
                    </span>
                    {report.confirmations_count >= 2 && (
                      <span className="text-blue-600 font-bold text-[10px]">✓ Promoted</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Farmer Action: Confirm Report */}
                    {!isOfficer && report.verification_status !== 'officially_verified' && (
                      <button
                        onClick={() => handleConfirm(report.id)}
                        disabled={isProcessing}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition flex items-center gap-1 disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Confirm Report</span>
                      </button>
                    )}

                    {/* Officer Action: Officially Verify or Reject */}
                    {isOfficer && (
                      <>
                        <button
                          onClick={() => handleOfficialVerify(report.id, 'officially_verified')}
                          disabled={isProcessing || report.verification_status === 'officially_verified'}
                          className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition flex items-center gap-1 disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          <span>Officially Verify</span>
                        </button>
                        <button
                          onClick={() => handleOfficialVerify(report.id, 'rejected')}
                          disabled={isProcessing || report.verification_status === 'rejected'}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1.5 px-2.5 rounded-xl text-xs transition flex items-center gap-1 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5 text-gray-500" />
                          <span>Reject</span>
                        </button>
                      </>
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
