import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import DecksPage from './pages/DecksPage'
import MyDecksPage from './pages/MyDecksPage'
import CreateDeckPage from './pages/CreateDeckPage'
import CardsPage from './pages/CardsPage'
import SetCardsPage from './pages/SetCardsPage'
import CardSearchPage from './pages/CardSearchPage'
import FAQPage from './pages/FAQPage'
import ProfilePage from './pages/ProfilePage'
import { AuthProvider } from './contexts/AuthContext'
import DeckDetailPage from './pages/DeckDetailPage'
import EditDeckPage from './pages/EditDeckPage'
import ConfigureGamePage from './pages/ConfigureGamePage'
import FavoritesPage from './pages/FavoritesPage'
import GamesHistoryPage from './pages/GamesHistoryPage'
import AIRecommendationPage from './pages/AIRecommendationPage'
import AddGamePage from './pages/AddGamePage'
import NotFoundPage from './pages/NotFoundPage'
import InfoPage from './pages/InfoPage'

function App() {
  return (
    <AuthProvider>
    <Layout>
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
    </Layout>
    </AuthProvider>
  )
}

export default App
