import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { catalogAPI } from '../api/client'
import ProductCard from '../components/ProductCard'

export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [parfums, setParfums] = useState([])
  const [marques, setMarques] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const collection = searchParams.get('collection') || ''
  const genre = searchParams.get('genre') || ''
  const famille = searchParams.get('famille') || ''
  const marque = searchParams.get('marque') || ''
  const search = searchParams.get('search') || ''
  const ordering = searchParams.get('ordering') || '-created_at'
  const page = parseInt(searchParams.get('page')) || 1

  useEffect(() => {
    setLoading(true)
    const pageSize = 60
    const params = { page, ordering, page_size: pageSize }
    if (collection) params.collection = collection
    else if (genre) params.genre = genre

    if (famille) params.famille_olfactive = famille
    if (marque) params.marque = marque
    if (search) params.search = search

    Promise.all([
      catalogAPI.getParfums(params),
      catalogAPI.getMarques(),
    ])
      .then(([pRes, mRes]) => {
        const rawList = pRes.data.results || pRes.data || []
        const activeList = Array.isArray(rawList) ? rawList.filter((p) => p.actif !== false) : []
        setParfums(activeList)
        setTotalCount(pRes.data.count || activeList.length || 0)
        setMarques(mRes.data.results || mRes.data || [])
      })
      .catch((err) => console.error('Error fetching catalogue:', err))
      .finally(() => setLoading(false))
  }, [collection, genre, famille, marque, search, ordering, page])

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    setSearchParams(params)
  }

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const totalPages = Math.ceil(totalCount / 60)

  // Collections AURA
  const quickCollections = [
    { label: 'Tous les produits', slug: '' },
    { label: 'Gel Parfum Homme', slug: 'gel-parfum-homme' },
    { label: 'Gel Parfum Femme', slug: 'gel-parfum-femme' },
    { label: 'Packs Spéciaux', slug: 'packs-speciaux' },
    { label: 'Promotions', slug: 'promotions' },
  ]

  const sortOptions = [
    { value: '-created_at', label: 'Plus récents' },
    { value: 'nom', label: 'Alphabétique, de A à Z' },
    { value: '-nom', label: 'Alphabétique, de Z à A' },
    { value: 'prix_min', label: 'Prix: faible à élevé' },
    { value: '-prix_min', label: 'Prix: élevé à faible' },
  ]

  const isQuickActive = (c) => {
    if (!c.slug) return !collection && !genre
    if (c.slug === 'gel-parfum-homme' || c.slug === 'parfums-homme') {
      return collection === 'gel-parfum-homme' || collection === 'parfums-homme' || genre === 'homme'
    }
    if (c.slug === 'gel-parfum-femme' || c.slug === 'parfums-femme') {
      return collection === 'gel-parfum-femme' || collection === 'parfums-femme' || genre === 'femme'
    }
    return collection === c.slug
  }

  return (
    <div className="min-h-screen bg-[#f4faf8] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#d4e8e3] pb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f3d38] uppercase tracking-wider font-sans">
                Catalogue AURA
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-widest mt-1">
                {totalCount} {totalCount > 1 ? 'produits disponibles' : 'produit disponible'} • Gels Douche Parfumés & Packs
              </p>
            </div>

            {/* Quick search input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Rechercher un gel douche..."
                value={search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#d4e8e3] rounded-full text-xs text-[#0f3d38] placeholder-gray-400 focus:outline-hidden focus:border-[#2fb49c] shadow-xs"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button
                  onClick={() => updateFilter('search', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Quick Collection Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
            {quickCollections.map((c, i) => (
              <button
                key={i}
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  if (c.slug) {
                    params.set('collection', c.slug)
                  } else {
                    params.delete('collection')
                  }
                  params.delete('genre')
                  params.delete('page')
                  setSearchParams(params)
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 whitespace-nowrap shadow-xs cursor-pointer ${
                  isQuickActive(c)
                    ? 'bg-[#0f3d38] text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-[#f0fbf8] hover:text-[#0f3d38] border border-[#d4e8e3]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Secondary Filter & Sort Bar */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mt-2">
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
              {/* Marque Selector */}
              <select
                value={marque}
                onChange={(e) => updateFilter('marque', e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 bg-[#eff0f5] border border-gray-200 rounded-xl text-xs font-semibold text-[#0f3d38] focus:outline-hidden"
              >
                <option value="">Toutes les marques</option>
                {marques.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>

              {/* Famille Olfactive Selector */}
              <select
                value={famille}
                onChange={(e) => updateFilter('famille', e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 bg-[#eff0f5] border border-gray-200 rounded-xl text-xs font-semibold text-[#0f3d38] focus:outline-hidden"
              >
                <option value="">Toutes les familles olfactives</option>
                <option value="boisee">Boisée</option>
                <option value="florale">Florale</option>
                <option value="orientale">Orientale</option>
                <option value="fraiche">Fraîche</option>
                <option value="aromatique">Aromatique</option>
                <option value="gourmande">Gourmande</option>
                <option value="chypree">Chyprée</option>
                <option value="fougere">Fougère</option>
                <option value="cuiree">Cuirée</option>
                <option value="musquee">Musquée</option>
              </select>

              {(collection || genre || famille || marque || search) && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-red-600 hover:underline font-semibold cursor-pointer text-left sm:text-center py-1"
                >
                  ✕ Réinitialiser les filtres
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center justify-between sm:justify-start gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
              <span className="text-[11px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider shrink-0">Trier par:</span>
              <select
                value={ordering}
                onChange={(e) => updateFilter('ordering', e.target.value)}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-[#eff0f5] border border-gray-200 rounded-xl text-xs font-semibold text-[#0f3d38] focus:outline-hidden"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse space-y-3">
                <div className="aspect-square bg-gray-100 rounded-xl" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : parfums.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#eff0f5] flex items-center justify-center mx-auto mb-4 text-[#0f3d38]">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold uppercase text-[#0f3d38] mb-2">Aucun parfum trouvé</h3>
            <p className="text-xs text-gray-500 mb-6">
              Aucun produit ne correspond aux filtres appliqués.
            </p>
            <button onClick={clearAllFilters} className="btn-luxury px-6 py-2.5 text-xs">
              Voir tous les parfums
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {parfums.map((parfum) => (
              <ProductCard key={parfum.id} parfum={parfum} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              disabled={page <= 1}
              onClick={() => updateFilter('page', page - 1)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-[#0f3d38] disabled:opacity-30 hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Précédent
            </button>
            <span className="text-xs font-semibold text-gray-600 px-3">
              Page {page} sur {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => updateFilter('page', page + 1)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-[#0f3d38] disabled:opacity-30 hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
