// frontend/src/components/Report/ReportForm.tsx
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const MiniMapPicker = dynamic(() => import('./MiniMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-semibold border-2 border-dashed border-gray-300">
      Loading interactive field picker...
    </div>
  ),
});
import {
  Wheat,
  Droplet,
  Bird,
  ShieldAlert,
  TrendingDown,
  Camera,
  Mic,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  Loader2,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';
import { ReportType, ActionGuidance, ReportItem } from '@/types';
import { submitReport } from '@/lib/api';
import { useDemoUser } from '@/lib/demo-user';

export default function ReportForm() {
  const router = useRouter();
  const { currentUser } = useDemoUser();

  const [reportType, setReportType] = useState<ReportType>('crop_disease');
  const [lat, setLat] = useState<number>(9.446);
  const [lng, setLng] = useState<number>(76.458);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [notesText, setNotesText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [voiceNoteActive, setVoiceNoteActive] = useState<boolean>(false);
  const [submittedReport, setSubmittedReport] = useState<ReportItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Type specific states
  const [diseaseCode, setDiseaseCode] = useState<string>('brown_planthopper');
  const [salinityPpt, setSalinityPpt] = useState<number>(2.5);
  const [deadCount, setDeadCount] = useState<number>(15);
  const [sickCount, setSickCount] = useState<number>(25);
  const [seepageType, setSeepageType] = useState<string>('active_piping');
  const [waterHeadDiff, setWaterHeadDiff] = useState<number>(3.5);
  const [affectedAcres, setAffectedAcres] = useState<number>(2.0);

  const reportTypes = [
    {
      type: 'crop_disease' as ReportType,
      label: 'Crop Disease',
      labelMl: 'വിള രോഗം',
      icon: Wheat,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      activeColor: 'bg-emerald-700 text-white border-emerald-700 shadow-md',
      desc: 'ചാഴി, പോളരോഗം, ഇലകരിച്ചിൽ (Brown Plant Hopper, Sheath Blight)',
    },
    {
      type: 'salinity' as ReportType,
      label: 'Salinity Ingress',
      labelMl: 'ഉപ്പുവെള്ള കയറ്റം',
      icon: Droplet,
      color: 'bg-blue-50 text-blue-800 border-blue-300',
      activeColor: 'bg-blue-700 text-white border-blue-700 shadow-md',
      desc: 'തോട്ടിൽ ഉപ്പുവെള്ളം, കായൽ തടയണ ചോർച്ച (Salinity > 2.0 ppt)',
    },
    {
      type: 'bird_deaths' as ReportType,
      label: 'Bird Mortality',
      labelMl: 'താറാവ് മരണം',
      icon: Bird,
      color: 'bg-rose-50 text-rose-800 border-rose-300',
      activeColor: 'bg-rose-700 text-white border-rose-700 shadow-md',
      desc: 'താറാവ് പക്ഷിപ്പനി ലക്ഷണങ്ങൾ, പെട്ടെന്നുള്ള മരണം (Avian Flu risk)',
    },
    {
      type: 'bund_seepage' as ReportType,
      label: 'Bund Seepage',
      labelMl: 'ബണ്ട് ചോർച്ച',
      icon: ShieldAlert,
      color: 'bg-amber-50 text-amber-800 border-amber-300',
      activeColor: 'bg-amber-700 text-white border-amber-700 shadow-md',
      desc: 'പുറംബണ്ടിലെ കുഴൽച്ചോർച്ച, തകർച്ചാ ഭീഷണി (Outer bund piping)',
    },
    {
      type: 'crop_loss' as ReportType,
      label: 'Crop Loss',
      labelMl: 'വിളനാശം',
      icon: TrendingDown,
      color: 'bg-purple-50 text-purple-800 border-purple-300',
      activeColor: 'bg-purple-700 text-white border-purple-700 shadow-md',
      desc: 'വെള്ളപ്പൊക്കം, വരൾച്ച മൂലമുള്ള വിളനാശ നഷ്ടപരിഹാരം (AIMS)',
    },
  ];

  // Quick preset locations in Kuttanad
  const presets = [
    { name: 'Pulincunnoo (പുളിങ്കുന്ന്)', lat: 9.446, lng: 76.458 },
    { name: 'Moncompu RRS (മങ്കൊമ്പ്)', lat: 9.429, lng: 76.439 },
    { name: 'Nedumudy (നെടുമുടി)', lat: 9.436, lng: 76.404 },
    { name: 'Kainakary (കൈനകരി)', lat: 9.476, lng: 76.392 },
    { name: 'Champakulam (ചമ്പക്കുളം)', lat: 9.42, lng: 76.423 },
  ];

  const handlePresetSelect = (pLat: number, pLng: number) => {
    setLat(pLat);
    setLng(pLng);
  };

  const handleGpsLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(5)));
          setLng(Number(pos.coords.longitude.toFixed(5)));
        },
        () => {
          // Fallback to Pulincunnoo centroid
          setLat(9.446);
          setLng(76.458);
        }
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
        confidence: photoUrl.includes('uncertain') ? 0.52 : 0.92,
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

  // If report submitted, show Instant Action Card
  if (submittedReport && submittedReport.action_guidance) {
    const guidance = submittedReport.action_guidance;
    return (
      <div className="max-w-xl mx-auto p-4 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-200 overflow-hidden">
          {/* Card Header with Alert Level */}
          <div
            className={`p-5 text-white ${
              guidance.alert_level === 'Danger'
                ? 'bg-gradient-to-r from-red-600 to-rose-700'
                : guidance.alert_level === 'Warning'
                ? 'bg-gradient-to-r from-amber-600 to-orange-700'
                : 'bg-gradient-to-r from-emerald-600 to-green-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur">
                {guidance.alert_level} Protocol
              </span>
              <span className="text-xs opacity-90">ID: {submittedReport.id.slice(0, 8)}...</span>
            </div>
            <h2 className="text-xl font-extrabold leading-snug">{guidance.title}</h2>
            <p className="text-sm font-medium mt-1 text-white/90">{guidance.title_ml}</p>
          </div>

          {/* Action Details */}
          <div className="p-5 space-y-4">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 leading-relaxed">
              {guidance.summary}
            </div>

            {/* Step-by-step checklist */}
            <div>
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Immediate KAU / Official Action Steps</span>
              </h3>
              <ul className="space-y-2">
                {guidance.bullet_points.map((pt, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Source citation */}
            {guidance.citation && (
              <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-700">Official Citation: </span>
                  {guidance.citation}
                </div>
              </div>
            )}

            {/* Helpline contact */}
            {guidance.helpline && (
              <div className="bg-emerald-800 text-white p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-300" />
                  <span className="font-semibold">{guidance.helpline}</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  setSubmittedReport(null);
                  router.push('/');
                }}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition text-center shadow-md flex items-center justify-center gap-2"
              >
                <span>View on Live Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSubmittedReport(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl text-sm transition"
              >
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 pb-20">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-700 text-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📢</span>
            <h2 className="text-lg sm:text-xl font-black">Submit Incident Report</h2>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100">
            അടിയന്തര മുന്നറിയിപ്പ് നൽകുക • Reported as: <b>{currentUser.name}</b> ({currentUser.village_or_padasekharam})
          </p>
        </div>

        {errorMsg && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5">
          {/* 1. Five Clean Incident Types */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              1. Incident Type (സംഭവ വിഭാഗം)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {reportTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = reportType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setReportType(item.type)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected ? item.activeColor : `${item.color} hover:border-gray-400`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 font-black text-sm">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[11px] font-semibold opacity-90">{item.labelMl}</span>
                    </div>
                    <p className={`text-[11px] leading-snug ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Type-Specific Parameters */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
            {reportType === 'crop_disease' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Paddy Disease Symptoms</label>
                <select
                  value={diseaseCode}
                  onChange={(e) => setDiseaseCode(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-semibold focus:outline-emerald-600"
                >
                  <option value="brown_planthopper">Brown Plant Hopper (BPH - തവിട്ടു ചാഴി)</option>
                  <option value="sheath_blight">Sheath Blight (പോളരോഗം)</option>
                  <option value="bacterial_leaf_blight">Bacterial Leaf Blight (ബാക്ടീരിയൽ ഇലകരിച്ചിൽ)</option>
                  <option value="rice_blast">Rice Blast (കുലവാട്ടം)</option>
                </select>
              </div>
            )}

            {reportType === 'salinity' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700">Canal Salinity Reading (ppt)</label>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                    salinityPpt >= 2.0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {salinityPpt} ppt {salinityPpt >= 2.0 ? '(Danger Threshold)' : '(Watch)'}
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
                  <span>0.5 ppt (Fresh)</span>
                  <span className="font-bold text-red-600">2.0 ppt (Paddy Critical)</span>
                  <span>6.0 ppt (High Ingress)</span>
                </div>
              </div>
            )}

            {reportType === 'bird_deaths' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-rose-800 mb-1">Dead Ducks (ചത്തത്)</label>
                  <input
                    type="number"
                    min="1"
                    value={deadCount}
                    onChange={(e) => setDeadCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-rose-300 rounded-lg p-2 text-xs font-bold focus:outline-rose-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1">Sick Ducks (രോഗബാധ)</label>
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
                  <label className="block text-xs font-bold text-amber-800 mb-1">Seepage Condition</label>
                  <select
                    value={seepageType}
                    onChange={(e) => setSeepageType(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-semibold focus:outline-amber-600"
                  >
                    <option value="active_piping">Active Boiling Piping (മണൽച്ചാക്ക് അടിയന്തര ആവശ്യം)</option>
                    <option value="surface_sweat">Outer Bund Surface Wetting / Mild Leak</option>
                    <option value="settlement_crack">Tension Crack on Bund Crest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Waterhead Difference: {waterHeadDiff} Feet
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.5"
                    value={waterHeadDiff}
                    onChange={(e) => setWaterHeadDiff(parseFloat(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </div>
              </div>
            )}

            {reportType === 'crop_loss' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Affected Area (Acres)</label>
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

          {/* 3. Location Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>2. Field Location (പാടശേഖര സ്ഥലം)</span>
              </label>
              <button
                type="button"
                onClick={handleGpsLocation}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
              >
                <span>📍 GPS Locate</span>
              </button>
            </div>

            {/* Interactive Mini-Map Pin Picker */}
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

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {presets.map((p) => {
                const isSelected = Math.abs(lat - p.lat) < 0.005 && Math.abs(lng - p.lng) < 0.005;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handlePresetSelect(p.lat, p.lng)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-500 block">Latitude</span>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-bold text-gray-800 focus:outline-none"
                />
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-500 block">Longitude</span>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-bold text-gray-800 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              * Automatically snaps to the nearest connected Kuttanad canal segment if exact canal is omitted.
            </p>
          </div>

          {/* 4. Photo Upload Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              3. Photo Evidence (ചിത്രം)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Paste image URL or sample link..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-medium focus:outline-emerald-600 pl-8"
                />
                <Camera className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
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
                className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold shrink-0"
              >
                Sample Photo
              </button>
            </div>
          </div>

          {/* 5. Notes & Sarvam Voice STT Placeholder */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                4. Field Notes (കുറിപ്പ്)
              </label>

              {/* Sarvam STT Voice Note Placeholder */}
              <button
                type="button"
                onClick={() => {
                  setVoiceNoteActive(!voiceNoteActive);
                  if (!voiceNoteActive) {
                    setNotesText(
                      'കതിരുകൾക്ക് താഴെ തവിട്ടു ചാഴി കൂട്ടത്തോടെ കാണുന്നു. ഇലകൾ മഞ്ഞളിക്കുന്നുണ്ട്.'
                    );
                  }
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
              >
                <Mic className="w-3 h-3 text-amber-700" />
                <span>Malayalam Voice Note (Sarvam AI Phase 2)</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="കണ്ടത്തിൽ കണ്ട ലക്ഷണങ്ങൾ രേഖപ്പെടുത്തുക (Describe symptoms, canal name, or flock condition)..."
              className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs focus:outline-emerald-600 font-medium"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing & Checking Hydrology...</span>
              </>
            ) : (
              <>
                <span>Submit & Get Instant KAU Action Plan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
