import type { RecommendationProfile } from '../types';

// Seeded verbatim from Samu's real profile (Salesforce dev on a senior track,
// gym PPL hypertrophy + cut, Sanderson/Star Wars/stoicism hobbies). This is
// the out-of-the-box experience — fully editable afterward via "Mi perfil de
// recomendaciones".
export function defaultRecommendationProfile(): RecommendationProfile {
  return {
    profession: 'Desarrollador Salesforce (rumbo a Senior)',
    experienceLevel: 'mid',
    currentSkills: ['Apex', 'Lightning Web Components', 'JavaScript', 'Integraciones', 'SOQL'],
    skillsToLearn: ['Arquitectura de soluciones', 'Clean Code', 'Patrones de diseño', 'SQL avanzado', 'Data Cloud'],
    desiredCertifications: [
      'Salesforce Agentforce Specialist',
      'Salesforce Data Cloud Consultant',
      'Platform App Builder',
      'Platform Developer II',
      'JavaScript Developer I',
      'Tableau',
    ],
    goals: [
      { id: 'goal-senior-salesforce', label: 'Alcanzar nivel Senior como desarrollador Salesforce' },
      { id: 'goal-certs', label: 'Certificarme en Agentforce y Data Cloud' },
      { id: 'goal-sql', label: 'Dominar SQL, bases de datos y modelado de datos' },
      { id: 'goal-english', label: 'Mejorar mi inglés técnico hasta B1+ y seguir avanzando' },
      { id: 'goal-vshape', label: 'Ganar masa muscular y lograr una mejor forma en V' },
      { id: 'goal-lean', label: 'Mantener una definición saludable sin dietas extremas' },
      { id: 'goal-reading', label: 'Leer más fantasía/ciencia ficción y no ficción aplicable' },
      { id: 'goal-stoicism', label: 'Aplicar estoicismo y pensamiento crítico a decisiones diarias' },
      { id: 'goal-projects', label: 'Construir proyectos personales útiles con IA' },
      { id: 'goal-discipline', label: 'Sostener hábitos y disciplina sin sentirme saturado' },
    ],
    primaryGoalId: 'goal-senior-salesforce',
    secondaryGoalIds: ['goal-certs', 'goal-vshape', 'goal-discipline'],
    hobbies: ['Videojuegos RPG', 'Narrativa de fantasía y ciencia ficción', 'Star Wars', 'Análisis de historias'],
    favoriteGenres: ['Fantasía épica', 'Ciencia ficción', 'Space opera'],
    favoriteAuthors: ['Brandon Sanderson', 'Robert Greene', 'Ryan Holiday'],
    trainingType: 'Push / Pull / Legs — fuerza e hipertrofia',
    physicalGoals: ['Espalda y hombros más anchos', 'Pecho y brazos', 'Forma en V', 'Reducir grasa corporal'],
    dietaryRestrictions: [],
    budget: 'pago-ocasional',
    languages: ['es', 'en'],
    englishLevel: 'B1',
    schedule: {
      workStart: '08:00',
      workEnd: '17:00',
      gymStart: '17:30',
      gymEnd: '19:00',
      weekdayFreeMinutes: 45,
      weekendFreeMinutes: 180,
    },
    preferredFormats: ['youtube', 'book', 'course', 'podcast'],
    favoritePlatforms: ['YouTube', 'Trailhead', 'Spotify'],
    excludedTopics: ['Dietas extremas', 'Suplementos milagro'],
    recommendationIntensity: 'medio',
    maxWeeklyRecommendations: 8,
    categoryWeights: {
      'desarrollo-profesional': 35,
      salud: 20,
      ingles: 15,
      'habitos-crecimiento': 15,
      'hobbies-entretenimiento': 10,
      exploratorio: 5,
    },
  };
}
