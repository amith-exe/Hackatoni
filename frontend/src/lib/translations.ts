// frontend/src/lib/translations.ts
import { Language } from '@/types';

export const translations = {
  en: {
    // Top Bar & Navigation
    networkName: 'Kuttanad Polder Early-Warning Network',
    tagline: 'Community-Verified Agro-Hydrology Platform',
    liveMap: 'Live Map',
    reportIssue: 'Report Issue',
    verifyQueue: 'Verify Queue',
    alertsInbox: 'Alerts',
    howItWorks: 'How It Works',
    signIn: 'Sign In',
    userRoleFarmer: 'Farmer',
    userRoleOfficer: 'Krishi Officer',
    kisanCallCenter: 'Kisan Call Center: 1800-180-1551',
    langToggle: 'ML',

    // Telemetry Bar
    activeReports: 'Active Reports',
    salineIngressCanals: 'Saline Ingress Canals',
    activeOutbreaks: 'Active Outbreaks',
    rain24h: 'Rain (24h)',
    danger: 'Danger',
    warning: 'Warning',
    watch: 'Watch',
    safe: 'Safe',
    reportIncidentBtn: '+ Report Issue',

    // Map & Dropped Pin
    pinHint: 'Tap or click anywhere on the map to drop a pin and report an issue there',
    droppedPinTitle: 'Selected Field Location',
    reportAtPinBtn: 'Report Issue at This Pin',
    clearPinBtn: 'Clear Pin',
    mapLayers: 'Map Layers',
    waterwaysLayer: 'Kuttanad Waterways',
    topoLayer: 'Topo Street',
    satelliteLayer: 'Satellite Imagery',
    legendTitle: 'Verification Tiers',
    unconfirmed: 'Unconfirmed (0-1 confirms)',
    communityConfirmed: 'Community Confirmed (2+ neighbors)',
    officiallyVerified: 'Officially Verified (Krishi Bhavan)',
    salineCanalLegend: 'Salinity Intrusion Canal',
    demoBannerTitle: 'Kuttanad Demo Mode:',
    demoBannerDesc: 'Realistic delta canal flows, outbreaks, and community reports are active for demonstration. Tap anywhere on the map to pin a new report.',

    // Local Trend Panel
    localTrendTitle: 'Local Field Outlook',
    useMyGps: 'Use My GPS',
    nearbyReports7d: 'Nearby Reports (7d)',
    prior7dComparison: 'vs. Prior 7 Days',
    trendGrowing: 'Growing Trend',
    trendStable: 'Stable Trend',
    trendWatch: 'Low Baseline',
    nearestCanal: 'Nearest Canal',
    nearestSalinity: 'Salinity',
    recommendedAction: 'Recommended Immediate Action',
    noNearbyIncidents: 'No incidents recorded within 3 km in the past 7 days.',

    // Report Form
    step1Title: 'Step 1 — What happened?',
    step1Desc: 'Select the primary issue category affecting your field or channel',
    step2Title: 'Step 2 — Where is it?',
    step2Desc: 'Tap on the mini-map or drag the pin to mark your exact polder or bund',
    step3Title: 'Step 3 — Details, Photo & Notes',
    step3Desc: 'Provide specifics to help neighbors verify and officials take action',

    typeCropDisease: 'Crop Disease',
    typeCropDiseaseDesc: 'Brown Plant Hopper, Sheath Blight, Bacterial Blight',
    typeSalinity: 'Salinity Ingress',
    typeSalinityDesc: 'Canal water salinity above 2.0 ppt threshold',
    typeBirdDeaths: 'Duck Mortality',
    typeBirdDeathsDesc: 'Unexplained bird deaths or Avian Flu symptoms',
    typeBundSeepage: 'Bund Seepage',
    typeBundSeepageDesc: 'Boiling piping breach or outer ring bund crack',
    typeCropLoss: 'Crop Loss',
    typeCropLossDesc: 'AIMS 72-hour statutory compensation claim',

    diseaseDropdownLabel: 'Observed Disease / Pest',
    bphOption: 'Brown Plant Hopper (BPH)',
    sheathBlightOption: 'Sheath Blight',
    blbOption: 'Bacterial Leaf Blight (BLB)',
    riceBlastOption: 'Rice Blast',

    salinitySliderLabel: 'Canal Salinity Reading',
    pptUnit: 'ppt',
    safeRange: 'Below 1.5 ppt (Safe)',
    warningRange: '1.5 - 1.9 ppt (Caution)',
    dangerRange: '2.0+ ppt (Critical Hazard)',

    deadDucksLabel: 'Dead Ducks',
    sickDucksLabel: 'Sick Ducks',

    seepageTypeLabel: 'Seepage Condition',
    activePipingOption: 'Active Boiling Piping (Sandbag Emergency)',
    surfaceSweatOption: 'Outer Bund Surface Wetting',
    crestCrackOption: 'Tension Crack on Bund Crest',
    waterHeadDiffLabel: 'Waterhead Level Difference',
    feetUnit: 'feet',

    affectedAcresLabel: 'Affected Area (Acres)',

    photoEvidenceLabel: 'Photo Evidence',
    photoPlaceholder: 'Paste image URL or click Sample...',
    useSamplePhoto: 'Use Sample Photo',

    fieldNotesLabel: 'Field Notes & Observations',
    notesPlaceholder: 'Describe symptoms, water levels, or immediate assistance needed...',
    sarvamVoicePlaceholder: 'Voice Input — Sarvam AI (Next Step)',

    submitReportBtn: 'Submit Report & Generate Action Plan',
    submittingBtn: 'Submitting and Routing...',

    // Instant Action Card
    actionCardSuccessTitle: 'Report Logged & Snapped to Canal Network',
    viewPinOnMapBtn: 'View Pin on Live Map',
    submitAnotherBtn: 'Submit Another Report',

    // Alerts Inbox
    alertsTitle: 'Notification Inbox',
    alertsDesc: 'Real-time hydrological alerts, pest outbreak clusters, and peer review updates',
    filterAll: 'All Alerts',
    filterSalinityClusters: 'Salinity & Outbreaks',
    filterVerification: 'Verification Updates',
    markAllRead: 'Mark all as read',
    noAlertsFound: 'No alerts found in this category.',
    jumpToLocation: 'View on Map',

    // Verify Queue
    verifyQueueTitle: 'Trust Verification Queue',
    verifyQueueDesc: 'Neighboring farmers review and confirm field reports; Krishi Officers provide official sanction.',
    confirmReportBtn: 'Confirm Report',
    officiallyVerifyBtn: 'Officially Verify',
    rejectBtn: 'Reject',
    confirmationsBadge: 'Confirmations',
    noReportsToVerify: 'No unverified reports in your sector right now.',

    // Modals
    howItWorksModalTitle: 'How Karshakan Lens Works',
    howItWorksPolderTitle: '1. Below-Sea-Level Polder Hydrology',
    howItWorksPolderDesc: 'Kuttanad polders lie 1.5 to 2.5 meters below sea level. Salinity travels upstream through backwater canals, not in radial circles. Karshakan Lens models water movements through connected canal segments.',
    howItWorksDbscanTitle: '2. DBSCAN Spatial Clustering (2.0 km / 7 Days)',
    howItWorksDbscanDesc: 'Using the scikit-learn Haversine DBSCAN algorithm, nearby incidents within 2.0 km reported in the past 7 days are automatically clustered. Isolated noise is filtered out, while growing pest outbreaks trigger localized early warnings.',
    howItWorksTrustTitle: '3. Community Peer Review & Officer Validation',
    howItWorksTrustDesc: 'A report begins as Unconfirmed. Once 2 neighboring farmers confirm the observation, it promotes to Community Confirmed. Krishi Bhavan officers can then grant Official Verification.',
    howItWorksKauTitle: '4. Zero Chemical Hallucinations',
    howItWorksKauDesc: 'All action steps and spray guidelines are strictly grounded in Kerala Agricultural University (KAU) Package of Practices records. The app never uses an LLM to invent dosages.',

    closeBtn: 'Close',
  },
  ml: {
    // Top Bar & Navigation
    networkName: 'കുട്ടനാട് നെല്ല് - താറാവ് മുൻകരുതൽ നെറ്റ്‌വർക്ക്',
    tagline: 'കർഷക പരിശോധന അടിസ്ഥാനമാക്കിയുള്ള കാർഷിക മുന്നറിയിപ്പ് പ്ലാറ്റ്ഫോം',
    liveMap: 'ലൈവ് മാപ്പ്',
    reportIssue: 'വിവരം അറിയിക്കുക',
    verifyQueue: 'പരിശോധന ക്യൂ',
    alertsInbox: 'മുന്നറിയിപ്പുകൾ',
    howItWorks: 'പ്രവർത്തന രീതി',
    signIn: 'പ്രവേശിക്കുക',
    userRoleFarmer: 'കർഷകൻ',
    userRoleOfficer: 'കൃഷി ഓഫീസർ',
    kisanCallCenter: 'കിസാൻ കോൾ സെന്റർ: 1800-180-1551',
    langToggle: 'EN',

    // Telemetry Bar
    activeReports: 'സജീവ റിപ്പോർട്ടുകൾ',
    salineIngressCanals: 'ഉപ്പുവെള്ള തോടുകൾ',
    activeOutbreaks: 'രോഗബാധ ക്ലസ്റ്ററുകൾ',
    rain24h: 'മഴ (24 മണിക്കൂർ)',
    danger: 'അപകടം',
    warning: 'മുന്നറിയിപ്പ്',
    watch: 'നിരീക്ഷണം',
    safe: 'സുരക്ഷിതം',
    reportIncidentBtn: '+ വിവരം നൽകുക',

    // Map & Dropped Pin
    pinHint: 'മാപ്പിൽ എവിടെയെങ്കിലും തൊട്ട് സ്ഥലം അടയാളപ്പെടുത്തി വിവരം നൽകുക',
    droppedPinTitle: 'തിരഞ്ഞെടുത്ത പാടശേഖര സ്ഥലം',
    reportAtPinBtn: 'ഈ സ്ഥലത്തെക്കുറിച്ച് വിവരം നൽകുക',
    clearPinBtn: 'പിൻ മാറ്റുക',
    mapLayers: 'മാപ്പ് ലെയറുകൾ',
    waterwaysLayer: 'കുട്ടനാട് തോടുകൾ',
    topoLayer: 'ടോപ്പോ സ്ട്രീറ്റ്',
    satelliteLayer: 'സാറ്റലൈറ്റ് ചിത്രം',
    legendTitle: 'പരിശോധനാ നിലവാരം',
    unconfirmed: 'സ്ഥിരീകരിക്കാത്തവ (0-1 സ്ഥിരീകരണം)',
    communityConfirmed: 'കർഷകർ സ്ഥിരീകരിച്ചവ (2+ അയൽക്കാർ)',
    officiallyVerified: 'കൃഷിഭവൻ സ്ഥിരീകരിച്ചവ (ഔദ്യോഗികം)',
    salineCanalLegend: 'ഉപ്പുവെള്ള കയറ്റ തോട്',
    demoBannerTitle: 'കുട്ടനാട് ഡെമോ സജീവം:',
    demoBannerDesc: 'കുട്ടനാട് തോടുകളിലെ വെള്ളമൊഴുക്കും കർഷക റിപ്പോർട്ടുകളും ഡെമോക്കായി ക്രമീകരിച്ചിരിക്കുന്നു. മാപ്പിൽ തൊട്ട് പുതിയ റിപ്പോർട്ട് നൽകാം.',

    // Local Trend Panel
    localTrendTitle: 'പ്രാദേശിക പാടശേഖര സ്ഥിതി',
    useMyGps: 'ജി.പി.എസ് ഉപയോഗിക്കുക',
    nearbyReports7d: 'സമീപ റിപ്പോർട്ടുകൾ (7 ദിവസം)',
    prior7dComparison: 'മുൻ ആഴ്ചയുമായുള്ള താരതമ്യം',
    trendGrowing: 'വർദ്ധിക്കുന്ന പ്രവണത',
    trendStable: 'സ്ഥിരതയുള്ള സ്ഥിതി',
    trendWatch: 'സാധാരണ നില',
    nearestCanal: 'അടുത്തുള്ള തോട്',
    nearestSalinity: 'ഉപ്പുരസം',
    recommendedAction: 'അടിയന്തരമായി ചെയ്യേണ്ടത്',
    noNearbyIncidents: 'കഴിഞ്ഞ 7 ദിവസത്തിൽ 3 കിലോമീറ്ററിനുള്ളിൽ അടിയന്തര റിപ്പോർട്ടുകളില്ല.',

    // Report Form
    step1Title: 'ഘട്ടം 1 — എന്താണ് സംഭവിച്ചത്?',
    step1Desc: 'നിങ്ങളുടെ പാടത്തോ തോട്ടിലോ ഉണ്ടായ പ്രധാന പ്രശ്നം തിരഞ്ഞെടുക്കുക',
    step2Title: 'ഘട്ടം 2 — എവിടെയാണ് സ്ഥലം?',
    step2Desc: 'മിനി-മാപ്പിൽ തൊട്ടോ പിൻ വലിച്ചോ കൃത്യമായ സ്ഥലം അടയാളപ്പെടുത്തുക',
    step3Title: 'ഘട്ടം 3 — വിശദാംശങ്ങളും കുറിപ്പും',
    step3Desc: 'അയൽ കർഷകർക്കും ഉദ്യോഗസ്ഥർക്കും നടപടിയെടുക്കാൻ സഹായിക്കുന്ന വിവരങ്ങൾ',

    typeCropDisease: 'വിള രോഗബാധ',
    typeCropDiseaseDesc: 'തവിട്ടു ചാഴി, പോളരോഗം, ഇലകരിച്ചിൽ',
    typeSalinity: 'ഉപ്പുവെള്ള കയറ്റം',
    typeSalinityDesc: 'തോട്ടിൽ ഉപ്പുവെള്ളം 2.0 ppt പരിധിക്ക് മുകളിൽ',
    typeBirdDeaths: 'താറാവ് മരണം',
    typeBirdDeathsDesc: 'പെട്ടെന്നുള്ള പക്ഷി മരണം, പക്ഷിപ്പനി ലക്ഷണങ്ങൾ',
    typeBundSeepage: 'ബണ്ട് ചോർച്ച',
    typeBundSeepageDesc: 'പുറംബണ്ടിലെ കുഴൽച്ചോർച്ച അല്ലെങ്കിൽ വിള്ളൽ',
    typeCropLoss: 'വിളനാശം (AIMS)',
    typeCropLossDesc: '72 മണിക്കൂറിനുള്ളിലെ നഷ്ടപരിഹാര അപേക്ഷ',

    diseaseDropdownLabel: 'കണ്ട രോഗം / കീടബാധ',
    bphOption: 'തവിട്ടു ചാഴി (BPH)',
    sheathBlightOption: 'പോളരോഗം',
    blbOption: 'ബാക്ടീരിയൽ ഇലകരിച്ചിൽ',
    riceBlastOption: 'കുലവാട്ടം / ഇലപ്പുള്ളി',

    salinitySliderLabel: 'ഉപ്പുവെള്ള അളവ് (ppt)',
    pptUnit: 'ppt',
    safeRange: '1.5 ppt-ൽ താഴെ (സുരക്ഷിതം)',
    warningRange: '1.5 - 1.9 ppt (ജാഗ്രത)',
    dangerRange: '2.0+ ppt (ഗുരുതര അപകടം)',

    deadDucksLabel: 'ചത്ത താറാവുകൾ',
    sickDucksLabel: 'രോഗബാധിതമായവ',

    seepageTypeLabel: 'ചോർച്ചാ സ്വഭാവം',
    activePipingOption: 'തീവ്ര കുഴൽച്ചോർച്ച (മണൽച്ചാക്ക് അടിയന്തര ആവശ്യം)',
    surfaceSweatOption: 'പുറംബണ്ടിലെ നനവ്',
    crestCrackOption: 'ബണ്ട് മുകളിലെ വിള്ളൽ',
    waterHeadDiffLabel: 'ജലനിരപ്പ് വ്യത്യാസം',
    feetUnit: 'അടി',

    affectedAcresLabel: 'ബാധിച്ച വിസ്തൃതി (ഏക്കർ)',

    photoEvidenceLabel: 'ഫോട്ടോ തെളിവ്',
    photoPlaceholder: 'ചിത്രത്തിന്റെ ലിങ്ക് അല്ലെങ്കിൽ സാമ്പിൾ ക്ലിക്ക് ചെയ്യുക...',
    useSamplePhoto: 'സാമ്പിൾ ഫോട്ടോ ഉപയോഗിക്കുക',

    fieldNotesLabel: 'പാടത്തെ നിരീക്ഷണ കുറിപ്പ്',
    notesPlaceholder: 'കണ്ട ലക്ഷണങ്ങൾ, ജലനിരപ്പ്, ആവശ്യമായ സഹായം ഇവിടെ രേഖപ്പെടുത്തുക...',
    sarvamVoicePlaceholder: 'ശബ്ദ സന്ദേശം — സർവ്വം AI (അടുത്ത ഘട്ടം)',

    submitReportBtn: 'വിവരം സമർപ്പിക്കുക & നടപടിക്രമം കാണുക',
    submittingBtn: 'രേഖപ്പെടുത്തുന്നു...',

    // Instant Action Card
    actionCardSuccessTitle: 'റിപ്പോർട്ട് രേഖപ്പെടുത്തി തോട്ടിലേക്ക് ബന്ധിപ്പിച്ചു',
    viewPinOnMapBtn: 'മാപ്പിൽ പിൻ കാണുക',
    submitAnotherBtn: 'മറ്റൊരു റിപ്പോർട്ട് നൽകുക',

    // Alerts Inbox
    alertsTitle: 'മുന്നറിയിപ്പ് ഇൻബോക്സ്',
    alertsDesc: 'തോട്ടിലെ ഉപ്പുവെള്ളം, കീടബാധ ക്ലസ്റ്ററുകൾ, കർഷക പരിശോധനാ വിവരങ്ങൾ',
    filterAll: 'എല്ലാ മുന്നറിയിപ്പുകളും',
    filterSalinityClusters: 'ഉപ്പുവെള്ളവും രോഗബാധയും',
    filterVerification: 'സ്ഥിരീകരണ വിവരങ്ങൾ',
    markAllRead: 'എല്ലാം വായിച്ചതായി അടയാളപ്പെടുത്തുക',
    noAlertsFound: 'ഈ വിഭാഗത്തിൽ മുന്നറിയിപ്പുകളില്ല.',
    jumpToLocation: 'മാപ്പിൽ കാണുക',

    // Verify Queue
    verifyQueueTitle: 'കർഷക പരിശോധനാ ക്യൂ',
    verifyQueueDesc: 'അയൽ കർഷകർ വിവരങ്ങൾ പരിശോധിച്ച് ഉറപ്പാക്കുന്നു; കൃഷി ഓഫീസർമാർ ഔദ്യോഗികമായി സാക്ഷ്യപ്പെടുത്തുന്നു.',
    confirmReportBtn: 'ഞാനും സ്ഥിരീകരിക്കുന്നു',
    officiallyVerifyBtn: 'ഔദ്യോഗികമായി സ്ഥിരീകരിക്കുക',
    rejectBtn: 'തള്ളിക്കളയുക',
    confirmationsBadge: 'സ്ഥിരീകരണങ്ങൾ',
    noReportsToVerify: 'നിങ്ങളുടെ പരിധിയിൽ ഇപ്പോൾ സ്ഥിരീകരിക്കാൻ റിപ്പോർട്ടുകളില്ല.',

    // Modals
    howItWorksModalTitle: 'പ്രവർത്തന തത്വം',
    howItWorksPolderTitle: '1. സമുദ്രനിരപ്പിന് താഴെയുള്ള പാടശേഖരങ്ങൾ',
    howItWorksPolderDesc: 'കുട്ടനാട് പാടങ്ങൾ സമുദ്രനിരപ്പിൽ നിന്ന് 1.5 മുതൽ 2.5 മീറ്റർ വരെ താഴെയാണ്. വേമ്പനാട്ട് കായലിൽ നിന്നുള്ള ഉപ്പുവെള്ളം തോടുകളിലൂടെയാണ് ഉള്ളിലേക്ക് കയറുന്നത്. തോടുകളുടെ പരസ്പര ബന്ധം അടിസ്ഥാനമാക്കിയാണ് ആപ്പ് പ്രവർത്തിക്കുന്നത്.',
    howItWorksDbscanTitle: '2. ഡി.ബി.സ്കാൻ (DBSCAN) ക്ലസ്റ്ററിംഗ് (2.0 കി.മീ / 7 ദിവസം)',
    howItWorksDbscanDesc: '7 ദിവസത്തിനുള്ളിൽ 2 കിലോമീറ്റർ പരിധിയിൽ വരുന്ന റിപ്പോർട്ടുകളെ ആൽഗോരിതം സ്വയമേവ ഒരുമിച്ച് ക്ലസ്റ്ററാക്കി മാറ്റുന്നു. ഒറ്റപ്പെട്ട വിവരങ്ങളെ ഒഴിവാക്കി യഥാർത്ഥ പകർച്ചാവ്യാധികളെ കണ്ടെത്തുന്നു.',
    howItWorksTrustTitle: '3. കർഷക കൂട്ടായ്മയും ഉദ്യോഗസ്ഥ പരിശോധനയും',
    howItWorksTrustDesc: 'ഒരു റിപ്പോർട്ടിനെ 2 അയൽ കർഷകർ സ്ഥിരീകരിക്കുമ്പോൾ അത് കമ്മ്യൂണിറ്റി സ്ഥിരീകരിച്ചതായി മാറുന്നു. തുടർന്ന് കൃഷി ഓഫീസർക്ക് ഔദ്യോഗിക സ്ഥിരീകരണം നൽകാം.',
    howItWorksKauTitle: '4. കൃത്യമായ കേരള കാർഷിക സർവകലാശാലാ നിർദ്ദേശങ്ങൾ',
    howItWorksKauDesc: 'എല്ലാ മരുന്ന് പ്രയോഗങ്ങളും കൃഷി സർവകലാശാലയുടെ പാക്കേജ് ഓഫ് പ്രാക്ടീസസ് (KAU PoP) അടിസ്ഥാനമാക്കിയുള്ളതാണ്. കൃത്രിമ ബുദ്ധി ഒരിക്കലും സ്വന്തമായി അളവുകൾ നൽകുന്നില്ല.',

    closeBtn: 'അടയ്ക്കുക',
  }
};
