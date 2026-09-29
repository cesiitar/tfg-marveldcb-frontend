import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import { AuthProvider } from './contexts/AuthContext'

// Cada página se descarga al visitarla (la home va en el bundle principal).
const DecksPage = lazy(() => import('./pages/DecksPage'))
const MyDecksPage = lazy(() => import('./pages/MyDecksPage'))
const CreateDeckPage = lazy(() => import('./pages/CreateDeckPage'))
const CardsPage = lazy(() => import('./pages/CardsPage'))
const SetCardsPage = lazy(() => import('./pages/SetCardsPage'))
const CardSearchPage = lazy(() => import('./pages/CardSearchPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const DeckDetailPage = lazy(() => import('./pages/DeckDetailPage'))
const EditDeckPage = lazy(() => import('./pages/EditDeckPage'))
const ConfigureGamePage = lazy(() => import('./pages/ConfigureGamePage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const GamesHistoryPage = lazy(() => import('./pages/GamesHistoryPage'))
const AIRecommendationPage = lazy(() => import('./pages/AIRecommendationPage'))
const AddGamePage = lazy(() => import('./pages/AddGamePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const InfoPage = lazy(() => import('./pages/InfoPage'))

function App() {
  return (
    <AuthProvider>
    <Layout>
      <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      {/* Si añades una ruta, añádela también a "rewrites" en vercel.json (el resto da 404). */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/decks" element={<DecksPage />} />
              <Route path="/decks/:id" element={<DeckDetailPage />} />
              <Route
                path="/decks/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditDeckPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mydecks"
                element={
                  <ProtectedRoute>
                    <MyDecksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-deck"
                element={
                  <ProtectedRoute>
                    <CreateDeckPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configure-game"
                element={
                  <ProtectedRoute>
                    <ConfigureGamePage />
                  </ProtectedRoute>
                }
              />
        <Route path="/add-game" element={<AddGamePage />} />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/games-history" element={<GamesHistoryPage />} />
              <Route
                path="/ai-recommendation"
                element={
                  <ProtectedRoute>
                    <AIRecommendationPage />
                  </ProtectedRoute>
                }
              />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/cards/set/:setId" element={<SetCardsPage />} />
        <Route path="/cards/search" element={<CardSearchPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/about" element={<InfoPage key="about" page="about" />} />
        <Route path="/privacy" element={<InfoPage key="privacy" page="privacy" />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </Layout>
    </AuthProvider>
  )
}

export default App
