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
  Check,
  X,
} from 'lucide-react';
import { ReportType, ReportItem } from '@/types';
import { submitReport } from '@/lib/api';
import { useDemoUser } from '@/lib/demo-user';

const MiniMapPicker = dynamic(() => import('./MiniMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 sm:h-72 rounded-2xl bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-semibold border-2 border-dashed border-gray-300">
      Loading interactive field picker...
    </div>
  ),
});

const kuttanadPolders = [
  { nameEn: 'Pulincunnoo Padasekharam', nameMl: 'പുളിങ്കുന്ന് പാടശേഖരം', lat: 9.446, lng: 76.458 },
  { nameEn: 'Moncompu Padasekharam', nameMl: 'മങ്കൊമ്പ് പാടശേഖരം', lat: 9.429, lng: 76.439 },
  { nameEn: 'Nedumudy Padasekharam', nameMl: 'നെടുമുടി പാടശേഖരം', lat: 9.436, lng: 76.404 },
  { nameEn: 'Kainakary Padasekharam', nameMl: 'കൈനകരി പാടശേഖരം', lat: 9.476, lng: 76.392 },
  { nameEn: 'Champakulam Padasekharam', nameMl: 'ചമ്പക്കുളം പാടശേഖരം', lat: 9.42, lng: 76.423 },
  { nameEn: 'Ramankary Padasekharam', nameMl: 'രാമങ്കരി പാടശേഖരം', lat: 9.408, lng: 76.478 },
  { nameEn: 'Kavalam Padasekharam', nameMl: 'കാവാലം പാടശേഖരം', lat: 9.492, lng: 76.421 },
];

function getNearestPolder(lat: number, lng: number, isMl: boolean) {
  let closest = kuttanadPolders[0];
  let minDist = 999999;
  for (const p of kuttanadPolders) {
    const d = Math.hypot(lat - p.lat, lng - p.lng);
    if (d < minDist) {
      minDist = d;
      closest = p;
    }
  }
  return isMl ? closest.nameMl : closest.nameEn;
}

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
  const [voiceTranscribed, setVoiceTranscribed] = useState<boolean>(false);
  const [submittedReport, setSubmittedReport] = useState<ReportItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Type specific states
  const [diseaseCode, setDiseaseCode] = useState<string>('brown_planthopper');
  const [salinityPpt, setSalinityPpt] = useState<number>(2.4);
  const [tidePhase, setTidePhase] = useState<string>('rising');
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
      activeColor: 'border-emerald-700 bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500',
      iconColor: 'text-emerald-700',
    },
    {
      type: 'salinity' as ReportType,
      title: t('typeSalinity'),
      desc: t('typeSalinityDesc'),
      icon: Waves,
      color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-950',
      activeColor: 'border-blue-700 bg-blue-700 text-white shadow-md ring-2 ring-blue-500',
      iconColor: 'text-blue-700',
    },
    {
      type: 'bird_deaths' as ReportType,
      title: t('typeBirdDeaths'),
      desc: t('typeBirdDeathsDesc'),
      icon: AlertTriangle,
      color: 'border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-950',
      activeColor: 'border-rose-700 bg-rose-700 text-white shadow-md ring-2 ring-rose-500',
      iconColor: 'text-rose-700',
    },
    {
      type: 'bund_seepage' as ReportType,
      title: t('typeBundSeepage'),
      desc: t('typeBundSeepageDesc'),
      icon: Shield,
      color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-950',
      activeColor: 'border-amber-700 bg-amber-700 text-white shadow-md ring-2 ring-amber-500',
      iconColor: 'text-amber-700',
    },
    {
      type: 'crop_loss' as ReportType,
      title: t('typeCropLoss'),
      desc: t('typeCropLossDesc'),
      icon: TrendingUp,
      color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-950',
      activeColor: 'border-purple-700 bg-purple-700 text-white shadow-md ring-2 ring-purple-500',
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
    setGpsNotice(language === 'ml' ? 'ജി.പി.എസ് സ്ഥാനം പരിശോധിക്കുന്നു...' : 'Locking GPS position...');
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
                : 'GPS position outside Kuttanad delta. Pulincunnoo demo polder selected.'
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
        { timeout: 7000 }
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
    setVoiceActive(true);
    setTimeout(() => {
      setNotesText(
        'Brown plant hoppers clustered at the stem base of 50-day Uma paddy. Browning circular hopper burn patches visible near the canal inlet.'
      );
      setVoiceActive(false);
      setVoiceTranscribed(true);
    }, 700);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    let details: Record<string, any> = {};

    if (reportType === 'crop_disease') {
      details = {
        disease_code: diseaseCode,
        confidence: photoUrl.includes('uncertain') ? 0.55 : 0.94,
        affected_area_acres: affectedAcres,
      };
    } else if (reportType === 'salinity') {
      details = {
        salinity_ppt: salinityPpt,
        tide_phase: tidePhase,
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
        bund_length_meters: 15,
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
      <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-24 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-300 overflow-hidden">
          {/* Header */}
          <div
            className={`p-6 text-white ${
              guidance.alert_level === 'Danger'
                ? 'bg-rose-700'
                : guidance.alert_level === 'Warning'
                ? 'bg-amber-700'
                : 'bg-emerald-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur">
                {guidance.alert_level} Protocol
              </span>
              <span className="text-xs opacity-90 font-bold">
                Locus: {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold leading-snug">{guidance.title}</h2>
            {guidance.title_ml && (
              <p className="text-sm font-medium mt-1 text-white/90">{guidance.title_ml}</p>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">
              {guidance.summary}
            </div>

            {/* Checklist */}
            <div>
              <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Immediate Official Action Steps</span>
              </h3>
              <ul className="space-y-2.5">
                {guidance.bullet_points.map((pt, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-xs sm:text-sm text-gray-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Citation */}
            {guidance.citation && (
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-800">Official Citation: </span>
                  {guidance.citation}
                </div>
              </div>
            )}

            {/* Helpline */}
            {guidance.helpline && (
              <div className="bg-emerald-800 text-white p-3.5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-300" />
                  <span className="font-bold">{guidance.helpline}</span>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  setSubmittedReport(null);
                  router.push('/');
                }}
                className="w-full sm:flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs sm:text-sm transition text-center shadow flex items-center justify-center gap-2"
              >
                <span>{t('viewPinOnMapBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSubmittedReport(null);
                  setPhotoUrl('');
                  setNotesText('');
                  setVoiceTranscribed(false);
                }}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 px-5 rounded-xl text-xs sm:text-sm transition"
              >
                {t('submitAnotherBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const detectedPolder = getNearestPolder(lat, lng, language === 'ml');

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-24">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Top Form Banner Header */}
        <div className="bg-emerald-800 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FilePlus2 className="w-5 h-5 text-emerald-300" />
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{t('reportIssue')}</h2>
            </div>
            <p className="text-xs text-emerald-100 font-medium">
              Broadcasts immediate early-warning across connected polders and triggers neighbor confirmation
            </p>
          </div>
          <div className="bg-emerald-900/80 border border-emerald-700/80 rounded-xl px-3 py-1.5 text-right self-start sm:self-auto">
            <span className="text-[10px] text-emerald-300 uppercase tracking-wider block font-bold">Reporting Profile</span>
            <span className="text-xs font-bold text-white flex items-center gap-1 justify-end">
              <span>{currentUser.name}</span>
              <span className="text-emerald-300 font-normal">({currentUser.village_or_padasekharam})</span>
            </span>
          </div>
        </div>

        {/* 3-Step Guided Progress Tracker */}
        <div className="bg-gray-50/80 border-b border-gray-200 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">1</span>
              <span className="font-bold text-gray-900">Incident Type</span>
            </div>
            <div className="flex-1 mx-2 sm:mx-4 h-0.5 bg-emerald-300"></div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">2</span>
              <span className="font-bold text-gray-900">Field Locus</span>
            </div>
            <div className="flex-1 mx-2 sm:mx-4 h-0.5 bg-emerald-300"></div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">3</span>
              <span className="font-bold text-gray-900">Evidence & Advice</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-7">
          {/* STEP 1: What happened? */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">1</span>
                  <span>{t('step1Title')}</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{t('step1Desc')}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {reportTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = reportType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setReportType(item.type)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition relative flex flex-col justify-between min-h-[82px] ${
                      isSelected
                        ? item.activeColor
                        : `${item.color} hover:border-gray-400`
                    } ${item.type === 'crop_loss' ? 'sm:col-span-2' : ''}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : item.iconColor}`} />
                          <span>{item.title}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white/20 text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] leading-snug mt-1 ${
                          isSelected ? 'text-white/90' : 'text-gray-600'
                        }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Where is it? */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">2</span>
                  <span>{t('step2Title')}</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{t('step2Desc')}</p>
              </div>
              <button
                type="button"
                onClick={handleUseGps}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl text-xs transition border border-emerald-300 shadow-sm self-start sm:self-auto"
              >
                <LocateFixed className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('useMyGps')}</span>
              </button>
            </div>

            {/* Detected Polder Banner */}
            <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-bold text-gray-700">Detected Padasekharam:</span>
                <span className="font-extrabold text-emerald-900">{detectedPolder}</span>
              </div>
              {gpsNotice && (
                <span className="text-[11px] text-emerald-700 font-semibold hidden sm:inline">{gpsNotice}</span>
              )}
            </div>

            {/* Embedded MiniMap Picker */}
            <div>
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
                Quick Presets:
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
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* Coordinates Readout Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 block font-bold uppercase mb-0.5">Latitude (North)</span>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-extrabold text-sm text-gray-900 focus:outline-none"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 block font-bold uppercase mb-0.5">Longitude (East)</span>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-extrabold text-sm text-gray-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: Details, Photo & Notes */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">3</span>
                <span>{t('step3Title')}</span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">{t('step3Desc')}</p>
            </div>

            {/* Dynamic Specifics Container */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
              {reportType === 'crop_disease' && (
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    {t('diseaseDropdownLabel')}
                  </label>
                  <select
                    value={diseaseCode}
                    onChange={(e) => setDiseaseCode(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-emerald-600 shadow-sm"
                  >
                    <option value="brown_planthopper">{t('bphOption')}</option>
                    <option value="sheath_blight">{t('sheathBlightOption')}</option>
                    <option value="bacterial_leaf_blight">{t('blbOption')}</option>
                    <option value="rice_blast">{t('riceBlastOption')}</option>
                  </select>

                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-extrabold text-gray-800">
                        {t('affectedAcresLabel')}
                      </label>
                      <div className="flex items-center gap-1">
                        {[0.5, 1.0, 2.0, 5.0].map((ac) => (
                          <button
                            key={ac}
                            type="button"
                            onClick={() => setAffectedAcres(ac)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                              affectedAcres === ac
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50'
                            }`}
                          >
                            {ac} ac
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      max="100"
                      value={affectedAcres}
                      onChange={(e) => setAffectedAcres(parseFloat(e.target.value) || 1)}
                      className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-900 focus:outline-emerald-600 shadow-sm"
                    />
                  </div>
                </div>
              )}

              {reportType === 'salinity' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-extrabold text-gray-800">
                      {t('salinitySliderLabel')}
                    </label>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                        salinityPpt >= 2.0
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : salinityPpt >= 1.5
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {salinityPpt.toFixed(1)} {t('pptUnit')}{' '}
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
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-semibold">
                    <span className="text-emerald-700">{t('safeRange')}</span>
                    <span className="font-bold text-amber-700">{t('warningRange')}</span>
                    <span className="font-bold text-red-600">{t('dangerRange')}</span>
                  </div>

                  <div className="pt-2 mt-3 border-t border-gray-200">
                    <label className="block text-xs font-extrabold text-gray-800 mb-1">
                      Estuary Tide Condition
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-blue-50">
                        <input
                          type="radio"
                          name="tide"
                          value="rising"
                          checked={tidePhase === 'rising'}
                          onChange={() => setTidePhase('rising')}
                          className="accent-blue-600"
                        />
                        <span className="font-bold text-gray-800">Rising Flood Tide</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-blue-50">
                        <input
                          type="radio"
                          name="tide"
                          value="ebbing"
                          checked={tidePhase === 'ebbing'}
                          onChange={() => setTidePhase('ebbing')}
                          className="accent-blue-600"
                        />
                        <span className="font-bold text-gray-800">Low Ebb Tide</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {reportType === 'bird_deaths' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-extrabold text-rose-800">
                        {t('deadDucksLabel')}
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDeadCount(Math.max(1, deadCount - 5))}
                          className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 font-black text-xs border border-rose-200"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeadCount(deadCount + 5)}
                          className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 font-black text-xs border border-rose-200"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={deadCount}
                      onChange={(e) => setDeadCount(parseInt(e.target.value) || 1)}
                      className="w-full bg-rose-50/40 border border-rose-300 rounded-lg p-2 text-sm font-extrabold text-rose-900 focus:outline-rose-600"
                    />
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-extrabold text-amber-800">
                        {t('sickDucksLabel')}
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSickCount(Math.max(0, sickCount - 5))}
                          className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-black text-xs border border-amber-200"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => setSickCount(sickCount + 5)}
                          className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-black text-xs border border-amber-200"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={sickCount}
                      onChange={(e) => setSickCount(parseInt(e.target.value) || 0)}
                      className="w-full bg-amber-50/40 border border-amber-300 rounded-lg p-2 text-sm font-extrabold text-amber-900 focus:outline-amber-600"
                    />
                  </div>
                </div>
              )}

              {reportType === 'bund_seepage' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-800 mb-1">
                      {t('seepageTypeLabel')}
                    </label>
                    <select
                      value={seepageType}
                      onChange={(e) => setSeepageType(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-amber-600 shadow-sm"
                    >
                      <option value="active_piping">{t('activePipingOption')}</option>
                      <option value="surface_sweat">{t('surfaceSweatOption')}</option>
                      <option value="settlement_crack">{t('crestCrackOption')}</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-extrabold text-gray-800 mb-1">
                      <span>{t('waterHeadDiffLabel')}</span>
                      <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
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
                      className="w-full accent-amber-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {reportType === 'crop_loss' && (
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-gray-800">
                    {t('affectedAcresLabel')}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="100"
                    value={affectedAcres}
                    onChange={(e) => setAffectedAcres(parseFloat(e.target.value) || 1)}
                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-900 focus:outline-purple-600 shadow-sm"
                  />
                  <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 text-[11px] text-purple-900 leading-relaxed">
                    <span className="font-bold">AIMS Notice:</span> Statutory compensation claims under Kerala agricultural insurance must be logged within 72 hours of water logging.
                  </div>
                </div>
              )}
            </div>

            {/* Photo Evidence Card with Live Thumbnail */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
              <label className="block text-xs font-extrabold text-gray-800">
                {t('photoEvidenceLabel')}
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                  className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-extrabold shrink-0 transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t('useSamplePhoto')}</span>
                </button>
              </div>

              {photoUrl && (
                <div className="mt-2 p-2.5 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={photoUrl}
                      alt="Evidence preview"
                      className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">
                        {reportType === 'crop_disease'
                          ? 'BPH Hopperburn Symptom (Sample)'
                          : 'Field Evidence Sample'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Verified resolution for diagnosis
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Field Notes & Sarvam AI Voice Input */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold text-gray-800">{t('fieldNotesLabel')}</label>
                <button
                  type="button"
                  onClick={handleVoiceInputPlaceholder}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition border shadow-sm ${
                    voiceActive
                      ? 'bg-amber-300 text-amber-950 border-amber-400 animate-pulse'
                      : voiceTranscribed
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    {voiceActive
                      ? 'Listening (Malayalam / English)...'
                      : voiceTranscribed
                      ? 'Voice Recorded (Sarvam AI)'
                      : t('sarvamVoicePlaceholder')}
                  </span>
                </button>
              </div>
              <textarea
                rows={3}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder={t('notesPlaceholder')}
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs focus:outline-emerald-600 font-medium text-gray-800 shadow-sm"
              />
              {voiceTranscribed && (
                <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Transcribed via Sarvam AI saaras:v4 (Malayalam / English Audio Model)</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold py-4 px-6 rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting & Checking Hydrology...</span>
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
        <div className="max-w-3xl mx-auto p-8 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
          <span>Loading report interface...</span>
        </div>
      }
    >
      <ReportFormContent />
    </Suspense>
  );
}
