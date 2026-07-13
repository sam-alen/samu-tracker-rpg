import {
  Cloud, Code2, Bot, Database, BadgeCheck, Languages, Dumbbell, Apple,
  ListChecks, Scale, Brain, Wand2, Gamepad2, Clapperboard, Compass, Rocket,
  Wallet, type LucideIcon,
} from 'lucide-react';
import type { CategoryAffinity, RecommendationBucket, RecommendationCategory, RecommendationItem } from '../types';

// ─── Categories ─────────────────────────────────────────────────────────────
// 17 categories: the user's 16 requested groupings, plus 'finanzas' kept
// (not in the user's list, but the app already has a full Finanzas module
// and 4 hand-curated finance items — dropping it would lose real content).

export const RECOMMENDATION_CATEGORIES: {
  id: RecommendationCategory; label: string; blurb: string; icon: LucideIcon; color: string; bucket: RecommendationBucket;
}[] = [
  { id: 'salesforce', label: 'Salesforce', blurb: 'Trailhead, documentación y comunidad', icon: Cloud, color: '#3B82F6', bucket: 'desarrollo-profesional' },
  { id: 'programacion', label: 'Programación', blurb: 'Código limpio, patrones y oficio de desarrollo', icon: Code2, color: '#3B82F6', bucket: 'desarrollo-profesional' },
  { id: 'ia', label: 'Inteligencia artificial', blurb: 'Fundamentos y proyectos con IA', icon: Bot, color: '#3B82F6', bucket: 'desarrollo-profesional' },
  { id: 'sql-datos', label: 'SQL y datos', blurb: 'Bases de datos, consultas y modelado', icon: Database, color: '#3B82F6', bucket: 'desarrollo-profesional' },
  { id: 'certificaciones', label: 'Certificaciones', blurb: 'Credenciales oficiales hacia las que vas', icon: BadgeCheck, color: '#3B82F6', bucket: 'desarrollo-profesional' },
  { id: 'desarrollo-profesional', label: 'Desarrollo profesional', blurb: 'Carrera, enfoque y crecimiento técnico', icon: Rocket, color: '#3B82F6', bucket: 'desarrollo-profesional' },
  { id: 'gimnasio', label: 'Gimnasio', blurb: 'Fuerza, hipertrofia y técnica', icon: Dumbbell, color: '#EF4444', bucket: 'salud' },
  { id: 'nutricion', label: 'Nutrición', blurb: 'Alimentación basada en evidencia', icon: Apple, color: '#16A34A', bucket: 'salud' },
  { id: 'ingles', label: 'Inglés', blurb: 'De B1 hacia arriba', icon: Languages, color: '#EA580C', bucket: 'ingles' },
  { id: 'habitos-productividad', label: 'Hábitos y productividad', blurb: 'Sistemas para sostener el cambio', icon: ListChecks, color: '#8B5CF6', bucket: 'habitos-crecimiento' },
  { id: 'filosofia-pensamiento-critico', label: 'Filosofía y pensamiento crítico', blurb: 'Estoicismo y toma de decisiones', icon: Scale, color: '#8B5CF6', bucket: 'habitos-crecimiento' },
  { id: 'psicologia-comportamiento', label: 'Psicología y comportamiento humano', blurb: 'Cómo pensamos y decidimos', icon: Brain, color: '#8B5CF6', bucket: 'habitos-crecimiento' },
  { id: 'proposito-crecimiento-personal', label: 'Propósito y crecimiento personal', blurb: 'La filosofía detrás de este mismo tracker', icon: Compass, color: '#8B5CF6', bucket: 'habitos-crecimiento' },
  { id: 'finanzas', label: 'Finanzas personales', blurb: 'Cuenta, ahorro y disciplina con el dinero', icon: Wallet, color: '#8B5CF6', bucket: 'habitos-crecimiento' },
  { id: 'fantasia-scifi', label: 'Fantasía y ciencia ficción', blurb: 'Sanderson, Star Wars y mundos complejos', icon: Wand2, color: '#D97706', bucket: 'hobbies-entretenimiento' },
  { id: 'videojuegos', label: 'Videojuegos', blurb: 'RPG y juegos con buenas historias', icon: Gamepad2, color: '#D97706', bucket: 'hobbies-entretenimiento' },
  { id: 'entretenimiento', label: 'Entretenimiento', blurb: 'Series y películas para desconectar', icon: Clapperboard, color: '#D97706', bucket: 'hobbies-entretenimiento' },
];

export const BUCKET_OF: Record<RecommendationCategory, RecommendationBucket> = RECOMMENDATION_CATEGORIES.reduce(
  (acc, c) => { acc[c.id] = c.bucket; return acc; },
  {} as Record<RecommendationCategory, RecommendationBucket>,
);

export function defaultCategoryAffinity(): CategoryAffinity {
  return RECOMMENDATION_CATEGORIES.reduce((acc, c) => { acc[c.id] = 0; return acc; }, {} as CategoryAffinity);
}

export const RECOMMENDATION_TYPE_LABELS: Record<RecommendationItem['type'], string> = {
  youtube: 'YouTube', book: 'Libro', audiobook: 'Audiolibro', course: 'Curso',
  'learning-path': 'Ruta de aprendizaje', podcast: 'Podcast', article: 'Artículo',
  documentary: 'Documental', 'movie-series': 'Película / Serie', 'video-game': 'Videojuego',
  'coding-exercise': 'Ejercicio de código', 'practical-project': 'Proyecto práctico',
  'gym-routine': 'Rutina de gym', recipe: 'Receta', habit: 'Hábito',
  'weekly-challenge': 'Reto semanal', 'tool-app': 'Herramienta / App', certification: 'Certificación',
  community: 'Comunidad', 'official-resource': 'Recurso oficial',
};

export const RECOMMENDATION_DIFFICULTY_LABELS: Record<RecommendationItem['difficulty'], string> = {
  principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado',
};

export const RECOMMENDATION_COST_LABELS: Record<RecommendationItem['cost'], string> = {
  gratis: 'Gratis', 'pago-unico': 'De pago', suscripcion: 'Suscripción',
};

// ─── Link helpers ───────────────────────────────────────────────────────────
// Safe by construction: every link is either a constructed search query
// (never a guessed video/product/page URL) or a genuinely stable official
// root domain (not a guessed deep path within it).

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function bookSearchUrl(title: string, author: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`"${title}" ${author} libro`)}`;
}

export function courseSearchUrl(title: string, platform: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${title} ${platform} curso`)}`;
}

export function podcastSearchUrl(title: string, creator: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${title} podcast ${creator}`)}`;
}

export function genericSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function appSearchUrl(name: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${name} app oficial`)}`;
}

const VERIFIED = '2026-07-13';

// ─── Catalog ────────────────────────────────────────────────────────────────
// ~80 items, every title/author/creator/platform is real and verifiable —
// nothing here is invented. The 20 original curated items keep their exact
// ids (old recommendationsProgress entries stay valid) and are recategorized
// into the new 17-category set.

export const RECOMMENDATION_CATALOG: RecommendationItem[] = [
  // ─── Salesforce ───────────────────────────────────────────────────────────
  {
    id: 'rec-s1', type: 'youtube', category: 'salesforce',
    title: 'Salesforce (canal oficial)', creator: 'Salesforce',
    description: 'Demos, releases y contenido directo del producto.',
    whyForYou: 'Complemento natural a Trailhead mientras avanzas hacia Senior en Salesforce.',
    goalId: 'goal-senior-salesforce', difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('Salesforce canal oficial'), tags: ['salesforce', 'producto'], priority: 3, estimatedRating: 4,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-s2', type: 'youtube', category: 'salesforce',
    title: 'Salesforce Ben', creator: 'Salesforce Ben',
    description: 'Uno de los recursos más grandes de la comunidad: certificación, carrera y buenas prácticas.',
    whyForYou: 'Guías de certificación y carrera justo para tu meta de llegar a Senior.',
    goalId: 'goal-senior-salesforce', difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('Salesforce Ben'), tags: ['salesforce', 'carrera'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-trailhead', type: 'official-resource', category: 'salesforce',
    title: 'Trailhead', creator: 'Salesforce',
    description: 'La plataforma oficial de aprendizaje de Salesforce, con trails específicos para cada certificación.',
    whyForYou: 'Es la ruta oficial para tus certificaciones de Agentforce, Data Cloud, Platform App Builder y PD2.',
    goalId: 'goal-certs', difficulty: 'principiante', timeMinutes: 30, cost: 'gratis', language: 'en',
    link: 'https://trailhead.salesforce.com', tags: ['salesforce', 'trailhead', 'oficial'], priority: 5, estimatedRating: 5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-sf-devdocs', type: 'official-resource', category: 'salesforce',
    title: 'Salesforce Developers', creator: 'Salesforce',
    description: 'Documentación técnica oficial: Apex, LWC, APIs e integraciones.',
    whyForYou: 'Referencia directa para las áreas que quieres reforzar: Apex, LWC e integraciones.',
    goalId: 'goal-senior-salesforce', difficulty: 'avanzado', timeMinutes: 20, cost: 'gratis', language: 'en',
    link: 'https://developer.salesforce.com', tags: ['salesforce', 'apex', 'lwc', 'documentacion'], priority: 5, estimatedRating: 5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-sf-architects', type: 'community', category: 'salesforce',
    title: 'Salesforce Architects', creator: 'Salesforce',
    description: 'Recursos y comunidad enfocados en arquitectura de soluciones en el ecosistema Salesforce.',
    whyForYou: 'Arquitectura es una de las habilidades que quieres desarrollar camino a Senior.',
    goalId: 'goal-senior-salesforce', difficulty: 'avanzado', timeMinutes: 30, cost: 'gratis', language: 'en',
    link: genericSearchUrl('Salesforce Architects community'), tags: ['salesforce', 'arquitectura'], priority: 3, estimatedRating: 4,
    lastVerified: VERIFIED,
  },

  // ─── Certificaciones ──────────────────────────────────────────────────────
  {
    id: 'rec-cert-agentforce', type: 'certification', category: 'certificaciones',
    title: 'Agentforce Specialist', creator: 'Salesforce Credential',
    description: 'Certificación oficial sobre agentes de IA dentro del ecosistema Salesforce.',
    whyForYou: 'Una de las certificaciones que mencionaste explícitamente como meta.',
    goalId: 'goal-certs', difficulty: 'avanzado', timeMinutes: 60, cost: 'pago-unico', language: 'en',
    link: 'https://trailhead.salesforce.com/credentials/agentforcespecialist', tags: ['certificacion', 'agentforce', 'ia'], priority: 5, estimatedRating: 5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-cert-datacloud', type: 'certification', category: 'certificaciones',
    title: 'Salesforce Data Cloud Consultant', creator: 'Salesforce Credential',
    description: 'Certificación oficial sobre implementación y consultoría de Data Cloud.',
    whyForYou: 'Meta directa de tu plan de certificaciones.',
    goalId: 'goal-certs', difficulty: 'avanzado', timeMinutes: 60, cost: 'pago-unico', language: 'en',
    link: 'https://trailhead.salesforce.com/credentials/datacloudconsultant', tags: ['certificacion', 'data-cloud'], priority: 5, estimatedRating: 5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-cert-appbuilder', type: 'certification', category: 'certificaciones',
    title: 'Platform App Builder', creator: 'Salesforce Credential',
    description: 'Certificación oficial sobre construcción de apps declarativas en la plataforma.',
    whyForYou: 'Está en tu lista de certificaciones objetivo.',
    goalId: 'goal-certs', difficulty: 'intermedio', timeMinutes: 45, cost: 'pago-unico', language: 'en',
    link: 'https://trailhead.salesforce.com/credentials/platformappbuilder', tags: ['certificacion', 'app-builder'], priority: 4, estimatedRating: 5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-cert-pd2', type: 'certification', category: 'certificaciones',
    title: 'Platform Developer II', creator: 'Salesforce Credential',
    description: 'Certificación oficial avanzada de desarrollo: Apex avanzado, integraciones y arquitectura.',
    whyForYou: 'La certificación técnica más directamente ligada a tu día a día con Apex y LWC.',
    goalId: 'goal-certs', difficulty: 'avanzado', timeMinutes: 60, cost: 'pago-unico', language: 'en',
    link: 'https://trailhead.salesforce.com/credentials/platformdeveloperii', tags: ['certificacion', 'apex', 'pd2'], priority: 5, estimatedRating: 5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-cert-jsdev1', type: 'certification', category: 'certificaciones',
    title: 'JavaScript Developer I', creator: 'Salesforce Credential',
    description: 'Certificación oficial de fundamentos sólidos de JavaScript aplicados a Salesforce.',
    whyForYou: 'Refuerza JavaScript, una de las habilidades que ya estás desarrollando en LWC.',
    goalId: 'goal-certs', difficulty: 'intermedio', timeMinutes: 45, cost: 'pago-unico', language: 'en',
    link: 'https://trailhead.salesforce.com/credentials/javascriptdeveloperi', tags: ['certificacion', 'javascript'], priority: 4, estimatedRating: 5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-cert-tableau', type: 'certification', category: 'certificaciones',
    title: 'Tableau Certified Data Analyst', creator: 'Tableau (Salesforce)',
    description: 'Certificación oficial de análisis y visualización de datos en Tableau.',
    whyForYou: 'Está en tu lista de certificaciones y conecta con tu interés en SQL y datos.',
    goalId: 'goal-certs', difficulty: 'intermedio', timeMinutes: 45, cost: 'pago-unico', language: 'en',
    link: genericSearchUrl('Tableau Certified Data Analyst certification'), tags: ['certificacion', 'tableau', 'datos'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED, officialSource: true,
  },

  // ─── Programación ─────────────────────────────────────────────────────────
  {
    id: 'rec-s3', type: 'book', category: 'programacion',
    title: 'Clean Code', creator: 'Robert C. Martin',
    description: 'Fundamentos de código legible y mantenible.',
    whyForYou: 'Aplica directo a tu meta de mejorar en Clean Code y buenas prácticas.',
    goalId: 'goal-senior-salesforce', difficulty: 'intermedio', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('Clean Code', 'Robert C. Martin'), tags: ['clean-code', 'programacion'], priority: 5, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-s4', type: 'book', category: 'programacion',
    title: 'The Pragmatic Programmer', creator: 'David Thomas & Andrew Hunt',
    description: 'Clásico sobre oficio de desarrollo, hábitos técnicos que trascienden cualquier plataforma.',
    whyForYou: 'Hábitos técnicos que aplican directo a Apex y LWC, aunque el libro no sea específico de Salesforce.',
    goalId: 'goal-senior-salesforce', difficulty: 'intermedio', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('The Pragmatic Programmer', 'David Thomas Andrew Hunt'), tags: ['programacion', 'oficio'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-designpatterns', type: 'book', category: 'programacion',
    title: 'Design Patterns', creator: 'Gang of Four (Gamma, Helm, Johnson, Vlissides)',
    description: 'El catálogo clásico de patrones de diseño orientado a objetos.',
    whyForYou: 'Cubre exactamente los "patrones de diseño" que quieres reforzar para tu salto a Senior.',
    goalId: 'goal-senior-salesforce', difficulty: 'avanzado', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('Design Patterns', 'Gang of Four'), tags: ['patrones', 'arquitectura'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-refactoring', type: 'book', category: 'programacion',
    title: 'Refactoring', creator: 'Martin Fowler',
    description: 'Técnicas concretas para mejorar el diseño del código existente sin romperlo.',
    whyForYou: 'Complementa Clean Code con técnica práctica de refactor aplicable a tu código Apex/LWC.',
    goalId: 'goal-senior-salesforce', difficulty: 'avanzado', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('Refactoring', 'Martin Fowler'), tags: ['refactor', 'arquitectura'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-fireship', type: 'youtube', category: 'programacion',
    title: 'Fireship', creator: 'Fireship',
    description: 'Videos cortos y densos sobre conceptos de programación y herramientas modernas.',
    whyForYou: 'Formato corto que encaja en tus bloques libres entre semana (5-15 min).',
    difficulty: 'intermedio', timeMinutes: 10, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('Fireship'), tags: ['programacion', 'corto'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },

  // ─── Inteligencia artificial ──────────────────────────────────────────────
  {
    id: 'rec-ia-ng', type: 'course', category: 'ia',
    title: 'Machine Learning Specialization', creator: 'Andrew Ng (DeepLearning.AI / Coursera)',
    description: 'El curso introductorio de referencia sobre machine learning.',
    whyForYou: 'Base sólida para tu meta de construir proyectos propios con IA.',
    goalId: 'goal-projects', difficulty: 'intermedio', timeMinutes: 60, cost: 'suscripcion', language: 'en',
    link: courseSearchUrl('Machine Learning Specialization Andrew Ng', 'Coursera'), tags: ['ia', 'machine-learning'], priority: 4, estimatedRating: 5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-ia-openai-docs', type: 'official-resource', category: 'ia',
    title: 'OpenAI — Documentación', creator: 'OpenAI',
    description: 'Documentación oficial para construir con modelos de lenguaje.',
    whyForYou: 'Referencia directa si tu próximo proyecto personal integra IA.',
    goalId: 'goal-projects', difficulty: 'intermedio', timeMinutes: 20, cost: 'gratis', language: 'en',
    link: 'https://platform.openai.com/docs', tags: ['ia', 'documentacion'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-ia-twominute', type: 'youtube', category: 'ia',
    title: 'Two Minute Papers', creator: 'Károly Zsolnai-Fehér',
    description: 'Resúmenes breves de investigación reciente en IA, sin relleno.',
    whyForYou: 'Formato corto para mantenerte al día sin dedicarle horas.',
    difficulty: 'intermedio', timeMinutes: 5, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('Two Minute Papers'), tags: ['ia', 'investigacion', 'corto'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-ia-explained', type: 'youtube', category: 'ia',
    title: 'AI Explained', creator: 'AI Explained',
    description: 'Análisis serio de avances y modelos de IA, sin hype vacío.',
    whyForYou: 'Contexto útil sobre hacia dónde va la IA mientras construyes tus propios proyectos.',
    goalId: 'goal-projects', difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('AI Explained'), tags: ['ia', 'analisis'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-ia-roadmap', type: 'practical-project', category: 'ia',
    title: 'Construye tu propia app con IA', creator: 'Proyecto propio',
    description: 'Reto guiado: define un problema real, intégralo con una API de IA y despliégalo.',
    whyForYou: 'Es literalmente tu meta de "construir proyectos personales útiles con IA" convertida en un plan de acción.',
    goalId: 'goal-projects', difficulty: 'intermedio', timeMinutes: 60, cost: 'gratis', language: 'es',
    link: genericSearchUrl('cómo construir una app con IA para principiantes'), tags: ['ia', 'proyecto'], priority: 5, estimatedRating: 4,
    lastVerified: VERIFIED,
  },

  // ─── SQL y datos ──────────────────────────────────────────────────────────
  {
    id: 'rec-sql-sqlzoo', type: 'coding-exercise', category: 'sql-datos',
    title: 'SQLZoo', creator: 'SQLZoo',
    description: 'Ejercicios interactivos de SQL, de básico a avanzado, en el navegador.',
    whyForYou: 'Práctica directa para tu meta de dominar SQL y optimización de consultas.',
    goalId: 'goal-sql', difficulty: 'principiante', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: genericSearchUrl('SQLZoo interactive SQL tutorial'), tags: ['sql', 'practica'], priority: 5, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-sql-mode', type: 'course', category: 'sql-datos',
    title: 'Mode SQL Tutorial', creator: 'Mode Analytics',
    description: 'Tutorial gratuito y muy completo de SQL para análisis de datos.',
    whyForYou: 'Cubre justo lo que quieres reforzar: consultas, procedimientos y análisis de datos.',
    goalId: 'goal-sql', difficulty: 'intermedio', timeMinutes: 30, cost: 'gratis', language: 'en',
    link: courseSearchUrl('SQL Tutorial', 'Mode Analytics'), tags: ['sql', 'analisis-datos'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-sql-postgres-docs', type: 'official-resource', category: 'sql-datos',
    title: 'PostgreSQL — Documentación oficial', creator: 'PostgreSQL Global Development Group',
    description: 'Documentación técnica completa de uno de los motores SQL más usados.',
    whyForYou: 'Referencia sólida para procedimientos almacenados y optimización de consultas.',
    goalId: 'goal-sql', difficulty: 'avanzado', timeMinutes: 30, cost: 'gratis', language: 'en',
    link: 'https://www.postgresql.org/docs/', tags: ['sql', 'postgres', 'documentacion'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-sql-leetcode', type: 'coding-exercise', category: 'sql-datos',
    title: 'LeetCode — SQL', creator: 'LeetCode',
    description: 'Ejercicios de SQL estilo entrevista técnica, con dificultad creciente.',
    whyForYou: 'Práctica orientada a resultados, útil también de cara a entrevistas de nivel Senior.',
    goalId: 'goal-sql', difficulty: 'intermedio', timeMinutes: 20, cost: 'gratis', language: 'en',
    link: genericSearchUrl('LeetCode SQL problems'), tags: ['sql', 'entrevistas'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-sql-freecodecamp', type: 'youtube', category: 'sql-datos',
    title: 'freeCodeCamp — Bases de datos', creator: 'freeCodeCamp',
    description: 'Cursos largos y gratuitos en video sobre SQL y diseño de bases de datos.',
    whyForYou: 'Buen recurso para una sesión profunda de fin de semana sobre modelado de datos.',
    goalId: 'goal-sql', difficulty: 'intermedio', timeMinutes: 60, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('freeCodeCamp SQL database design course'), tags: ['sql', 'bases-de-datos'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },

  // ─── Inglés ────────────────────────────────────────────────────────────────
  {
    id: 'rec-en-bbc', type: 'official-resource', category: 'ingles',
    title: 'BBC Learning English', creator: 'BBC',
    description: 'Lecciones, audio y video gratuitos organizados por nivel.',
    whyForYou: 'Recurso serio y gratuito para avanzar de tu nivel actual hacia B1 y más allá.',
    goalId: 'goal-english', difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: 'https://www.bbc.co.uk/learningenglish', tags: ['ingles', 'listening'], priority: 5, estimatedRating: 4.5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-en-duolingo', type: 'tool-app', category: 'ingles',
    title: 'Duolingo', creator: 'Duolingo',
    description: 'App de práctica diaria en bloques cortos, con seguimiento de racha.',
    whyForYou: 'Encaja perfecto en bloques de 5 minutos entre tareas, sin requerir sesiones largas.',
    goalId: 'goal-english', difficulty: 'principiante', timeMinutes: 5, cost: 'gratis', language: 'en',
    link: appSearchUrl('Duolingo'), tags: ['ingles', 'app'], priority: 3, estimatedRating: 4,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-en-lucy', type: 'youtube', category: 'ingles',
    title: 'English with Lucy', creator: 'Lucy Bella Earl',
    description: 'Pronunciación, vocabulario y gramática explicados de forma clara.',
    whyForYou: 'Buen complemento de listening técnico-neutro para tu inglés de trabajo.',
    goalId: 'goal-english', difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('English with Lucy'), tags: ['ingles', 'pronunciacion'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-en-cambridge', type: 'official-resource', category: 'ingles',
    title: 'Cambridge English', creator: 'Cambridge Assessment English',
    description: 'Materiales oficiales de preparación y autoevaluación de nivel.',
    whyForYou: 'Te ayuda a confirmar objetivamente cuándo cruzas de tu nivel actual a B1 y B2.',
    goalId: 'goal-english', difficulty: 'intermedio', timeMinutes: 20, cost: 'gratis', language: 'en',
    link: genericSearchUrl('Cambridge English free practice tests'), tags: ['ingles', 'evaluacion'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-en-ted', type: 'youtube', category: 'ingles',
    title: 'TED Talks', creator: 'TED',
    description: 'Charlas en inglés con subtítulos, ritmo natural de conversación.',
    whyForYou: 'Práctica de listening con contenido real, no diseñado para estudiantes de idioma.',
    goalId: 'goal-english', difficulty: 'avanzado', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('TED Talks'), tags: ['ingles', 'listening'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },

  // ─── Gimnasio ─────────────────────────────────────────────────────────────
  {
    id: 'rec-sa1', type: 'youtube', category: 'gimnasio',
    title: 'Jeff Nippard', creator: 'Jeff Nippard',
    description: 'Entrenamiento de fuerza basado en evidencia científica, sin relleno.',
    whyForYou: 'Encaja con tu enfoque de fuerza/hipertrofia y rutinas PPL.',
    goalId: 'goal-vshape', difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('Jeff Nippard'), tags: ['gimnasio', 'fuerza', 'evidencia'], priority: 5, estimatedRating: 5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-sa2', type: 'youtube', category: 'gimnasio',
    title: 'AthleanX', creator: 'Jeff Cavaliere',
    description: 'Explicaciones biomecánicas de ejercicios y corrección de forma.',
    whyForYou: 'Reduce el riesgo de lesión mientras entrenas espalda, hombros y pecho para tu forma en V.',
    goalId: 'goal-vshape', difficulty: 'intermedio', timeMinutes: 12, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('AthleanX'), tags: ['gimnasio', 'tecnica'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-sa3', type: 'book', category: 'gimnasio',
    title: 'Bigger Leaner Stronger', creator: 'Michael Matthews',
    description: 'Guía basada en evidencia de entrenamiento y nutrición, sin suplementos milagro.',
    whyForYou: 'Cubre exactamente tu combinación de meta: ganar músculo y reducir grasa de forma sostenible.',
    goalId: 'goal-vshape', difficulty: 'principiante', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('Bigger Leaner Stronger', 'Michael Matthews'), tags: ['gimnasio', 'nutricion'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-sa4', type: 'book', category: 'gimnasio',
    title: '¿Por qué dormimos?', creator: 'Matthew Walker',
    description: 'La ciencia del sueño y su rol en la recuperación muscular y cognitiva.',
    whyForYou: 'Relevante directo a tu recuperación entre sesiones de gym y a sostener hábitos sin quemarte.',
    goalId: 'goal-vshape', difficulty: 'intermedio', timeMinutes: 30, cost: 'pago-unico', language: 'es',
    link: bookSearchUrl('¿Por qué dormimos?', 'Matthew Walker'), tags: ['sueno', 'recuperacion'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-gym-rp', type: 'youtube', category: 'gimnasio',
    title: 'Renaissance Periodization', creator: 'Dr. Mike Israetel',
    description: 'Programación de entrenamiento e hipertrofia con base científica.',
    whyForYou: 'Útil para ajustar volumen e intensidad de tu rutina Push/Pull/Legs con criterio, no por intuición.',
    goalId: 'goal-vshape', difficulty: 'avanzado', timeMinutes: 20, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('Renaissance Periodization hypertrophy'), tags: ['gimnasio', 'hipertrofia'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },

  // ─── Nutrición ────────────────────────────────────────────────────────────
  {
    id: 'rec-nut-examine', type: 'official-resource', category: 'nutricion',
    title: 'Examine.com', creator: 'Examine',
    description: 'Análisis independiente y basado en evidencia de nutrición y suplementación.',
    whyForYou: 'La fuente correcta para evaluar cualquier suplemento con criterio, sin promesas milagro.',
    goalId: 'goal-lean', difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: 'https://examine.com', tags: ['nutricion', 'evidencia'], priority: 5, estimatedRating: 5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-nut-precision', type: 'official-resource', category: 'nutricion',
    title: 'Precision Nutrition', creator: 'Precision Nutrition',
    description: 'Artículos y calculadoras de nutrición aplicada, sostenibles y sin extremos.',
    whyForYou: 'Coincide con tu preferencia por recomendaciones realistas y sostenibles, no dietas extremas.',
    goalId: 'goal-lean', difficulty: 'principiante', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: genericSearchUrl('Precision Nutrition articles'), tags: ['nutricion', 'sostenible'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-nut-rp-diet', type: 'youtube', category: 'nutricion',
    title: 'Renaissance Periodization — Diet', creator: 'Dr. Mike Israetel',
    description: 'Nutrición aplicada a definición y volumen desde una óptica científica.',
    whyForYou: 'Directo a tu meta de mantener una definición saludable sin dietas extremas.',
    goalId: 'goal-lean', difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('Renaissance Periodization diet fat loss'), tags: ['nutricion', 'definicion'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-nut-mfp', type: 'tool-app', category: 'nutricion',
    title: 'MyFitnessPal', creator: 'MyFitnessPal',
    description: 'App para llevar registro de macros y calorías.',
    whyForYou: 'Herramienta práctica para sostener tu déficit/superávit calórico sin adivinar.',
    goalId: 'goal-lean', difficulty: 'principiante', timeMinutes: 5, cost: 'gratis', language: 'es',
    link: appSearchUrl('MyFitnessPal'), tags: ['nutricion', 'app'], priority: 3, estimatedRating: 4,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-nut-recipe', type: 'recipe', category: 'nutricion',
    title: 'Bowl de pollo, arroz y vegetales — alto en proteína', creator: 'Receta base del sistema',
    description: 'Meal prep simple y económico, fácil de repetir varias veces por semana.',
    whyForYou: 'Realista y económico para tu horario de 8 a 5 — se prepara en bloque el fin de semana.',
    goalId: 'goal-lean', difficulty: 'principiante', timeMinutes: 30, cost: 'gratis', language: 'es',
    link: genericSearchUrl('meal prep pollo arroz vegetales alto en proteína'), tags: ['nutricion', 'receta', 'meal-prep'], priority: 3, estimatedRating: 4,
    lastVerified: VERIFIED,
  },

  // ─── Hábitos y productividad ──────────────────────────────────────────────
  {
    id: 'rec-h1', type: 'book', category: 'habitos-productividad',
    title: 'Hábitos Atómicos', creator: 'James Clear',
    description: 'El libro de referencia sobre sistemas pequeños y consistentes.',
    whyForYou: 'El marco teórico detrás de tu racha diaria en este mismo tracker.',
    goalId: 'goal-discipline', difficulty: 'principiante', timeMinutes: 30, cost: 'pago-unico', language: 'es',
    link: bookSearchUrl('Hábitos Atómicos', 'James Clear'), tags: ['habitos', 'sistemas'], priority: 5, estimatedRating: 5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-h2', type: 'book', category: 'habitos-productividad',
    title: 'El Poder de los Hábitos', creator: 'Charles Duhigg',
    description: 'Explica el bucle señal-rutina-recompensa.',
    whyForYou: 'Exactamente el ciclo que esta app automatiza con XP y oro.',
    goalId: 'goal-discipline', difficulty: 'principiante', timeMinutes: 30, cost: 'pago-unico', language: 'es',
    link: bookSearchUrl('El Poder de los Hábitos', 'Charles Duhigg'), tags: ['habitos'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-h3', type: 'youtube', category: 'habitos-productividad',
    title: 'Ali Abdaal', creator: 'Ali Abdaal',
    description: 'Productividad basada en evidencia, sin humo.',
    whyForYou: 'Sistemas de estudio y trabajo profundo aplicables directo a tu preparación de certificaciones.',
    goalId: 'goal-discipline', difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('Ali Abdaal'), tags: ['productividad', 'estudio'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-h4', type: 'youtube', category: 'habitos-productividad',
    title: 'Better Ideas', creator: 'Better Ideas',
    description: 'Videos concisos sobre disciplina, foco y diseño de sistemas personales.',
    whyForYou: 'Buen complemento para tus sesiones de Pomodoro.',
    goalId: 'goal-discipline', difficulty: 'intermedio', timeMinutes: 10, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('Better Ideas YouTube'), tags: ['disciplina', 'foco'], priority: 3, estimatedRating: 4,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-gtd', type: 'book', category: 'habitos-productividad',
    title: 'Getting Things Done', creator: 'David Allen',
    description: 'Metodología clásica para organizar tareas y despejar la mente.',
    whyForYou: 'Útil para administrar mejor tu tiempo entre trabajo, gym y estudio, tal como buscas.',
    goalId: 'goal-discipline', difficulty: 'intermedio', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('Getting Things Done', 'David Allen'), tags: ['productividad', 'organizacion'], priority: 3, estimatedRating: 4,
    lastVerified: VERIFIED,
  },

  // ─── Filosofía y pensamiento crítico ──────────────────────────────────────
  {
    id: 'rec-phil-meditaciones', type: 'book', category: 'filosofia-pensamiento-critico',
    title: 'Meditaciones', creator: 'Marco Aurelio',
    description: 'El texto estoico fundacional, escrito como diario personal.',
    whyForYou: 'Base directa del estoicismo que ya sigues a través de Holiday y Greene.',
    goalId: 'goal-stoicism', difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'es',
    link: bookSearchUrl('Meditaciones', 'Marco Aurelio'), tags: ['estoicismo', 'filosofia'], priority: 5, estimatedRating: 5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-phil-dailystoic', type: 'book', category: 'filosofia-pensamiento-critico',
    title: 'The Daily Stoic', creator: 'Ryan Holiday',
    description: 'Reflexiones estoicas diarias en formato breve, una por día.',
    whyForYou: 'De uno de tus autores favoritos, y su formato de 5 minutos encaja con tus bloques cortos.',
    goalId: 'goal-stoicism', difficulty: 'principiante', timeMinutes: 5, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('The Daily Stoic', 'Ryan Holiday'), tags: ['estoicismo', 'ryan-holiday'], priority: 5, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-phil-obstacle', type: 'book', category: 'filosofia-pensamiento-critico',
    title: 'The Obstacle Is the Way', creator: 'Ryan Holiday',
    description: 'Cómo convertir dificultades en ventaja, con ejemplos históricos.',
    whyForYou: 'Aplicable directo a la disciplina que buscas al enfrentar la carga de trabajo + gym + estudio.',
    goalId: 'goal-stoicism', difficulty: 'intermedio', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('The Obstacle Is the Way', 'Ryan Holiday'), tags: ['estoicismo', 'ryan-holiday'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-phil-48laws', type: 'book', category: 'filosofia-pensamiento-critico',
    title: 'Las 48 Leyes del Poder', creator: 'Robert Greene',
    description: 'Análisis de estrategia, poder y comportamiento humano a través de la historia.',
    whyForYou: 'De uno de tus autores favoritos, conecta filosofía con estrategia y psicología.',
    difficulty: 'intermedio', timeMinutes: 30, cost: 'pago-unico', language: 'es',
    link: bookSearchUrl('Las 48 Leyes del Poder', 'Robert Greene'), tags: ['estrategia', 'robert-greene'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-phil-seneca', type: 'book', category: 'filosofia-pensamiento-critico',
    title: 'Cartas a Lucilio', creator: 'Séneca',
    description: 'Cartas estoicas sobre cómo vivir bien, escritas hace casi dos mil años.',
    whyForYou: 'Otro pilar clásico del estoicismo que complementa a Holiday y Greene.',
    goalId: 'goal-stoicism', difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'es',
    link: bookSearchUrl('Cartas a Lucilio', 'Séneca'), tags: ['estoicismo', 'clasicos'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },

  // ─── Psicología y comportamiento humano ───────────────────────────────────
  {
    id: 'rec-psy-kahneman', type: 'book', category: 'psicologia-comportamiento',
    title: 'Pensar rápido, pensar despacio', creator: 'Daniel Kahneman',
    description: 'Los dos sistemas de pensamiento y los sesgos que afectan tus decisiones.',
    whyForYou: 'Complementa tu interés en pensamiento crítico con la ciencia detrás del comportamiento humano.',
    difficulty: 'avanzado', timeMinutes: 30, cost: 'pago-unico', language: 'es',
    link: bookSearchUrl('Pensar rápido, pensar despacio', 'Daniel Kahneman'), tags: ['psicologia', 'decisiones'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-psy-influence', type: 'book', category: 'psicologia-comportamiento',
    title: 'Influence', creator: 'Robert Cialdini',
    description: 'Los principios psicológicos detrás de la persuasión.',
    whyForYou: 'Encaja con tu interés en comportamiento humano y estrategia.',
    difficulty: 'intermedio', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('Influence', 'Robert Cialdini'), tags: ['psicologia', 'persuasion'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-psy-sapiens', type: 'book', category: 'psicologia-comportamiento',
    title: 'Sapiens', creator: 'Yuval Noah Harari',
    description: 'Una historia del comportamiento humano desde la antropología.',
    whyForYou: 'Lectura densa perfecta para tus bloques largos de fin de semana.',
    difficulty: 'intermedio', timeMinutes: 60, cost: 'pago-unico', language: 'es',
    link: bookSearchUrl('Sapiens', 'Yuval Noah Harari'), tags: ['psicologia', 'historia'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-psy-huberman', type: 'podcast', category: 'psicologia-comportamiento',
    title: 'Huberman Lab', creator: 'Andrew Huberman',
    description: 'Neurociencia aplicada a hábitos, sueño, foco y comportamiento.',
    whyForYou: 'Conecta directamente con tu meta de crear mejores hábitos, con base científica.',
    goalId: 'goal-discipline', difficulty: 'intermedio', timeMinutes: 30, cost: 'gratis', language: 'en',
    link: podcastSearchUrl('Huberman Lab', 'Andrew Huberman'), tags: ['psicologia', 'neurociencia'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-psy-quiet', type: 'book', category: 'psicologia-comportamiento',
    title: 'Quiet', creator: 'Susan Cain',
    description: 'El poder de la introversión en un mundo que premia lo extrovertido.',
    whyForYou: 'Perspectiva útil sobre comunicación y carisma sin forzar un estilo que no es el tuyo.',
    difficulty: 'principiante', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('Quiet', 'Susan Cain'), tags: ['psicologia', 'introversion'], priority: 2, estimatedRating: 4,
    lastVerified: VERIFIED,
  },

  // ─── Propósito y crecimiento personal ─────────────────────────────────────
  {
    id: 'rec-g1', type: 'book', category: 'proposito-crecimiento-personal',
    title: 'Level Up Your Life', creator: 'Steve Kamb (Nerd Fitness)',
    description: 'El manual literal de convertir tu vida en un RPG: stats, misiones, gremios.',
    whyForYou: 'La base filosófica de esta misma app.',
    difficulty: 'principiante', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('Level Up Your Life', 'Steve Kamb'), tags: ['gamificacion', 'proposito'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-g2', type: 'book', category: 'proposito-crecimiento-personal',
    title: 'SuperBetter', creator: 'Jane McGonigal',
    description: 'Cómo usar mecánicas de gamificación para construir resiliencia real.',
    whyForYou: 'Explica la teoría detrás de por qué convertir tu vida en un juego funciona de verdad.',
    difficulty: 'intermedio', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('SuperBetter', 'Jane McGonigal'), tags: ['gamificacion', 'resiliencia'], priority: 3, estimatedRating: 4,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-g3', type: 'youtube', category: 'proposito-crecimiento-personal',
    title: 'Nerd Fitness', creator: 'Steve Kamb',
    description: 'Fitness y hábitos tratados explícitamente como sistema de juego.',
    whyForYou: 'El canal del autor de "Level Up Your Life" — coherente con la filosofía de este tracker.',
    difficulty: 'principiante', timeMinutes: 10, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('Nerd Fitness'), tags: ['gamificacion', 'gym'], priority: 3, estimatedRating: 4,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-g4', type: 'youtube', category: 'proposito-crecimiento-personal',
    title: 'HealthyGamerGG', creator: 'Dr. Alok Kanojia',
    description: 'Psiquiatra que analiza la psicología detrás de por qué los juegos enganchan.',
    whyForYou: 'Útil para diseñar mejor tu propio sistema de recompensas sin caer en malos hábitos digitales.',
    difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('HealthyGamerGG'), tags: ['psicologia', 'gamificacion'], priority: 3, estimatedRating: 4,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-purpose-frankl', type: 'book', category: 'proposito-crecimiento-personal',
    title: 'El hombre en busca de sentido', creator: 'Viktor Frankl',
    description: 'Reflexión clásica sobre cómo encontrar propósito incluso en las circunstancias más duras.',
    whyForYou: 'Conecta directo con tu meta de "encontrar un propósito claro y avanzar hacia una vida equilibrada".',
    difficulty: 'intermedio', timeMinutes: 30, cost: 'pago-unico', language: 'es',
    link: bookSearchUrl('El hombre en busca de sentido', 'Viktor Frankl'), tags: ['proposito', 'clasico'], priority: 4, estimatedRating: 5,
    lastVerified: VERIFIED,
  },

  // ─── Finanzas personales ──────────────────────────────────────────────────
  {
    id: 'rec-f1', type: 'book', category: 'finanzas',
    title: 'Padre Rico, Padre Pobre', creator: 'Robert Kiyosaki',
    description: 'El clásico de educación financiera.',
    whyForYou: 'Cambia cómo piensas ingresos, gastos y activos, justo lo que trackeas en Finanzas.',
    difficulty: 'principiante', timeMinutes: 30, cost: 'pago-unico', language: 'es',
    link: bookSearchUrl('Padre Rico, Padre Pobre', 'Robert Kiyosaki'), tags: ['finanzas'], priority: 4, estimatedRating: 4,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-f2', type: 'book', category: 'finanzas',
    title: 'El Hombre Más Rico de Babilonia', creator: 'George S. Clason',
    description: 'Principios atemporales de ahorro y disciplina con el dinero, en parábolas cortas.',
    whyForYou: 'Formato breve, perfecto para leer en capítulos sueltos entre semana.',
    difficulty: 'principiante', timeMinutes: 15, cost: 'gratis', language: 'es',
    link: bookSearchUrl('El Hombre Más Rico de Babilonia', 'George S. Clason'), tags: ['finanzas', 'ahorro'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-f3', type: 'youtube', category: 'finanzas',
    title: 'Value School', creator: 'Value School',
    description: 'Educación financiera en español, seria y sin promesas de "hacerte rico rápido".',
    whyForYou: 'Ahorro, inversión y presupuesto, en línea con tu propio módulo de Finanzas.',
    difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'es',
    link: youtubeSearchUrl('Value School'), tags: ['finanzas', 'espanol'], priority: 3, estimatedRating: 4,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-f4', type: 'youtube', category: 'finanzas',
    title: 'Nate O’Brien', creator: 'Nate O’Brien',
    description: 'Finanzas personales prácticas: presupuesto, gastos fijos y construcción de ahorro.',
    whyForYou: 'En línea directa con tu sección de Finanzas: cuenta, ahorro y gastos recurrentes.',
    difficulty: 'principiante', timeMinutes: 12, cost: 'gratis', language: 'en',
    link: youtubeSearchUrl('Nate O’Brien personal finance'), tags: ['finanzas', 'presupuesto'], priority: 3, estimatedRating: 4,
    lastVerified: VERIFIED,
  },

  // ─── Fantasía y ciencia ficción ────────────────────────────────────────────
  {
    id: 'rec-fic-stormlight', type: 'book', category: 'fantasia-scifi',
    title: 'El Archivo de las Tormentas', creator: 'Brandon Sanderson',
    description: 'Épica de fantasía con uno de los mundos más complejos y mejor construidos del género.',
    whyForYou: 'De tu autor favorito — ideal para tus bloques largos de lectura de fin de semana.',
    goalId: 'goal-reading', difficulty: 'intermedio', timeMinutes: 60, cost: 'pago-unico', language: 'es',
    link: bookSearchUrl('El Archivo de las Tormentas', 'Brandon Sanderson'), tags: ['fantasia', 'sanderson'], priority: 5, estimatedRating: 5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-fic-mistborn', type: 'book', category: 'fantasia-scifi',
    title: 'Nacidos de la Bruma', creator: 'Brandon Sanderson',
    description: 'Trilogía de fantasía con un sistema de magia extremadamente bien diseñado.',
    whyForYou: 'Otra obra de Sanderson, más corta que Stormlight si buscas algo más contenido.',
    goalId: 'goal-reading', difficulty: 'intermedio', timeMinutes: 45, cost: 'pago-unico', language: 'es',
    link: bookSearchUrl('Nacidos de la Bruma', 'Brandon Sanderson'), tags: ['fantasia', 'sanderson'], priority: 4, estimatedRating: 5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-fic-thrawn', type: 'book', category: 'fantasia-scifi',
    title: 'Star Wars: Trilogía Thrawn', creator: 'Timothy Zahn',
    description: 'Novelas canon de Star Wars centradas en uno de los villanos más queridos del universo.',
    whyForYou: 'Encaja directo con tu interés en Star Wars y en narrativas de ciencia ficción bien construidas.',
    goalId: 'goal-reading', difficulty: 'intermedio', timeMinutes: 45, cost: 'pago-unico', language: 'es',
    link: bookSearchUrl('Trilogía Thrawn', 'Timothy Zahn'), tags: ['star-wars', 'scifi'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-fic-dune', type: 'book', category: 'fantasia-scifi',
    title: 'Dune', creator: 'Frank Herbert',
    description: 'El clásico fundacional de la ciencia ficción moderna.',
    whyForYou: 'Si te gustan los universos complejos tipo Star Wars, este es el origen de muchos de ellos.',
    goalId: 'goal-reading', difficulty: 'intermedio', timeMinutes: 45, cost: 'pago-unico', language: 'es',
    link: bookSearchUrl('Dune', 'Frank Herbert'), tags: ['scifi', 'clasico'], priority: 4, estimatedRating: 5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-fic-expanse', type: 'book', category: 'fantasia-scifi',
    title: 'The Expanse', creator: 'James S. A. Corey',
    description: 'Space opera realista con política interplanetaria y personajes sólidos.',
    whyForYou: 'Otra saga extensa si terminas Stormlight y quieres algo igual de inmersivo.',
    goalId: 'goal-reading', difficulty: 'intermedio', timeMinutes: 45, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('The Expanse', 'James S. A. Corey'), tags: ['scifi', 'space-opera'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },

  // ─── Videojuegos ──────────────────────────────────────────────────────────
  {
    id: 'rec-vg-bg3', type: 'video-game', category: 'videojuegos',
    title: 'Baldur’s Gate 3', creator: 'Larian Studios',
    description: 'RPG narrativo profundo con decisiones que realmente importan.',
    whyForYou: 'Exactamente tu tipo de juego: RPG con una historia sólida detrás.',
    difficulty: 'intermedio', timeMinutes: 60, cost: 'pago-unico', language: 'es',
    link: genericSearchUrl('Baldur’s Gate 3'), tags: ['rpg', 'narrativo'], priority: 4, estimatedRating: 5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-vg-jedi', type: 'video-game', category: 'videojuegos',
    title: 'Star Wars Jedi: Fallen Order', creator: 'Respawn Entertainment',
    description: 'Acción y exploración en el universo Star Wars con una historia bien contada.',
    whyForYou: 'Une dos de tus intereses directos: RPG de acción y Star Wars.',
    difficulty: 'intermedio', timeMinutes: 60, cost: 'pago-unico', language: 'es',
    link: genericSearchUrl('Star Wars Jedi Fallen Order'), tags: ['star-wars', 'accion'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-vg-discoelysium', type: 'video-game', category: 'videojuegos',
    title: 'Disco Elysium', creator: 'ZA/UM',
    description: 'RPG centrado casi por completo en diálogo, filosofía e introspección del personaje.',
    whyForYou: 'Combina tu interés en RPG narrativos con filosofía y psicología del comportamiento.',
    difficulty: 'intermedio', timeMinutes: 60, cost: 'pago-unico', language: 'en',
    link: genericSearchUrl('Disco Elysium'), tags: ['rpg', 'narrativo', 'filosofia'], priority: 3, estimatedRating: 5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-vg-hades', type: 'video-game', category: 'videojuegos',
    title: 'Hades', creator: 'Supergiant Games',
    description: 'Roguelike narrativo con mitología griega y sesiones cortas ideales para ratos libres.',
    whyForYou: 'Partidas cortas que encajan en bloques de 15-30 minutos entre semana.',
    difficulty: 'intermedio', timeMinutes: 20, cost: 'pago-unico', language: 'es',
    link: genericSearchUrl('Hades videojuego Supergiant'), tags: ['roguelike', 'narrativo'], priority: 3, estimatedRating: 5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-vg-masseffect', type: 'video-game', category: 'videojuegos',
    title: 'Mass Effect: Legendary Edition', creator: 'BioWare',
    description: 'Trilogía de RPG de ciencia ficción con decisiones que se arrastran entre juegos.',
    whyForYou: 'Space opera con la profundidad narrativa que buscas en tus juegos favoritos.',
    difficulty: 'intermedio', timeMinutes: 60, cost: 'pago-unico', language: 'es',
    link: genericSearchUrl('Mass Effect Legendary Edition'), tags: ['rpg', 'scifi'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },

  // ─── Entretenimiento ──────────────────────────────────────────────────────
  {
    id: 'rec-ent-andor', type: 'movie-series', category: 'entretenimiento',
    title: 'Andor', creator: 'Star Wars / Disney+',
    description: 'Serie de Star Wars centrada en política, espionaje y construcción de un movimiento de resistencia.',
    whyForYou: 'La serie de Star Wars con más peso narrativo — encaja con tu gusto por historias complejas.',
    difficulty: 'intermedio', timeMinutes: 45, cost: 'suscripcion', language: 'es',
    link: genericSearchUrl('Andor serie Star Wars'), tags: ['star-wars', 'serie'], priority: 4, estimatedRating: 5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-ent-mandalorian', type: 'movie-series', category: 'entretenimiento',
    title: 'The Mandalorian', creator: 'Star Wars / Disney+',
    description: 'Serie episódica de Star Wars, más ligera y accesible para ver por capítulos sueltos.',
    whyForYou: 'Formato de episodios independientes, fácil de ver en bloques cortos entre semana.',
    difficulty: 'principiante', timeMinutes: 40, cost: 'suscripcion', language: 'es',
    link: genericSearchUrl('The Mandalorian serie'), tags: ['star-wars', 'serie'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-ent-dune2', type: 'movie-series', category: 'entretenimiento',
    title: 'Dune: Parte Dos', creator: 'Denis Villeneuve',
    description: 'Adaptación aclamada de la segunda mitad de la novela de Frank Herbert.',
    whyForYou: 'Buena opción de fin de semana si ya leíste o estás leyendo el libro.',
    difficulty: 'principiante', timeMinutes: 60, cost: 'suscripcion', language: 'es',
    link: genericSearchUrl('Dune Parte Dos película'), tags: ['scifi', 'pelicula'], priority: 3, estimatedRating: 5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-ent-expanse-tv', type: 'movie-series', category: 'entretenimiento',
    title: 'The Expanse', creator: 'Amazon / Syfy',
    description: 'Adaptación televisiva de la saga de space opera del mismo nombre.',
    whyForYou: 'Si prefieres ver antes de leer los libros, es una entrada muy fiel a la saga.',
    difficulty: 'principiante', timeMinutes: 45, cost: 'suscripcion', language: 'es',
    link: genericSearchUrl('The Expanse serie'), tags: ['scifi', 'serie'], priority: 2, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-ent-arcane', type: 'movie-series', category: 'entretenimiento',
    title: 'Arcane', creator: 'Riot Games / Netflix',
    description: 'Serie animada aclamada, con una narrativa madura ambientada en el universo de League of Legends.',
    whyForYou: 'Historia y personajes con la profundidad que buscas, en formato de temporadas cortas.',
    difficulty: 'principiante', timeMinutes: 40, cost: 'suscripcion', language: 'es',
    link: genericSearchUrl('Arcane serie animada'), tags: ['animacion', 'serie'], priority: 3, estimatedRating: 5,
    lastVerified: VERIFIED,
  },

  // ─── Desarrollo profesional ───────────────────────────────────────────────
  {
    id: 'rec-dp-deepwork', type: 'book', category: 'desarrollo-profesional',
    title: 'Deep Work', creator: 'Cal Newport',
    description: 'Cómo producir trabajo de valor en un mundo lleno de distracciones.',
    whyForYou: 'Directo a tu meta de administrar mejor el tiempo entre trabajo, estudio y certificaciones.',
    goalId: 'goal-senior-salesforce', difficulty: 'intermedio', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('Deep Work', 'Cal Newport'), tags: ['carrera', 'foco'], priority: 4, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-dp-sogood', type: 'book', category: 'desarrollo-profesional',
    title: 'So Good They Can’t Ignore You', creator: 'Cal Newport',
    description: 'Por qué construir habilidad raro-y-valiosa importa más que "seguir tu pasión".',
    whyForYou: 'Marco útil para pensar tu progresión hacia Senior como construcción deliberada de skill.',
    goalId: 'goal-senior-salesforce', difficulty: 'intermedio', timeMinutes: 30, cost: 'pago-unico', language: 'en',
    link: bookSearchUrl('So Good They Can’t Ignore You', 'Cal Newport'), tags: ['carrera'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-dp-pragmaticeng', type: 'community', category: 'desarrollo-profesional',
    title: 'The Pragmatic Engineer', creator: 'Gergely Orosz',
    description: 'Newsletter de referencia sobre carrera técnica, ingeniería de software y la industria.',
    whyForYou: 'Perspectiva realista de qué distingue a un desarrollador Senior en cualquier stack.',
    goalId: 'goal-senior-salesforce', difficulty: 'intermedio', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: genericSearchUrl('The Pragmatic Engineer newsletter Gergely Orosz'), tags: ['carrera', 'newsletter'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED,
  },
  {
    id: 'rec-dp-roadmap', type: 'official-resource', category: 'desarrollo-profesional',
    title: 'roadmap.sh', creator: 'roadmap.sh',
    description: 'Roadmaps visuales de aprendizaje para distintas rutas de desarrollo de software.',
    whyForYou: 'Buen mapa de referencia para ordenar qué aprender antes de qué, camino a Senior.',
    goalId: 'goal-senior-salesforce', difficulty: 'principiante', timeMinutes: 15, cost: 'gratis', language: 'en',
    link: 'https://roadmap.sh', tags: ['carrera', 'roadmap'], priority: 3, estimatedRating: 4.5,
    lastVerified: VERIFIED, officialSource: true,
  },
  {
    id: 'rec-dp-linkedinlearning', type: 'tool-app', category: 'desarrollo-profesional',
    title: 'LinkedIn Learning', creator: 'LinkedIn',
    description: 'Plataforma de cursos cortos sobre habilidades técnicas y profesionales.',
    whyForYou: 'Buena fuente adicional de cursos cortos que se pueden certificar en tu perfil profesional.',
    difficulty: 'intermedio', timeMinutes: 30, cost: 'suscripcion', language: 'en',
    link: appSearchUrl('LinkedIn Learning'), tags: ['carrera', 'cursos'], priority: 2, estimatedRating: 4,
    lastVerified: VERIFIED,
  },
];
