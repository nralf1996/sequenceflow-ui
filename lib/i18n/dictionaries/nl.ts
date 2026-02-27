import type { Dictionary } from "./en";

export const nl: Dictionary = {
  common: {
    save: "Configuratie opslaan",
    saving: "Opslaan...",
    saved: "Opgeslagen ✓",
    saveFailed: "Opslaan mislukt",
    upload: "Uploaden",
    uploading: "Uploaden…",
    cancel: "Annuleren",
    delete: "Verwijderen",
    reindex: "Herindexeren",
    loading: "Laden…",
    generating: "Genereren...",
    yesAllow: "Ja, toestaan",
    noDocuments: "Nog geen documenten. Upload er een hierboven.",
    titleOptional: "Titel (optioneel)",
    admin: "beheerder",
  },

  sidebar: {
    dashboard: "Dashboard",
    knowledge: "Kennisbank",
    agentConsole: "Agent Console",
  },

  dashboard: {
    title: "Dashboard",
    subtitle: "Overzicht van uw SupportFlow OS.",
    documents: "Documenten",
    totalCharacters: "Totaal tekens",
    aiConfidence: "AI-betrouwbaarheid",
    avgResponseTime: "Gem. responstijd",
    systemStatus: "Systeemstatus",
    knowledgeEngine: "Kennismotor",
    pdfExtraction: "PDF-extractie",
    vectorIndex: "Vectorindex",
    // Status value labels
    active: "Actief",
    operational: "Operationeel",
    unavailable: "Niet beschikbaar",
    connected: "Verbonden",
    notConnected: "Niet verbonden",
  },

  knowledge: {
    title: "Kennisbank",
    subtitle:
      "Beheer documenten voor de supportagent. Beleid- en trainingsdocumenten zijn klantspecifiek; platformdocumenten zijn globaal.",
    subtitleClient:
      "Upload beleids- en trainingsdocumenten voor uw werkruimte.",
    tabPolicy: "Beleid",
    tabPolicyDesc: "Retourbeleid, garantieregels, verzendvoorwaarden.",
    tabTraining: "Training",
    tabTrainingDesc: "Q&A-paren en scripts voor agenttraining.",
    tabPlatform: "Platform",
    tabPlatformDesc:
      "Platformbrede documenten voor alle klanten (alleen beheerder).",
    status: {
      ready: "GEREED",
      processing: "VERWERKEN",
      pending: "WACHTEND",
      error: "FOUT",
    },
    dropzonePlaceholder: "Selecteer of sleep een bestand",
    selectFile: "Bestand selecteren",
    changeFile: "Bestand wijzigen",
  },

  agentConsole: {
    title: "Agent Console",
    subtitle:
      "Configureer de supportagent en genereer een live AI-voorbeeld.",
    enableEmpathy: "Empathie inschakelen",
    allowDiscount: "Korting toestaan",
    maxDiscount: "Geef maximale korting op (€)",
    signature: "Handtekening",
    generatePreview: "Voorbeeld genereren",
    aiPreview: "AI Voorbeeld",
    routing: "Routering",
    confidence: "Betrouwbaarheid",
    subject: "Onderwerp",
    body: "Bericht",
    emptyPreview:
      'Klik op "Voorbeeld genereren" voor een live AI-reactie op basis van de huidige configuratie.',
    modalTitle: "Kortingen toestaan?",
    modalText:
      "Weet u zeker dat u de AI wilt toestaan kortingen aan klanten aan te bieden?",
  },
};
