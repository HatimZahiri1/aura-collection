import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useCartStore from '../store/cartStore'
import { catalogAPI } from '../api/client'

export default function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allParfums, setAllParfums] = useState([])
  const searchInputRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { count, openDrawer } = useCartStore()

  useEffect(() => {
    setSearchOpen(false)
    setSidebarOpen(false)
  }, [location.pathname, location.search])

  // Lock background scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  // Charger les parfums pour la recherche instantanée dès que la recherche est ouverte ou au montage
  useEffect(() => {
    catalogAPI.getParfums()
      .then((res) => {
        const list = res.data.results || res.data || []
        setAllParfums(list)
      })
      .catch(() => {})
  }, [searchOpen])

  // Focus automatique sur l'input de recherche à l'ouverture
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [searchOpen])

  // Résultats filtrés en direct selon la saisie
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return allParfums.filter((p) => {
      const matchNom = p.nom?.toLowerCase().includes(q)
      const matchGenre = p.genre?.toLowerCase().includes(q)
      const matchMarque = p.marque_nom?.toLowerCase().includes(q)
      const matchFamille = p.famille_olfactive?.toLowerCase().includes(q)
      const matchDesc = p.description?.toLowerCase().includes(q)
      const isPack = q.includes('pack') && p.is_pack
      return matchNom || matchGenre || matchMarque || matchFamille || matchDesc || isPack
    }).slice(0, 6)
  }, [allParfums, searchQuery])

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Catalogue', path: '/catalogue' },
    { name: 'Contact', path: '/contact' },
  ]

  const [navbarCollections, setNavbarCollections] = useState(null)

  useEffect(() => {
    catalogAPI.getCollections()
      .then((res) => {
        const list = res.data.results || res.data || []
        if (Array.isArray(list)) {
          const activeOnly = list.filter((c) => c.actif === true)
          setNavbarCollections(activeOnly)
        }
      })
      .catch(() => {})
  }, [])

  const categoryShortcuts = useMemo(() => {
    if (navbarCollections !== null) {
      return navbarCollections.map((col) => ({
        name: col.nom,
        path: `/catalogue?collection=${col.slug}`,
        highlight: col.slug === 'packs-speciaux',
      }))
    }
    return [
      { name: 'Pack Spécial (3 ou 4 Gels)', path: '/catalogue?collection=packs-speciaux', highlight: true },
      { name: 'Gel Parfum Homme', path: '/catalogue?collection=gel-parfum-homme' },
      { name: 'Gel Parfum Femme', path: '/catalogue?collection=gel-parfum-femme' },
    ]
  }, [navbarCollections])

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' && !location.search
    if (path.includes('?')) {
      const [pPath, pQuery] = path.split('?')
      return location.pathname === pPath && location.search.includes(pQuery)
    }
    if (path === '/catalogue') {
      return location.pathname === '/catalogue' && !location.search
    }
    return location.pathname.startsWith(path)
  }

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/catalogue?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
    }
  }

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-[#0f3d38] border-b border-[#15534c] text-center py-2 px-3">
        <p className="text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest text-[#a8f0e6] uppercase line-clamp-1">
          L'ÉLÉGANCE DES GRANDS PARFUMS • 0% SULFATES 0% PARABÈNES • LIVRAISON PARTOUT AU MAROC
        </p>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Header Row: Hamburger (Mobile) / Spacer (Desktop) | Logo au Centre | Recherche & Panier à Droite */}
          <div className="relative flex items-center justify-between min-h-[72px] sm:min-h-[96px] md:min-h-[108px] py-2 sm:py-3">
            {/* Gauche : Bouton Hamburger pour mobile & tablette (< md) */}
            <div className="w-16 sm:w-24 flex items-center justify-start">
              <button
                id="mobile-menu-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSidebarOpen(true)
                }}
                className="p-2 sm:p-2.5 text-[#0f3d38] hover:text-[#2fb49c] active:bg-gray-100 rounded-full transition-all md:hidden cursor-pointer touch-manipulation flex items-center justify-center"
                aria-label="Ouvrir le menu de navigation"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {/* Espace vide pour équilibrer sur grand écran (>= md) */}
              <div className="hidden md:block w-full" />
            </div>

            {/* Centre : Logo officiel AURA COLLECTION sous forme d'un CERCLE médaillon */}
            <div className="flex justify-center items-center">
              <Link to="/" className="flex flex-col items-center justify-center group py-0.5">
                <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-26 md:h-26 rounded-full overflow-hidden p-0.5 border-2 border-[#0f3d38]/20 shadow-md bg-[#68ccc2] group-hover:scale-105 group-hover:border-[#0f3d38] group-hover:shadow-lg transition-all duration-300">
                  <img
                    src="/logo-aura.jpeg"
                    alt="AURA COLLECTION - Gel Douche Parfumé"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </Link>
            </div>

            {/* Droite : Recherche et Panier */}
            <div className="w-16 sm:w-24 flex items-center justify-end gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2 transition-all rounded-full cursor-pointer touch-manipulation ${
                  searchOpen ? 'bg-[#0f3d38] text-white shadow-xs' : 'text-[#0f3d38] hover:text-[#2fb49c] hover:bg-gray-100/70'
                }`}
                aria-label="Recherche"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={openDrawer}
                className="p-2 text-[#0f3d38] hover:text-[#2fb49c] hover:bg-gray-100/70 transition-all relative rounded-full cursor-pointer touch-manipulation"
                aria-label="Panier"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#0f3d38] text-white text-[11px] font-extrabold rounded-full flex items-center justify-center animate-scale-in shadow-md">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Ligne 2 : Liens de navigation uniquement sur DESKTOP (md:flex) */}
          <nav className="hidden md:flex items-center justify-center gap-8 lg:gap-10 py-3 border-t border-gray-100">
            {navLinks.map((link) => {
              const active = isActive(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-xs md:text-sm tracking-wider uppercase font-bold transition-all relative px-4 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                    active
                      ? 'bg-[#0f3d38] text-white shadow-xs'
                      : 'text-[#0f3d38] hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Ligne 3 : Barre animée défilante continue (Marquee) AURA COLLECTION */}
        <div className="w-full bg-[#0f3d38] text-white py-1.5 sm:py-2 overflow-hidden border-t border-b border-[#1b5e54] shadow-inner select-none">
          <div className="luxury-marquee-track flex items-center gap-6 sm:gap-8 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-gray-200">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-6 sm:gap-8 whitespace-nowrap">
                <span>GEL DOUCHE PARFUMÉ DE LUXE</span>
                <svg className="w-2.5 h-2.5 text-[#2fb49c] shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
                <span>0% SULFATES • 0% PARABÈNES</span>
                <svg className="w-2.5 h-2.5 text-[#2fb49c] shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
                <span className="text-[#8eead1] font-bold">AURA COLLECTION</span>
                <svg className="w-2.5 h-2.5 text-[#2fb49c] shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
                <span>LIVRAISON PARTOUT AU MAROC</span>
                <svg className="w-2.5 h-2.5 text-[#2fb49c] shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Dropdown de recherche intelligente avec résultats en direct */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-100 bg-[#f8faf9] shadow-inner overflow-visible relative z-30"
            >
              <div className="max-w-2xl mx-auto px-4 py-3 sm:py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-[#0f3d38] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2fb49c] animate-pulse" />
                    Recherche d'un gel douche parfumé
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false)
                      setSearchQuery('')
                    }}
                    className="text-[11px] text-gray-400 hover:text-gray-700 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Fermer ✕
                  </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tapez un parfum (ex: Bleu de Chanel, Mademoiselle, Pack...)"
                    className="w-full pl-11 pr-24 py-3 bg-white border border-gray-200 rounded-full text-xs sm:text-sm text-[#0f3d38] placeholder-gray-400 focus:outline-none focus:border-[#0f3d38] shadow-sm"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#0f3d38] text-white text-xs font-bold uppercase rounded-full hover:bg-black transition-colors cursor-pointer"
                  >
                    Chercher
                  </button>
                </form>

                {/* Suggestions rapides si la recherche est vide */}
                {!searchQuery.trim() && (
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Suggestions :</span>
                    {['Bleu de Chanel', 'Mademoiselle', "J'adore", 'My Way', 'Packs Spéciaux'].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setSearchQuery(sug)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[#0f3d38] hover:border-[#2fb49c] hover:bg-[#f0fbf8] transition-all cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}

                {/* Résultats en direct (Autocomplete live search) */}
                {searchQuery.trim() && (
                  <div className="mt-3 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
                    {searchResults.length > 0 ? (
                      <>
                        <div className="p-2.5 bg-gray-50/90 px-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {searchResults.length} produit{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                          </span>
                          <span className="text-[10px] text-gray-400">Cliquez pour voir la fiche</span>
                        </div>
                        {searchResults.map((parfum) => {
                          const prix = parfum.is_promo && parfum.prix_promo ? parfum.prix_promo : (parfum.prix_min || parfum.formats?.[0]?.prix || '89')
                          return (
                            <Link
                              key={parfum.id}
                              to={`/parfum/${parfum.id}`}
                              onClick={() => {
                                setSearchOpen(false)
                                setSearchQuery('')
                              }}
                              className="flex items-center gap-3 p-3 hover:bg-[#f0fbf8] transition-colors group cursor-pointer"
                            >
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                                {parfum.photo_principale ? (
                                  <img src={parfum.photo_principale} alt={parfum.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-serif">AURA</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-[#0f3d38] truncate group-hover:text-[#2fb49c] transition-colors">
                                  {parfum.nom}
                                </h4>
                                <p className="text-[10px] text-gray-500 capitalize">
                                  {parfum.is_pack ? 'Pack Spécial • Flacons 250ml' : `Gel Douche 250ml • ${parfum.genre}`}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-black text-[#0f3d38]">
                                  {parseFloat(prix).toFixed(0)} DH
                                </span>
                                {parfum.is_promo && (
                                  <span className="block text-[9px] font-bold text-rose-600 uppercase">Promo</span>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                        <div className="p-2.5 bg-gray-50 text-center border-t border-gray-100">
                          <button
                            type="button"
                            onClick={handleSearchSubmit}
                            className="text-xs font-bold text-[#0f3d38] hover:underline uppercase tracking-wider cursor-pointer"
                          >
                            Voir tous les résultats pour « {searchQuery} » →
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-8 px-4 text-center">
                        <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs font-bold text-gray-600">
                          Aucun parfum ne correspond à « <span className="text-[#0f3d38] font-extrabold">{searchQuery}</span> »
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Vérifiez l'orthographe ou parcourez nos collections dans le catalogue.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ======================================================== */}
      {/* SIDEBAR MOBILE DRAWER (Slide-over depuis la gauche)     */}
      {/* ======================================================== */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            {/* Backdrop sombre flouté */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
              aria-hidden="true"
            />

            {/* Panneau latéral Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-[85%] max-w-[320px] h-full bg-white z-[110] shadow-2xl flex flex-col overflow-hidden"
              role="dialog"
              aria-label="Menu principal"
            >
              {/* En-tête de la Sidebar */}
              <div className="p-4 bg-gradient-to-r from-[#082522] to-[#0f3d38] text-white flex items-center justify-between border-b border-[#1b5e54]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2fb49c]/40 bg-[#68ccc2] shrink-0">
                    <img src="/logo-aura.jpeg" alt="AURA" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black tracking-widest uppercase text-white font-serif">
                      AURA COLLECTION
                    </h2>
                    <p className="text-[10px] text-[#8eead1] uppercase tracking-wider">
                      Gels Douche Parfumés
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer touch-manipulation"
                  aria-label="Fermer le menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Corps déroulant de la Sidebar */}
              <div className="flex-1 overflow-y-auto px-4 py-5 divide-y divide-gray-100">
                {/* 1. Navigation Principale */}
                <div className="space-y-1 pb-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-2">
                    Navigation
                  </p>
                  {navLinks.map((link) => {
                    const active = isActive(link.path)
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                          active
                            ? 'bg-[#0f3d38] text-white shadow-xs'
                            : 'text-[#0f3d38] hover:bg-[#f0fbf8] active:bg-[#e6f7f3]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {link.path === '/' && (
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          )}
                          {link.path === '/catalogue' && (
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          )}
                          {link.path === '/contact' && (
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          )}
                          <span>{link.name}</span>
                        </div>
                        <svg className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )
                  })}
                </div>

                {/* 2. Raccourcis Collections & Packs */}
                <div className="space-y-1 py-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-2">
                    Nos Offres
                  </p>
                  {categoryShortcuts.map((cat) => (
                    <Link
                      key={cat.path}
                      to={cat.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                        cat.highlight
                          ? 'bg-emerald-50 text-[#0f3d38] border border-emerald-200 font-bold'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-[#f0fbf8]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {cat.highlight ? (
                          <svg className="w-4 h-4 text-emerald-600 shrink-0 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2fb49c]" />
                        )}
                        <span>{cat.name}</span>
                      </div>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>

                {/* 3. Contact Direct WhatsApp & Instagram */}
                <div className="pt-5 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1">
                    Service Client & Réseaux
                  </p>
                  
                  {/* Bouton WhatsApp direct */}
                  <a
                    href="https://wa.me/212651470308?text=Bonjour%20AURA%20COLLECTION,%20j'aimerais%20passer%20une%20commande%20ou%20avoir%20des%20renseignements"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 w-full p-3 bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1da851] text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer touch-manipulation"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                    </svg>
                    <span>Commander sur WhatsApp</span>
                  </a>

                  {/* Bouton Instagram */}
                  <a
                    href="https://www.instagram.com/maison.aura.collection?rpxt=OWVpeHhzdm40cWp5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 w-full p-3 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] active:opacity-90 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer touch-manipulation"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span>Suivre sur Instagram</span>
                  </a>
                </div>
              </div>

              {/* Pied de la Sidebar : Engagements qualité */}
              <div className="p-4 bg-[#f4faf8] border-t border-gray-100 text-[10px] text-gray-500 space-y-1.5">
                <div className="flex items-center gap-2 font-medium text-[#0f3d38]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2fb49c]" />
                  <span>0% Sulfates • 0% Parabènes</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-[#0f3d38]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2fb49c]" />
                  <span>Paiement à la livraison au Maroc</span>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
