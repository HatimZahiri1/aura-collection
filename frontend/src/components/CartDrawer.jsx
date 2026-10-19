import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useCartStore from '../store/cartStore'

export default function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem, updateQuantity, total, subtotal, bundleDiscount, count } = useCartStore()
  const navigate = useNavigate()

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeDrawer()
    }
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDrawerOpen, closeDrawer])

  const formatLabels = new Proxy({
    decant_5: 'Format 5ml',
    decant_10: 'Pack Spécial',
    complet: 'Gel Douche 250ml',
    flacon_250: 'Gel Douche 250ml',
    pack_2: 'Pack Spécial (2 Gels Parfumés)',
    pack_3: 'Pack Spécial (3 Gels Parfumés)',
    pack_4: 'Pack Spécial (4 Gels Parfumés)',
    pack_5: 'Pack Spécial (5 Gels Parfumés)',
    pack_6: 'Pack Spécial (6 Gels Parfumés)',
  }, {
    get(target, prop) {
      if (typeof prop === 'string') {
        if (target[prop]) return target[prop]
        const match = prop.match(/pack_(\d+)/i)
        if (match) return `Pack Spécial (${match[1]} Gels Parfumés)`
      }
      return target[prop] || 'Gel Douche 250ml'
    }
  })

  const hasOutOfStockItems = items.some(item => 
    (item.format?.stock !== undefined && item.format?.stock !== null && item.format.stock <= 0) ||
    (item.format?.stock !== undefined && item.format?.stock !== null && item.quantity > item.format.stock)
  )

  const handleCheckout = () => {
    if (hasOutOfStockItems) return
    closeDrawer()
    navigate('/checkout')
  }

  const handleWhatsAppOrder = () => {
    if (hasOutOfStockItems) return
    const lines = items.map(
      (item) => {
        let label = `- ${item.parfum.nom} (${formatLabels[item.format.type_format] || item.format.type_format}) x${item.quantity} = ${(item.format.prix * item.quantity).toFixed(2)} dh`
        if (item.selectedFragrances?.length > 0) {
          label += `\n  Fragrances : ${item.selectedFragrances.join(', ')}`
        }
        return label
      }
    )
    let message = `Bonjour AURA COLLECTION, je souhaite commander :\n\n${lines.join('\n')}`
    if (bundleDiscount.hasDiscount) {
      message += `\n\n*Remise Pack automatique :* -${bundleDiscount.discount.toFixed(0)} DH`
    }
    message += `\n\n*Total : ${total.toFixed(2)} DH*`
    window.open(`https://wa.me/212651470308?text=${encodeURIComponent(message)}`, '_blank')
  }

  const getItemKey = (item) => item.itemKey || item.format.id

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#0f3d38]">
                Votre panier {count > 0 && `(${count})`}
              </h2>
              <button
                onClick={closeDrawer}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#eff0f5] flex items-center justify-center mb-4 text-[#0f3d38]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#0f3d38] mb-2 uppercase tracking-wide">
                  Votre panier est vide
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Découvrez nos gels douche parfumés 250ml et packs spéciaux.
                </p>
                <button
                  onClick={() => {
                    closeDrawer()
                    navigate('/catalogue')
                  }}
                  className="px-6 py-3 bg-[#0f3d38] text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-black transition-all shadow-md"
                >
                  Continuer les achats
                </button>
              </div>
            ) : (
              <>
                {/* Shipping info banner */}
                <div className="px-6 py-2.5 bg-[#eff0f5] border-b border-gray-100 text-xs text-[#0f3d38] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#0f3d38] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span className="font-medium text-[11px]">
                      Livraison : <strong className="text-emerald-700">Gratuite à Casablanca</strong> • 20 DH autres villes
                    </span>
                  </div>
                </div>

                {/* Bundle Discount Badge */}
                {bundleDiscount?.badgeText && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-6 mt-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm"
                  >
                    <p className="text-xs font-bold text-emerald-800 leading-relaxed flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                      </svg>
                      <span>{bundleDiscount.badgeText}</span>
                    </p>
                    {bundleDiscount.appliedBundles?.length > 0 && (
                      <p className="text-[10px] text-emerald-600 mt-1 pl-5">
                        {bundleDiscount.appliedBundles.join(' • ')}
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Next Tier Nudge */}
                {bundleDiscount?.nextTierMessage && (
                  <div className="mx-6 mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{bundleDiscount.nextTierMessage}</span>
                  </div>
                )}

                {/* Items List */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100 px-6">
                  {items.map((item) => {
                    const key = getItemKey(item)
                    return (
                      <div key={key} className="py-4 flex gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-[#eff0f5] rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                          {item.parfum.photo_principale ? (
                            <img
                              src={item.parfum.photo_principale}
                              alt={item.parfum.nom}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              Parfum
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                                  {item.parfum.marque_nom}
                                </p>
                                <h4 className="text-sm font-bold text-gray-900 truncate">
                                  {item.parfum.nom}
                                </h4>
                              </div>
                              <button
                                onClick={() => removeItem(key)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                aria-label="Supprimer"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            <span className="inline-block mt-1 text-[11px] font-medium bg-[#eff0f5] text-[#0f3d38] px-2 py-0.5 rounded">
                              {formatLabels[item.format.type_format] || item.format.type_format}
                            </span>

                            {/* Selected Fragrances for packs */}
                            {item.selectedFragrances?.length > 0 && (
                              <div className="mt-2 p-2 rounded-xl bg-[#f0fbf8] border border-[#d4e8e3]">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#0f3d38] block mb-1">
                                  Flacons inclus ({item.selectedFragrances.length}) :
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {item.selectedFragrances.map((frag, idx) => (
                                    <span key={idx} className="text-[9px] font-bold bg-white text-[#0f3d38] border border-[#2fb49c]/40 px-2 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1">
                                      <span className="w-3.5 h-3.5 rounded-full bg-[#0f3d38] text-white text-[8px] flex items-center justify-center font-bold">
                                        {idx + 1}
                                      </span>
                                      <span>{frag}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Quantity and Price */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="space-y-1">
                              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                                <button
                                  onClick={() => updateQuantity(key, item.quantity - 1)}
                                  className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm cursor-pointer"
                                  aria-label="Diminuer"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-xs font-bold text-gray-800">
                                  {item.quantity}
                                </span>
                                <button
                                  disabled={item.format?.stock !== undefined && item.format?.stock !== null && item.quantity >= item.format.stock}
                                  onClick={() => updateQuantity(key, item.quantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm cursor-pointer"
                                  aria-label="Augmenter"
                                >
                                  +
                                </button>
                              </div>
                              {item.format?.stock !== undefined && item.format?.stock !== null && item.format.stock <= 0 ? (
                                <span className="text-[10px] text-rose-600 font-bold block">
                                  Rupture de stock
                                </span>
                              ) : item.format?.stock !== undefined && item.format?.stock !== null && item.quantity >= item.format.stock ? (
                                <span className="text-[10px] text-amber-700 font-bold block">
                                  Max atteint ({item.format.stock})
                                </span>
                              ) : null}
                            </div>
                            <div className="text-right">
                              <span className="text-xs sm:text-sm font-bold text-[#0f3d38] block whitespace-nowrap">
                                {(parseFloat(item.format.prix) * item.quantity).toFixed(0)} DH
                              </span>
                              {item.format.is_promo && item.format.original_prix && (
                                <span className="text-[10px] text-gray-400 line-through block whitespace-nowrap">
                                  {(parseFloat(item.format.original_prix) * item.quantity).toFixed(0)} DH
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-white space-y-3">
                  {/* Sous-total brut */}
                  {bundleDiscount?.hasDiscount && (
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-gray-500 font-medium">Sous-total</span>
                      <span className="text-gray-500 line-through">{parseFloat(subtotal || 0).toFixed(0)} DH</span>
                    </div>
                  )}

                  {/* Discount line */}
                  {bundleDiscount?.hasDiscount && (
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M20 12V22H4V12H20M22 6H17.82C18.25 5.34 18.5 4.5 18.5 3.5C18.5 2.12 17.38 1 16 1C14.28 1 12.92 2.76 12 4.04C11.08 2.76 9.72 1 8 1C6.62 1 5.5 2.12 5.5 3.5C5.5 4.5 5.75 5.34 6.18 6H2V10H22V6M8 3C8.83 3 9.5 3.67 9.5 4.5C9.5 5.5 8 6 8 6C8 6 6.5 5.5 6.5 4.5C6.5 3.67 7.17 3 8 3M16 3C16.83 3 17.5 3.67 17.5 4.5C17.5 5.5 16 6 16 6C16 6 14.5 5.5 14.5 4.5C14.5 3.67 15.17 3 16 3Z" />
                        </svg>
                        <span>Remise Pack Auto</span>
                      </span>
                      <span className="text-emerald-700 font-bold">-{parseFloat(bundleDiscount?.discount || 0).toFixed(0)} DH</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                      Total estimé
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-[#0f3d38]">
                      {parseFloat(total || 0).toFixed(0)} DH
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Taxes et <Link to="/contact" onClick={closeDrawer} className="underline hover:text-gray-600">frais d'expédition</Link> calculés à l'étape du paiement.
                  </p>

                  {hasOutOfStockItems && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-2">
                      <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Certains articles sont épuisés ou dépassent le stock. Veuillez ajuster votre panier pour commander.</span>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <button
                      disabled={hasOutOfStockItems}
                      onClick={handleCheckout}
                      className="w-full py-3.5 bg-[#0f3d38] hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-md hover:shadow-lg"
                    >
                      Procéder au paiement
                    </button>
                    <button
                      disabled={hasOutOfStockItems}
                      onClick={handleWhatsAppOrder}
                      className="w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                      </svg>
                      Commander via WhatsApp
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
