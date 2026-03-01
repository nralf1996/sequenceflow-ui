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
    customerQuestions: "Klantvragen",
    aiDraftsGenerated: "AI-concepten gegenereerd",
    aiAcceptanceRate: "AI-acceptatiepercentage",
    avgResponseTime: "Gem. responstijd",
    noQuestionsYet: "Nog geen vragen",
    noPreviousData: "Geen eerdere data",
    vsLastWeek: "vs afgelopen 7 dagen",
    workloadTitle: "AI-werklast bespaard",
    workloadSubtext: "Gebaseerd op geaccepteerde concepten",
    workloadSavedThisMonth: "bespaard deze maand",
    noActivityThisMonth: "Geen activiteit deze maand",
    chartTitle: "Vragen over tijd",
    activityTitle: "Recente activiteit",
    noActivityFeed: "Nog geen activiteit",
    noChartActivity: "Nog geen supportactiviteit",
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
