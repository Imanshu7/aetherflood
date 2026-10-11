/**
 * Global Bilingual Localization Dictionary (English & नेपाली / Nepali)
 * Adheres to UN OCHA & Nepal National Disaster Risk Reduction & Management Authority (NDRRMA / विविप्रप्रा) standards.
 */

export const TRANSLATIONS = {
  en: {
    appName: "AETHERFLOOD",
    appSub: "COPILOT // LIVE",
    nav: {
      dashboard: "Dashboard",
      compare: "Compare",
      overview: "Overview",
      incidents: "Incidents",
      copilot: "Copilot",
      stats: "Stats"
    },
    searchPlaceholder: "Search...",
    account: {
      signIn: "Sign In",
      observer: "Observer",
      signOut: "Sign Out"
    },
    topActions: {
      compareEMSR: "EMSR927",
      limitations: "Limits",
      mapArchitecture: "Sensors"
    },
    kpi: {
      whereHit: "FLOOD",
      whereHitSub: "Track 121",
      whatDamaged: "BUILDINGS",
      whatDamagedSub: "342 Hit • 262 Down",
      roadsSubmerged: "ROADS",
      roadsSubmergedSub: "NH09 Highway Cut",
      bridgesSevered: "BRIDGES",
      bridgesSeveredSub: "4 Cut • 2.4× Detour",
      isolatedPop: "CUT OFF",
      isolatedPopSub: "7,770 Severed",
      hospitals: "CLINICS",
      hospitalsSub: "Trishuli 120 Beds",
      km2: "km²",
      buildings: "hit",
      km: "km",
      crossings: "cut",
      people: "cut off",
      statusCut: "Cut Off"
    },
    layers: {
      title: "GIS Overlays",
      selectAll: "All",
      deselectAll: "None",
      satelliteScene: "Satellite",
      sarInundation: "Flood (14.8 km²)",
      landslideDebris: "Debris Fans",
      riverChannel: "River",
      highway: "NH09 Highway",
      damagedBuildings: "Buildings (342)",
      cutoffSettlements: "Cut-off Towns",
      severedBridges: "Bridges (4 Cut)",
      hospitals: "Clinics",
      bonusPath: "Flow Path"
    },
    basemaps: {
      humanitarian: "Humanitarian",
      satellite: "Satellite",
      topo: "Topo",
      standard: "Streets"
    },
    sensors: {
      optical: "S2 Optical",
      fusion: "Dual Fusion",
      radar: "S1 Radar",
      change: "SAR Diff",
      vector: "Vector"
    },
    copilot: {
      title: "Rescue Copilot",
      subtitle: "Bilingual Grounded Decision Support",
      modeOnline: "Online",
      modeOffline: "Offline",
      onlineBadge: "Online: Sarvam AI",
      offlineBadge: "Offline: Ollama",
      clearChat: "Clear",
      generateSitrep: "SITREP",
      quickPrompts: [
        { label: "Cut-off Towns", query: "Which settlements are completely cut off and why?" },
        { label: "Damage", query: "What was damaged? Show building, bridge, and road statistics." },
        { label: "Hospitals", query: "Can ambulances reach Trishuli District Hospital?" },
        { label: "Helipads", query: "Where are designated flat helicopter landing zones?" }
      ],
      inputPlaceholder: "Ask rescue query...",
      send: "Send",
      auditVerified: "Telemetry Grounding Verified",
      apiKeyLabel: "Sarvam API Key (Optional override):"
    },
    compare: {
      title: "Bi-Temporal Satellite Comparison",
      subtitle: "Orbit Track 121 (12-day pair) & Pre-disaster OSM Baseline",
      beforeLabel: "BASELINE (2026-08-14)",
      afterLabel: "FLOOD EVENT (2026-08-26)",
      sliderHint: "Drag vertical divider or pan map."
    }
  },

  ne: {
    appName: "ऐथर बाढी",
    appSub: "कोपाइलट // प्रत्यक्ष",
    nav: {
      dashboard: "ड्यासबोर्ड",
      compare: "तुलना",
      overview: "अवलोकन",
      incidents: "घटनाहरू",
      copilot: "कोपाइलट",
      stats: "तथ्यांक"
    },
    searchPlaceholder: "खोज्नुहोस्...",
    account: {
      signIn: "लग इन",
      observer: "पर्यवेक्षक",
      signOut: "बाहिरिनुहोस्"
    },
    topActions: {
      compareEMSR: "EMSR927",
      limitations: "सीमाहरू",
      mapArchitecture: "सेन्सर"
    },
    kpi: {
      whereHit: "बाढी",
      whereHitSub: "ट्रयाक १२१",
      whatDamaged: "घरहरू",
      whatDamagedSub: "३४२ प्रभावित • २६२ भत्किएका",
      roadsSubmerged: "सडक",
      roadsSubmergedSub: "NH09 पासाङ ल्हामु",
      bridgesSevered: "पुलहरू",
      bridgesSeveredSub: "४ बगाएका • २.४× घुमाउरो",
      isolatedPop: "विच्छेदित",
      isolatedPopSub: "७,७७० विच्छेदित",
      hospitals: "अस्पताल",
      hospitalsSub: "त्रिशूली १२० शय्या",
      km2: "वर्ग किमी",
      buildings: "घरहरू",
      km: "किमी",
      crossings: "पुलहरू",
      people: "नागरिक",
      statusCut: "विच्छेदित"
    },
    layers: {
      title: "GIS तहहरू",
      selectAll: "सबै",
      deselectAll: "हटाउनु",
      satelliteScene: "उपग्रह दृश्य",
      sarInundation: "बाढी (१४.८ km²)",
      landslideDebris: "पहिरो लेदो",
      riverChannel: "नदी बहाव",
      highway: "NH09 राजमार्ग",
      damagedBuildings: "घरहरू (३४२)",
      cutoffSettlements: "बस्तीहरू (४)",
      severedBridges: "पुलहरू (४)",
      hospitals: "अस्पताल",
      bonusPath: "बहाव रेखा"
    },
    basemaps: {
      humanitarian: "मानवीय नक्सा (HOT)",
      satellite: "उपग्रह तस्बिर",
      topo: "धरातलीय उचाइ",
      standard: "सडक नक्सा"
    },
    sensors: {
      optical: "S2 अप्टिकल",
      fusion: "दोहोरो फ्युजन",
      radar: "S1 राडार",
      change: "SAR परिवर्तन",
      vector: "भेक्टर"
    },
    copilot: {
      title: "उद्धार बुद्धिमत्ता कोपाइलट",
      subtitle: "द्विभाषी प्रामाणिक विपद् सहायता",
      modeOnline: "अनलाइन (सर्वम AI)",
      modeOffline: "अफलाइन (ओलामा स्थानीय)",
      onlineBadge: "अनलाइन: सर्वम AI API",
      offlineBadge: "अफलाइन: ओलामा स्थानीय",
      clearChat: "च्याट खाली गर्नुहोस्",
      generateSitrep: "विपद् SITREP #०१",
      quickPrompts: [
        { label: "सम्पर्कविहीन बस्तीहरू", query: "कुन कुन बस्तीहरू सम्पर्कविहीन छन् र बाटो अवस्था के छ?" },
        { label: "भौतिक क्षति विवरण", query: "कति घर, सडक र पुलहरू क्षतिग्रस्त भए?" },
        { label: "अस्पताल पहुँच अवस्था", query: "त्रिशूली अस्पताल पुग्ने बाटो खुला छ कि छैन?" },
        { label: "हेलिकप्टर अवतरण स्थल", query: "हेलिकप्टर अवतरणका लागि सुरक्षित स्थान (LZ) कहाँ छ?" }
      ],
      inputPlaceholder: "उद्धार सम्बन्धी प्रश्न सोध्नुहोस् (जस्तै: कुन बाटो बन्द छ, अस्पताल)...",
      send: "पठाउनुहोस्",
      auditVerified: "भौगोलिक टेलिमेट्री प्रमाणित",
      apiKeyLabel: "सर्वम API Key (ऐच्छिक):"
    },
    compare: {
      title: "द्वि-सामयिक उपग्रह तथा पूर्वाधार तुलना",
      subtitle: "समान कक्षीय ट्रयाक १२१ (१२-दिने अन्तराल) र घटनापूर्वको खुला सडक नक्सा आधाररेखा",
      beforeLabel: "घटनापूर्व आधाररेखा (२०२६-०८-१४)",
      afterLabel: "घटनापश्चात बाढी तथा लेदो (२०२६-०८-२६)",
      sliderHint: "सडक विच्छेद र बाढीको प्रभाव हेर्न ठाडो रेखालाई दायाँ-बायाँ सार्नुहोस्।"
    }
  }
};
