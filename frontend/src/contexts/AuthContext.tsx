import React, { createContext, useContext, ReactNode, useEffect } from 'react'
import { useAuth0, User } from '@auth0/auth0-react'

interface AuthContextType {
  user: User | undefined
  isAuthenticated: boolean
  isLoading: boolean
  loginWithRedirect: () => void
  logout: () => void
  getAccessTokenSilently: () => Promise<string>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently
  } = useAuth0()

  // Función para sincronizar usuario con el backend
  const syncUser = async (user: User) => {
    try {
      const response = await fetch('http://localhost:8000/api/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0_id: user.sub,
          email: user.email,
          name: user.name,
          picture: user.picture
        })
      });
      
      if (response.ok) {
        console.log('Usuario sincronizado correctamente');
      } else {
        console.error('Error sincronizando usuario:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Sincronizar usuario cuando se autentica
  useEffect(() => {
    if (isAuthenticated && user) {
      syncUser(user);
    }
  }, [isAuthenticated, user]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
