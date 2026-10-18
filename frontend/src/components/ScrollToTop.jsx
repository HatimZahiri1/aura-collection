import { useLayoutEffect, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * ScrollToTop :
 * Réinitialise systématiquement et immédiatement le défilement au sommet de la page (0, 0),
 * dès le niveau de la barre de navigation (navbar), lors de tout changement de page
 * ou de navigation (mobile, tablette, PC portable, ordinateur de bureau).
 */
export default function ScrollToTop() {
  const location = useLocation()
  const { pathname, search, hash, key } = location

  useIsomorphicLayoutEffect(() => {
    // Forcer le navigateur à ne jamais restaurer une ancienne position de scroll
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    // Si une ancre spécifique (#mon-ancre) est fournie dans l'URL
    if (hash) {
      const targetId = hash.replace('#', '')
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }

    const scrollToTopForce = () => {
      try {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant',
        })
      } catch {
        window.scrollTo(0, 0)
      }

      if (document.documentElement) {
        document.documentElement.scrollTop = 0
      }
      if (document.body) {
        document.body.scrollTop = 0
      }
      const root = document.getElementById('root')
      if (root) {
        root.scrollTop = 0
      }
    }

    // 1. Exécution synchrone immédiate avant le rendu visuel
    scrollToTopForce()

    // 2. Exécution au frame d'animation suivant
    const rafId = requestAnimationFrame(scrollToTopForce)

    // 3. Délais de sécurité (10ms, 50ms, 150ms) pour contrer le layout shift et le chargement d'images
    const t1 = setTimeout(scrollToTopForce, 10)
    const t2 = setTimeout(scrollToTopForce, 50)
    const t3 = setTimeout(scrollToTopForce, 150)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [pathname, search, hash, key])

  // Écouteur global pour les événements personnalisés de reset scroll (ex: validation de commande)
  useEffect(() => {
    const handleCustomScrollReset = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      } catch {
        window.scrollTo(0, 0)
      }
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
      const root = document.getElementById('root')
      if (root) root.scrollTop = 0
    }

    window.addEventListener('aura:scroll-to-top', handleCustomScrollReset)
    return () => {
      window.removeEventListener('aura:scroll-to-top', handleCustomScrollReset)
    }
  }, [])

  return null
}

