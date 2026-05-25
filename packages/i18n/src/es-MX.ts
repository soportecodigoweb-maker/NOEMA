/**
 * Textos de NOEMA en español de México.
 *
 * Reglas (BIBLIA §9 — Voz y copy):
 *   - Al terapeuta: 2da persona formal (colega, profesional).
 *   - Al paciente: 2da persona cercana (tú), sin paternalismo.
 *   - Claro antes que ingenioso. Cálido sin ser empalagoso.
 *   - Nunca clínico, nunca terapéutico.
 */

export const esMX = {
  // ===========================================================================
  // Común
  // ===========================================================================
  common: {
    appName: 'NOEMA',
    tagline: 'Tu proceso continúa acompañado.',
    cancel: 'Cancelar',
    save: 'Guardar',
    continue: 'Continuar',
    close: 'Cerrar',
    delete: 'Eliminar',
    edit: 'Editar',
    loading: 'Cargando…',
    errorGeneric: 'Algo no funcionó. Inténtalo en un momento.',
    emptyDefault: 'Aún no hay nada que mostrar.',
  },

  // ===========================================================================
  // Auth
  // ===========================================================================
  auth: {
    welcomeTitle: 'Bienvenida a NOEMA',
    welcomeSubtitle: 'Tu proceso continúa acompañado.',
    signInTitle: 'Inicia sesión',
    signUpTitle: 'Crea tu cuenta',
    emailLabel: 'Correo',
    passwordLabel: 'Contraseña',
    signInButton: 'Iniciar sesión',
    signUpButton: 'Crear cuenta',
    forgotPassword: '¿Olvidaste tu contraseña?',
    haveAccount: '¿Ya tienes cuenta? Inicia sesión',
    noAccount: '¿Aún no tienes cuenta? Crea una',
    selectRole: '¿Cómo vas a usar NOEMA?',
    roleTerapeuta: 'Soy terapeuta',
    rolePaciente: 'Soy paciente con terapeuta',
    roleExplora: 'Solo quiero explorar',
  },

  // ===========================================================================
  // App paciente
  // ===========================================================================
  paciente: {
    greetingMorning: 'Buenos días',
    greetingAfternoon: 'Buenas tardes',
    greetingEvening: 'Buenas noches',
    homeQuestion: '¿Cómo te sientes hoy?',
    todaysRegister: 'Registro del día',
    progress: '{done}/{total} completado',
    nextSession: 'Próxima sesión',
    seeDetails: 'Ver detalles',

    // Registro emocional
    registerStepEmotion: '¿Cómo te sientes hoy?',
    registerStepEmotionHelp: 'Selecciona las emociones que mejor te describen.',
    registerStepIntensity: '¿Qué tan fuerte lo sientes?',
    registerStepContext: '¿Qué pasó hoy?',
    registerStepContextHelp: 'Puedes escribir lo que quieras sobre tu día.',
    registerStepNeeds: '¿Qué necesito ahora?',
    registerStepNeedsHelp: 'Elige lo que podría ayudarte.',
    needsRest: 'Descansar',
    needsTalk: 'Hablar con alguien',
    needsTime: 'Tiempo para mí',
    needsOther: 'Otra cosa',
    registerSave: 'Guardar registro',
    registerSaved: 'Registro guardado.',

    // Análisis
    analysisTitle: 'Tu bienestar',
    analysisSubtitle: 'Así han estado tus emociones esta semana.',
    mostFrequent: 'Emociones más frecuentes',

    // Recursos
    resourcesTitle: 'Para tu bienestar',
    resourcesSubtitle: 'Herramientas y contenidos que pueden acompañarte.',

    // Privacidad
    privacyPrivate: 'Privado',
    privacyShared: 'Compartido con mi terapeuta',
    privacyForSession: 'Marcar para revisar en sesión',
  },

  // ===========================================================================
  // Panel terapeuta
  // ===========================================================================
  terapeuta: {
    greeting: 'Hola, {name}',
    dashboardSubtitle: 'Aquí tienes un resumen de tu consulta',
    activePatients: 'Pacientes activos',
    weekSessions: 'Sesiones esta semana',
    completedRegistries: 'Registros completados',
    importantAlerts: 'Alertas importantes',
    recentActivity: 'Actividad reciente',
    groupWellbeing: 'Resumen de bienestar grupal',
    requiresAttention: 'Requieren tu atención',
    newSession: 'Nueva sesión',
    sendMessage: 'Enviar mensaje',

    // Ficha de paciente
    patientOverview: 'Panorama general',
    lastDays: 'Últimos {days} días',
    emotionalWellbeing: 'Bienestar emocional',
    averageAnxiety: 'Ansiedad promedio',
    registryAdherence: 'Adherencia a registros',
    mainTopics: 'Temas principales',
    detectedInRegistries: 'Detectados en sus registros',
    lastRegister: 'Último registro',
    clinicalWarnings: 'Advertencias clínicas',
    seeFullRegister: 'Ver registro completo',
  },

  // ===========================================================================
  // Módulo de crisis (CRÍTICO — BIBLIA §11)
  // ===========================================================================
  crisis: {
    triggerButton: 'Necesito ayuda ahora',
    title: '¿Estás en riesgo o necesitas ayuda inmediata?',
    disclaimer:
      'Esta app no sustituye servicios de emergencia ni atención profesional urgente.',
    body: 'Si estás en peligro, llama a emergencias o contacta a una persona de confianza ahora.',
    callEmergency: 'Llamar a emergencias',
    callTrustedContact: 'Contactar a mi persona de confianza',
    notifyTherapist: 'Avisar a mi terapeuta',
    seeResources: 'Ver recursos de ayuda',
    registerFeelings: 'Registrar lo que estoy sintiendo',
    selfHarmReminder:
      'Si sientes que puedes hacerte daño o hacerle daño a alguien, llama a emergencias ahora.',
  },

  // ===========================================================================
  // Disclaimers de IA (CRÍTICO — BIBLIA §10)
  // ===========================================================================
  aiDisclaimer: {
    short: 'Información operativa generada automáticamente.',
    full:
      'Esta es información operativa generada automáticamente. No constituye diagnóstico, tratamiento ni interpretación clínica. Cualquier decisión profesional corresponde a tu terapeuta.',
  },
} as const;

export type Locale = typeof esMX;
