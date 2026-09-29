# AIForge — Frontend

Frontend de **AIForge**, mi Trabajo de Fin de Grado: una plataforma web para crear, compartir y optimizar mazos de Marvel Champions (el juego de cartas cooperativo) usando machine learning. Este repo es la interfaz; la API y el modelo de IA viven en [tfg-marveldcb-backend](https://github.com/cesiitar/tfg-marveldcb-backend).

En producción: https://aiforgedecks.com

## Qué se puede hacer

- **Explorar la colección completa de cartas** del juego, organizada por sets, con búsqueda y filtros. Los datos vienen de la API pública de [MarvelCDB](https://marvelcdb.com).
- **Crear mazos** desde cero eligiendo héroe y aspecto, carta a carta, o **importarlos directamente desde MarvelCDB** pegando el enlace del mazo.
- **Comunidad**: ver los mazos publicados por otros usuarios, comentarlos y guardarlos como favoritos.
- **Registrar partidas** (héroe y mazo contra qué villano, en qué dificultad, y el resultado) y consultar el historial y las estadísticas propias.
- **Recomendación con IA**: la funcionalidad central del TFG. Eliges villano y dificultad, y el modelo — entrenado con las partidas registradas por los usuarios — estima la probabilidad de victoria y genera un mazo optimizado para ese enfrentamiento concreto. El detalle de cómo funciona el modelo está explicado en el README del backend.

El login es con Auth0 (cuenta de Google o email), y las zonas personales (mis mazos, favoritos, historial, recomendador) van tras rutas protegidas.

## Stack

- **React 18 + TypeScript** con **Vite**
- **Tailwind CSS** para los estilos, con un sistema de diseño propio definido en `tailwind.config.cjs`
- **Motion** para las animaciones de la home y las tarjetas, y **Phosphor** para los iconos
- **Auth0** (`@auth0/auth0-react`) para la autenticación
- **React Router** como SPA, desplegada en **Vercel** (los rewrites están en `frontend/vercel.json`; hay también configuración alternativa para Render estático en `render.yaml`)

## Diseño

La interfaz sigue un estilo "tinta y papel": neutros cálidos, un único color de acento carmesí y tipografías Archivo (títulos), Geist (texto) y Geist Mono (etiquetas y cifras). Los colores de aspecto del juego (Aggression, Justice, Leadership, Protection, Pool) se respetan en toda la web.

- Todas las páginas comparten la misma cabecera (`components/ui/page-header.tsx`), y las tarjetas de mazo la misma clase (`.deck-card`).
- Las cartas se muestran con forma de carta física (`components/ui/game-card.tsx`): marco del color del aspecto, coste e icono según el tipo.
- La home tiene animaciones al hacer scroll. Las ligadas al scroll usan CSS scroll-driven animations y las de entrada, Motion. Solo se anima posición y opacidad, y todo respeta la opción de "reducir movimiento" del sistema.

En `.claude/skills` están las skills de Claude Code que se usaron para el rediseño (especificación de componentes, rendimiento de animaciones, UI/UX y tokens de diseño).

## Ejecutarlo en local

```bash
cd frontend
npm install
npm run dev
```

Se abre en `http://localhost:3000`. Por defecto el frontend apunta al backend desplegado en producción, así que funciona sin configurar nada. Si quieres apuntar a un backend local, crea un `.env.local` en `frontend/` con:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Sobre este repo

Es mi TFG y está publicado como parte de mi portfolio, para que se pueda leer el código. No tiene licencia de uso: todos los derechos reservados. AIForge es un proyecto académico y de fans, sin ánimo de lucro: Marvel Champions y sus cartas son propiedad de sus respectivos dueños, y los datos de cartas se obtienen de la API pública de MarvelCDB.
