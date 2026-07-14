# AIForge — Frontend

Frontend de **AIForge**, mi Trabajo de Fin de Grado: una plataforma web para crear, compartir y optimizar mazos de Marvel Champions (el juego de cartas cooperativo) usando machine learning. Este repo es la interfaz; la API y el modelo de IA viven en [tfg-marveldcb-backend](https://github.com/cesiitar/tfg-marveldcb-backend).

En producción: https://aiforge-decks.vercel.app

## Qué se puede hacer

- **Explorar la colección completa de cartas** del juego, organizada por sets, con búsqueda y filtros. Los datos vienen de la API pública de [MarvelCDB](https://marvelcdb.com).
- **Crear mazos** desde cero eligiendo héroe y aspecto, carta a carta, o **importarlos directamente desde MarvelCDB** pegando el enlace del mazo.
- **Comunidad**: ver los mazos publicados por otros usuarios, comentarlos y guardarlos como favoritos.
- **Registrar partidas** (héroe y mazo contra qué villano, en qué dificultad, y el resultado) y consultar el historial y las estadísticas propias.
- **Recomendación con IA**: la funcionalidad central del TFG. Eliges villano y dificultad, y el modelo — entrenado con las partidas registradas por los usuarios — estima la probabilidad de victoria y genera un mazo optimizado para ese enfrentamiento concreto. El detalle de cómo funciona el modelo está explicado en el README del backend.

El login es con Auth0 (cuenta de Google o email), y las zonas personales (mis mazos, favoritos, historial, recomendador) van tras rutas protegidas.

## Stack

- **React 18 + TypeScript** con **Vite**
- **Tailwind CSS** para los estilos
- **Auth0** (`@auth0/auth0-react`) para la autenticación
- **React Router** como SPA, desplegada en **Vercel** (los rewrites están en `frontend/vercel.json`; hay también configuración alternativa para Render estático en `render.yaml`)

## Ejecutarlo en local

```bash
cd frontend
npm install
npm run dev
```

Por defecto el frontend apunta al backend desplegado en producción, así que funciona sin configurar nada. Si quieres apuntar a un backend local, crea un `.env` en `frontend/` con:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Sobre este repo

Es mi TFG y está publicado como parte de mi portfolio, para que se pueda leer el código. No tiene licencia de uso: todos los derechos reservados. AIForge es un proyecto académico y de fans, sin ánimo de lucro: Marvel Champions y sus cartas son propiedad de sus respectivos dueños, y los datos de cartas se obtienen de la API pública de MarvelCDB.
