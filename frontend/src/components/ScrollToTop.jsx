import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop :
 * Réinitialise automatiquement le défilement au sommet de la page (en haut à 0)
 * lors de chaque navigation ou changement de page.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    // 1. Défilement instantané tout en haut
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      })
    } catch {
      window.scrollTo(0, 0)
    }

    // 2. Réinitialisation des conteneurs racine
    if (document.documentElement) {
      document.documentElement.scrollTop = 0
    }
    if (document.body) {
      document.body.scrollTop = 0
    }

    // 3. Sécurité au tick suivant pour s'assurer qu'aucun décalage n'intervient après le montage du composant
    const timer = setTimeout(() => {
      window.scrollTo(0, 0)
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
    }, 0)

    return () => clearTimeout(timer)
  }, [pathname, search])

  return null
}
