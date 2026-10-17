import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useCartStore from '../store/cartStore'

export default function ProductCard({ parfum }) {
  const { addItem } = useCartStore()

  // Check if product or any of its formats is on promotion
  const hasPromo = Boolean(
    parfum.is_promo ||
    parfum.has_promo ||
    parfum.formats?.some(f => f.prix_promo && parseFloat(f.prix_promo) > 0)
  )

  let promoPrice = null
  let originalPrice = null

  if (parfum.is_pack) {
    const mainFmt = parfum.formats?.[0]
    if (mainFmt) {
      originalPrice = parseFloat(mainFmt.prix)
      promoPrice = (mainFmt.prix_promo && parseFloat(mainFmt.prix_promo) > 0)
        ? parseFloat(mainFmt.prix_promo)
        : (parfum.is_promo && parfum.prix_promo ? parseFloat(parfum.prix_promo) : null)
    }
  } else if (parfum.formats && parfum.formats.length > 0) {
    let minEffective = Infinity
    let matchedOriginal = null
    let matchedPromo = null

    for (const f of parfum.formats) {
      const reg = parseFloat(f.prix) || 0
      const p = (f.prix_promo && parseFloat(f.prix_promo) > 0)
        ? parseFloat(f.prix_promo)
        : (parfum.is_promo && parfum.prix_promo ? parseFloat(parfum.prix_promo) : reg)
      if (p < minEffective) {
        minEffective = p
        matchedOriginal = reg
        matchedPromo = (p < reg) ? p : null
      }
    }
    if (minEffective < Infinity) {
      promoPrice = matchedPromo
      originalPrice = matchedOriginal
    }
  }

  // Format price helper
  const formatDH = (num) => {
    if (num === null || num === undefined) return ''
    const val = parseFloat(num)
    if (isNaN(val)) return ''
    return Number.isInteger(val) ? `${val} DH` : `${val.toFixed(2)} DH`
  }

  // Format minimum price fallback
  const prixMin = parfum.prix_min
    ? formatDH(parfum.prix_min)
    : (parfum.formats && parfum.formats.length > 0
        ? formatDH(parfum.formats[0].prix)
        : 'Prix sur demande')

  const defaultFormat = parfum.formats?.find(f => f.type_format === 'flacon_250') || parfum.formats?.[0]

  const handleQuickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Packs require mandatory fragrance selection on the product page
    if (parfum.is_pack) return
    if (defaultFormat) {
      addItem(defaultFormat, parfum, 1)
    }
  }

  const genreLabels = {
    homme: 'Homme',
    femme: 'Femme',
    mixte: 'Mixte',
  }

  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl border border-[#d4e8e3] overflow-hidden shadow-xs hover:shadow-xl hover:border-[#2fb49c]/40 transition-all duration-300 flex flex-col">
      <Link to={`/parfum/${parfum.id}`} className="block relative aspect-square bg-[#f0fbf8] overflow-hidden">
        {parfum.photo_principale ? (
          <img
            src={parfum.photo_principale}
            alt={parfum.nom}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-serif">
            AURA COLLECTION
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
          {hasPromo && (
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-rose-600 text-white shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Promo
            </span>
          )}
          {parfum.is_pack && (
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#0f3d38] text-white shadow-sm border border-[#2fb49c]/30">
              Pack Spécial
            </span>
          )}
          {parfum.genre && (
            <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm backdrop-blur-sm ${
              parfum.genre === 'homme'
                ? 'bg-[#0f3d38] text-white'
                : parfum.genre === 'femme'
                ? 'bg-[#2fb49c] text-white'
                : 'bg-teal-700 text-white'
            }`}>
              {genreLabels[parfum.genre] || parfum.genre}
            </span>
          )}
          {parfum.mis_en_avant && !hasPromo && !parfum.is_pack && (
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#2fb49c] text-white shadow-sm font-semibold">
              Coup de Cœur
            </span>
          )}
        </div>
      </Link>

      {/* Card Info */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5 sm:mb-1">
            {parfum.marque_nom || parfum.marque?.nom || 'AURA COLLECTION'}
          </p>
          <Link to={`/parfum/${parfum.id}`} className="block">
            <h3 className="text-xs sm:text-base font-bold text-[#0f3d38] group-hover:text-[#2fb49c] line-clamp-1 transition-colors">
              {parfum.nom}
            </h3>
          </Link>
          {parfum.is_pack ? (
            <div className="mt-1 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold text-[#2fb49c]">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="line-clamp-1 font-bold">
                {parfum.nom?.includes('4') ? '4 fragrances au choix (250ml)' : '3 fragrances au choix (250ml)'}
              </span>
            </div>
          ) : (
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 line-clamp-1">
              Gel Douche Parfumé • 250 ML
            </p>
          )}
        </div>

        {/* Price & Action */}
        <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0 flex-1">
            {hasPromo && promoPrice ? (
              <div>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-rose-500 block font-bold leading-none mb-0.5">
                  Prix Promo
                </span>
                <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-base font-extrabold text-rose-600 whitespace-nowrap">
                    {formatDH(promoPrice)}
                  </span>
                  {originalPrice && (
                    <span className="text-[10px] sm:text-xs text-gray-400 line-through whitespace-nowrap">
                      {formatDH(originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 block font-medium leading-none mb-0.5">
                  {parfum.is_pack ? 'Tarif pack' : 'Prix unitaire'}
                </span>
                <span className="text-xs sm:text-base font-extrabold text-[#0f3d38] whitespace-nowrap">
                  {prixMin}
                </span>
              </div>
            )}
          </div>

          {parfum.is_pack ? (
            <Link
              to={`/parfum/${parfum.id}`}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#0f3d38] hover:bg-[#2fb49c] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-1 sm:gap-1.5 shadow-xs shrink-0 cursor-pointer"
              title="Choisir mes gels et composer le pack"
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Composer</span>
            </Link>
          ) : defaultFormat ? (
            <button
              type="button"
              onClick={handleQuickAdd}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#0f3d38] hover:bg-[#2fb49c] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-1 sm:gap-1.5 shadow-xs cursor-pointer shrink-0"
              title="Ajouter au panier"
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Ajouter</span>
            </button>
          ) : (
            <Link
              to={`/parfum/${parfum.id}`}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#f0fbf8] hover:bg-[#2fb49c] text-[#0f3d38] hover:text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-colors shrink-0"
            >
              Voir
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
