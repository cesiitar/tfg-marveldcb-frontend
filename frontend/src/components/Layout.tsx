import React from 'react'
import { LazyMotion, domAnimation } from 'motion/react'
import Header from './Header'
import Footer from './Footer'
import CookieConsent from './CookieConsent'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LazyMotion features={domAnimation} strict>
    <div className="min-h-[100dvh] flex flex-col bg-paper overflow-x-clip">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-ink-900 focus:shadow-lg"
      >
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        {children}
      </main>
      <Footer />
      <CookieConsent />
    </div>
    </LazyMotion>
  )
}

export default Layout
