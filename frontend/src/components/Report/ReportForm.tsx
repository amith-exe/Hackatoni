// frontend/src/components/Report/ReportForm.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sprout,
  Waves,
  AlertTriangle,
  Shield,
  TrendingUp,
  Camera,
  Mic,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Info,
  Loader2,
  PhoneCall,
  LocateFixed,
  FilePlus2,
  ExternalLink,
} from 'lucide-react';
import { ReportType, ReportItem } from '@/types';
import { submitReport } from '@/lib/api';
import { useDemoUser } from '@/lib/demo-user';

const MiniMapPicker = dynamic(() => import('./MiniMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-semibold border-2 border-dashed border-gray-300">
      Loading interactive field picker...
    </div>
  ),
});

function ReportFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, language, t } = useDemoUser();

  const [reportType, setReportType] = useState<ReportType>('crop_disease');

  // Pre-fill coordinates if arriving from live map pin (?lat=...&lng=...)
  const initialLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : 9.446;
  const initialLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : 76.458;

  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [notesText, setNotesText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [voiceActive, setVoiceActive] = useState<boolean>(false);
  const [submittedReport, setSubmittedReport] = useState<ReportItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Type specific states
  const [diseaseCode, setDiseaseCode] = useState<string>('brown_planthopper');
  const [salinityPpt, setSalinityPpt] = useState<number>(2.4);
  const [deadCount, setDeadCount] = useState<number>(15);
  const [sickCount, setSickCount] = useState<number>(25);
  const [seepageType, setSeepageType] = useState<string>('active_piping');
  const [waterHeadDiff, setWaterHeadDiff] = useState<number>(3.5);
  const [affectedAcres, setAffectedAcres] = useState<number>(2.0);

  // Update if query params change
  useEffect(() => {
    const pLat = searchParams.get('lat');
    const pLng = searchParams.get('lng');
    if (pLat && pLng) {
      setLat(parseFloat(pLat));
      setLng(parseFloat(pLng));
    }
  }, [searchParams]);

  const reportTypes = [
    {
      type: 'crop_disease' as ReportType,
      title: t('typeCropDisease'),
      desc: t('typeCropDiseaseDesc'),
      icon: Sprout,
      color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-950',
      activeColor: 'border-emerald-700 bg-emerald-700 text-white shadow-md',
      iconColor: 'text-emerald-700',
    },
    {
      type: 'salinity' as ReportType,
      title: t('typeSalinity'),
      desc: t('typeSalinityDesc'),
      icon: Waves,
      color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-950',
      activeColor: 'border-blue-700 bg-blue-700 text-white shadow-md',
      iconColor: 'text-blue-700',
    },
    {
      type: 'bird_deaths' as ReportType,
      title: t('typeBirdDeaths'),
      desc: t('typeBirdDeathsDesc'),
      icon: AlertTriangle,
      color: 'border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-950',
      activeColor: 'border-rose-700 bg-rose-700 text-white shadow-md',
      iconColor: 'text-rose-700',
    },
    {
      type: 'bund_seepage' as ReportType,
      title: t('typeBundSeepage'),
      desc: t('typeBundSeepageDesc'),
      icon: Shield,
      color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-950',
      activeColor: 'border-amber-700 bg-amber-700 text-white shadow-md',
      iconColor: 'text-amber-700',
    },
    {
      type: 'crop_loss' as ReportType,
      title: t('typeCropLoss'),
      desc: t('typeCropLossDesc'),
      icon: TrendingUp,
      color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-950',
      activeColor: 'border-purple-700 bg-purple-700 text-white shadow-md',
      iconColor: 'text-purple-700',
    },
  ];

  const presets = [
    { name: language === 'ml' ? 'പുളിങ്കുന്ന്' : 'Pulincunnoo', lat: 9.446, lng: 76.458 },
    { name: language === 'ml' ? 'മങ്കൊമ്പ്' : 'Moncompu', lat: 9.429, lng: 76.439 },
    { name: language === 'ml' ? 'നെടുമുടി' : 'Nedumudy', lat: 9.436, lng: 76.404 },
    { name: language === 'ml' ? 'കൈനകരി' : 'Kainakary', lat: 9.476, lng: 76.392 },
    { name: language === 'ml' ? 'ചമ്പക്കുളം' : 'Champakulam', lat: 9.42, lng: 76.423 },
  ];

  const handleUseGps = () => {
    setGpsNotice(null);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = parseFloat(position.coords.latitude.toFixed(4));
          const userLng = parseFloat(position.coords.longitude.toFixed(4));

          if (userLat >= 9.0 && userLat <= 10.2 && userLng >= 76.0 && userLng <= 77.0) {
            setLat(userLat);
            setLng(userLng);
            setGpsNotice(
              language === 'ml'
                ? `ജി.പി.എസ് ലൊക്കേഷൻ കണ്ടെത്തി (${userLat}, ${userLng})`
                : `GPS coordinates locked (${userLat}, ${userLng})`
            );
          } else {
            setLat(9.446);
            setLng(76.458);
            setGpsNotice(
              language === 'ml'
                ? 'നിങ്ങളുടെ ലൊക്കേഷൻ കുട്ടനാടിന് പുറത്താണ്. പുളിങ്കുന്ന് ഡെമോ സ്ഥാനം തിരഞ്ഞെടുത്തു.'
                : 'GPS position outside Kuttanad delta. Centered on Pulincunnoo demo polder.'
            );
          }
        },
        () => {
          setLat(9.446);
          setLng(76.458);
          setGpsNotice(
            language === 'ml'
              ? 'ലൊക്കേഷൻ അനുമതി ലഭ്യമായില്ല. പുളിങ്കുന്ന് ഡെമോ സ്ഥാനം തിരഞ്ഞെടുത്തു.'
              : 'GPS unavailable. Showing Pulincunnoo demo polder coordinates.'
          );
        },
        { timeout: 8000 }
      );
    } else {
      setGpsNotice(
        language === 'ml'
          ? 'ബ്രൗസർ ലൊക്കേഷൻ ലഭ്യമല്ല.'
          : 'Geolocation not supported by this browser.'
      );
    }
  };

  const handleVoiceInputPlaceholder = () => {
    setVoiceActive(!voiceActive);
    if (!voiceActive) {
      setNotesText(
        'Brown plant hoppers clustered at the stem base of 50-day Uma paddy. Browning circular hopper burn patches visible near the canal inlet.'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    let details: Record<string, any> = {};

    if (reportType === 'crop_disease') {
      details = {
        disease_code: diseaseCode,
        confidence: photoUrl.includes('uncertain') ? 0.55 : 0.92,
        affected_area_acres: affectedAcres,
      };
    } else if (reportType === 'salinity') {
      details = {
        salinity_ppt: salinityPpt,
        tide_phase: 'rising',
        surface_scum_visible: salinityPpt >= 2.0,
      };
    } else if (reportType === 'bird_deaths') {
      details = {
        dead_count: deadCount,
        sick_count: sickCount,
        flock_size: 1000,
        symptoms: ['sudden_death', 'loss_of_balance', 'cyanosis'],
      };
    } else if (reportType === 'bund_seepage') {
      details = {
        seepage_type: seepageType,
        water_level_diff_feet: waterHeadDiff,
        bund_length_meters: 10,
      };
    } else if (reportType === 'crop_loss') {
      details = {
        affected_area_acres: affectedAcres,
        cause: 'salinity_or_submergence',
      };
    }

    try {
      const result = await submitReport({
        reporter_id: currentUser.id,
        report_type: reportType,
        latitude: lat,
        longitude: lng,
        photo_url: photoUrl || undefined,
        notes_text: notesText || undefined,
        details,
      });

      setSubmittedReport(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  // Instant Action Card After Submit
  if (submittedReport && submittedReport.action_guidance) {
    const guidance = submittedReport.action_guidance;
    return (
      <div className="max-w-2xl mx-auto p-4 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-300 overflow-hidden">
          {/* Header */}
          <div
            className={`p-5 text-white ${
              guidance.alert_level === 'Danger'
                ? 'bg-rose-700'
                : guidance.alert_level === 'Warning'
                ? 'bg-amber-700'
                : 'bg-emerald-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 backdrop-blur">
                {guidance.alert_level} Protocol
              </span>
              <span className="text-[11px] opacity-90">
                Report ID: {submittedReport.id.slice(0, 8)}...
              </span>
            </div>
            <h2 className="text-xl font-extrabold leading-snug">{guidance.title}</h2>
            {guidance.title_ml && (
              <p className="text-sm font-medium mt-1 text-white/90">{guidance.title_ml}</p>
            )}
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">
              {guidance.summary}
            </div>

            {/* Checklist */}
            <div>
              <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Immediate Official Action Steps</span>
              </h3>
              <ul className="space-y-2">
                {guidance.bullet_points.map((pt, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Citation */}
            {guidance.citation && (
              <div className="text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-800">Official Citation: </span>
                  {guidance.citation}
                </div>
              </div>
            )}

            {/* Helpline */}
            {guidance.helpline && (
              <div className="bg-emerald-800 text-white p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-300" />
                  <span className="font-bold">{guidance.helpline}</span>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={() => {
                  setSubmittedReport(null);
                  router.push('/');
                }}
                className="w-full sm:flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm transition text-center shadow flex items-center justify-center gap-2"
              >
                <span>{t('viewPinOnMapBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSubmittedReport(null)}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition"
              >
                {t('submitAnotherBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Top Form Header */}
        <div className="bg-emerald-800 text-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <FilePlus2 className="w-5 h-5 text-emerald-300" />
            <h2 className="text-lg sm:text-xl font-extrabold">{t('reportIssue')}</h2>
          </div>
          <p className="text-xs text-emerald-100">
            Submit field incident to trigger automated hydrological routing and neighbor confirmation •
            Reporting as: <b>{currentUser.name}</b> ({currentUser.village_or_padasekharam})
          </p>
        </div>

        {errorMsg && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-6">
          {/* STEP 1: What happened? */}
          <div className="space-y-2">
            <div className="border-b border-gray-200 pb-1.5">
              <h3 className="text-sm font-extrabold text-gray-900">{t('step1Title')}</h3>
              <p className="text-[11px] text-gray-500">{t('step1Desc')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {reportTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = reportType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setReportType(item.type)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between min-h-[72px] ${
                      isSelected ? item.activeColor : `${item.color} hover:border-gray-400`
                    }`}
                  >
                    <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : item.iconColor}`} />
                      <span>{item.title}</span>
                    </div>
                    <p
                      className={`text-[11px] leading-snug ${
                        isSelected ? 'text-white/90' : 'text-gray-600'
                      }`}
                    >
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Where is it? */}
          <div className="space-y-2">
            <div className="border-b border-gray-200 pb-1.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">{t('step2Title')}</h3>
                <p className="text-[11px] text-gray-500">{t('step2Desc')}</p>
              </div>
              <button
                type="button"
                onClick={handleUseGps}
                className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1.5 rounded-xl text-xs transition border border-emerald-200"
              >
                <LocateFixed className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('useMyGps')}</span>
              </button>
            </div>

            {gpsNotice && (
              <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{gpsNotice}</span>
              </div>
            )}

            {/* Embedded MiniMap Picker */}
            <div className="my-2">
              <MiniMapPicker
                lat={lat}
                lng={lng}
                onChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }}
              />
            </div>

            {/* Quick Padasekharam Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-1">
                Presets:
              </span>
              {presets.map((p) => {
                const isSelected = Math.abs(lat - p.lat) < 0.005 && Math.abs(lng - p.lng) < 0.005;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setLat(p.lat);
                      setLng(p.lng);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* Precise Lat/Lng fields */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 block font-bold uppercase">Latitude</span>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-extrabold text-gray-900 focus:outline-none"
                />
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 block font-bold uppercase">Longitude</span>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-extrabold text-gray-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: Details, Photo & Notes */}
          <div className="space-y-3">
            <div className="border-b border-gray-200 pb-1.5">
              <h3 className="text-sm font-extrabold text-gray-900">{t('step3Title')}</h3>
              <p className="text-[11px] text-gray-500">{t('step3Desc')}</p>
            </div>

            {/* Conditional Parameters Per Report Type */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
              {reportType === 'crop_disease' && (
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    {t('diseaseDropdownLabel')}
                  </label>
                  <select
                    value={diseaseCode}
                    onChange={(e) => setDiseaseCode(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs font-semibold focus:outline-emerald-600"
                  >
                    <option value="brown_planthopper">{t('bphOption')}</option>
                    <option value="sheath_blight">{t('sheathBlightOption')}</option>
                    <option value="bacterial_leaf_blight">{t('blbOption')}</option>
                    <option value="rice_blast">{t('riceBlastOption')}</option>
                  </select>
                </div>
              )}

              {reportType === 'salinity' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-800">
                      {t('salinitySliderLabel')}
                    </label>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                        salinityPpt >= 2.0
                          ? 'bg-red-100 text-red-800'
                          : salinityPpt >= 1.5
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {salinityPpt} {t('pptUnit')}{' '}
                      {salinityPpt >= 2.0
                        ? `(${t('danger')})`
                        : salinityPpt >= 1.5
                        ? `(${t('warning')})`
                        : `(${t('safe')})`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="6.0"
                    step="0.1"
                    value={salinityPpt}
                    onChange={(e) => setSalinityPpt(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                    <span>{t('safeRange')}</span>
                    <span className="font-bold text-amber-700">{t('warningRange')}</span>
                    <span className="font-bold text-red-600">{t('dangerRange')}</span>
                  </div>
                </div>
              )}

              {reportType === 'bird_deaths' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-rose-800 mb-1">
                      {t('deadDucksLabel')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={deadCount}
                      onChange={(e) => setDeadCount(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-rose-300 rounded-lg p-2 text-xs font-bold focus:outline-rose-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-800 mb-1">
                      {t('sickDucksLabel')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={sickCount}
                      onChange={(e) => setSickCount(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-bold focus:outline-amber-600"
                    />
                  </div>
                </div>
              )}

              {reportType === 'bund_seepage' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      {t('seepageTypeLabel')}
                    </label>
                    <select
                      value={seepageType}
                      onChange={(e) => setSeepageType(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-semibold focus:outline-emerald-600"
                    >
                      <option value="active_piping">{t('activePipingOption')}</option>
                      <option value="surface_sweat">{t('surfaceSweatOption')}</option>
                      <option value="settlement_crack">{t('crestCrackOption')}</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                      <span>{t('waterHeadDiffLabel')}</span>
                      <span>
                        {waterHeadDiff} {t('feetUnit')}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="6.0"
                      step="0.5"
                      value={waterHeadDiff}
                      onChange={(e) => setWaterHeadDiff(parseFloat(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {reportType === 'crop_loss' && (
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    {t('affectedAcresLabel')}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="100"
                    value={affectedAcres}
                    onChange={(e) => setAffectedAcres(parseFloat(e.target.value) || 1)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Photo Upload / Sample */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                {t('photoEvidenceLabel')}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={t('photoPlaceholder')}
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-medium focus:outline-emerald-600 pl-8"
                  />
                  <Camera className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPhotoUrl(
                      reportType === 'crop_disease'
                        ? 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80'
                        : 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80'
                    )
                  }
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold shrink-0 transition"
                >
                  {t('useSamplePhoto')}
                </button>
              </div>
            </div>

            {/* Field Notes & Sarvam AI Voice Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-800">{t('fieldNotesLabel')}</label>
                <button
                  type="button"
                  onClick={handleVoiceInputPlaceholder}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition border border-amber-300"
                >
                  <Mic className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t('sarvamVoicePlaceholder')}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder={t('notesPlaceholder')}
                className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs focus:outline-emerald-600 font-medium"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('submittingBtn')}</span>
              </>
            ) : (
              <>
                <span>{t('submitReportBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ReportForm() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto p-8 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
          <span>Loading report interface...</span>
        </div>
      }
    >
      <ReportFormContent />
    </Suspense>
  );
}
