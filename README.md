# Samu Tracker RPG

Tracker personal de hábitos, misiones, estudio y finanzas con una capa de
gamificación tipo RPG (niveles, rangos, oro, tienda de recompensas). Uso
100% personal — sin backend, sin autenticación, todo vive en `localStorage`
del navegador.

## Stack

- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS v4** (`@tailwindcss/vite`) — tema "Sistema" (dark, acento
  azul eléctrico + violeta) definido por completo en `src/index.css`
- **lucide-react** para iconos
- Persistencia: `localStorage`, todas las claves con prefijo `rpg_`
  (ver `src/lib/storage.ts`)

## Scripts

```bash
npm run dev       # servidor de desarrollo (Vite)
npm run build     # typecheck (tsc -b) + build de producción a dist/
npm run lint      # ESLint (incluye reglas de React Compiler/hooks)
npm run preview   # sirve el build de dist/ localmente
```

## Estructura

```
src/
  components/<sección>/   # una carpeta por sección de navegación
  components/ui/          # primitivos compartidos (Card, Button, Modal...)
  components/layout/      # Sidebar + BottomNav (fuente de verdad del nav)
  hooks/                  # useLocalStorage, useXP
  lib/                    # storage.ts (persistencia), xp.ts (economía)
  types/index.ts          # todos los tipos del dominio
  data/initial.ts         # datos semilla (hábitos/misiones por defecto)
```

Cada sección es independiente: lee/escribe su propio slice de
`localStorage` vía `useLocalStorage` + `storage.keys.*`. No hay estado
global compartido más allá de eso.

## Economía del juego

- **XP**: nunca se gasta, solo sube de nivel y rango.
- **Oro**: moneda gastable en la Tienda, se gana junto al XP
  (`goldForXP` en `lib/xp.ts`, aprox. la mitad del XP ganado).

## Despliegue

Listo para Netlify: `netlify.toml` define el build (`npm run build`) y el
publish dir (`dist`) con redirect SPA. Cualquier host estático sirve
igual de bien — es un build de Vite puro.

## Notas de mantenimiento

- El linter usa el preset `recommended` de `eslint-plugin-react-hooks` v7,
  que incluye los diagnósticos de pureza de React Compiler (aunque el
  compilador en sí no está habilitado). Si `npm run lint` marca algo,
  suele apuntar a un problema real (efectos que disparan cascadas de
  `setState`, llamadas impuras como `Date.now()` dentro de `useMemo`,
  etc.) — no lo silencies sin revisar el patrón sugerido en el mensaje.
- Variables intencionalmente sin usar: prefijo `_` (configurado en
  `eslint.config.js`).
