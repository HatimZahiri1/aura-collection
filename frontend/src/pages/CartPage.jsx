import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useCartStore from '../store/cartStore'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const clearCart = useCartStore((s) => s.clearCart)

  const subtotal = useCartStore((s) => s.subtotal)
  const bundleDiscount = useCartStore((s) => s.bundleDiscount)
  const total = useCartStore((s) => s.total)
  const count = useCartStore((s) => s.count)

  const hasOutOfStockItems = items.some(item => 
    (item.format?.stock !== undefined && item.format?.stock !== null && item.format.stock <= 0) ||
    (item.format?.stock !== undefined && item.format?.stock !== null && item.quantity > item.format.stock)
  )

  const formatPrice = (price) => `${parseFloat(price || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f4faf8] py-20 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-[#d4e8e3] p-10 sm:p-14 text-center max-w-lg shadow-sm"
        >
          <div className="w-20 h-20 rounded-full bg-[#f0fbf8] border border-[#d4e8e3] flex items-center justify-center text-[#0f3d38] mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0f3d38] mb-3">
            Votre panier est vide
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
            Découvrez notre collection de gels douche parfumés de luxe formulés sans sulfates et inspirés de la haute parfumerie.
          </p>
          <Link
            to="/catalogue"
            className="inline-block px-8 py-3.5 bg-[#0f3d38] hover:bg-[#2fb49c] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-md hover:shadow-lg"
          >
            Explorer le catalogue
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4faf8] py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-4xl font-serif font-bold text-[#0f3d38]"
          >
            Votre <span className="text-[#2fb49c] italic">Panier</span>
          </motion.h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {count} article{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}
          </p>
        </div>

        {/* Bannière Remise Spéciale Packs */}
        {bundleDiscount && bundleDiscount.hasDiscount && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-[#f0fbf8] border border-emerald-300 shadow-xs flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-emerald-900">
                  {bundleDiscount.badgeText}
                </p>
                <p className="text-[11px] text-emerald-700">
                  Économie immédiate : <strong>-{bundleDiscount.discount.toFixed(0)} DH</strong> déduits de votre commande
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-xs">
              Pack Automatique
            </span>
          </motion.div>
        )}

        {/* Suggestion pour atteindre le palier supérieur */}
        {bundleDiscount && bundleDiscount.nextTierMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-medium">{bundleDiscount.nextTierMessage}</span>
            </div>
            <Link
              to="/catalogue"
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline shrink-0"
            >
              Ajouter un gel
            </Link>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <AnimatePresence>
              {items.map((item) => {
                const itemKey = item.itemKey || item.format.id
                const isPack = Boolean(item.parfum?.is_pack || item.format?.type_format?.includes('pack'))

                return (
                  <motion.div
                    key={itemKey}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    className="bg-white rounded-3xl border border-[#d4e8e3] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
                  >
                    <div className="flex gap-4 items-center min-w-0">
                      <Link to={`/produit/${item.parfum.id}`} className="shrink-0">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                          <img
                            src={item.parfum.photo_principale || ''}
                            alt={item.parfum.nom}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        </div>
                      </Link>

                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2fb49c]">
                          {item.parfum.marque_nom || 'AURA COLLECTION'}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-[#0f3d38] truncate">
                          {item.parfum.nom}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {isPack ? 'Pack Spécial 250ml' : 'Flacon Complet 250ml'}
                        </p>

                        {/* Fragrances choisies pour les packs */}
                        {item.selectedFragrances && item.selectedFragrances.length > 0 && (
                          <div className="mt-2 p-2 rounded-xl bg-[#f0fbf8] border border-[#d4e8e3]">
                            <span className="text-[10px] font-bold uppercase text-[#0f3d38] block mb-1">
                              Fragrances du pack :
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {item.selectedFragrances.map((frag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-white border border-[#2fb49c]/30 text-[10px] font-medium text-[#0f3d38]"
                                >
                                  {frag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-sm font-extrabold text-[#0f3d38]">
                            {formatPrice(item.format.prix)}
                          </span>
                          {item.format.prix_promo && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(item.format.original_prix || item.format.prix)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Delete */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                      {/* Controls */}
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center border border-[#d4e8e3] rounded-full overflow-hidden bg-white">
                          <button
                            onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-[#0f3d38]">
                            {item.quantity}
                          </span>
                          <button
                            disabled={item.format?.stock !== undefined && item.format?.stock !== null && item.quantity >= item.format.stock}
                            onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm cursor-pointer"
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

                      {/* Sous-total de la ligne */}
                      <span className="text-sm font-bold text-[#0f3d38] min-w-[80px] text-right">
                        {formatPrice(parseFloat(item.format.prix) * item.quantity)}
                      </span>

                      {/* Supprimer */}
                      <button
                        onClick={() => removeItem(itemKey)}
                        className="text-gray-400 hover:text-rose-500 transition-colors p-1.5 rounded-full hover:bg-rose-50 cursor-pointer"
                        title="Retirer du panier"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={clearCart}
                className="text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Vider le panier
              </button>
              <Link
                to="/catalogue"
                className="text-xs font-bold text-[#2fb49c] hover:underline"
              >
                ← Continuer les achats
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-[#d4e8e3] p-6 shadow-sm sticky top-28 space-y-5"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f3d38]">
                Récapitulatif de votre commande
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total ({count} flacons)</span>
                  <span className="font-semibold text-gray-800">{formatPrice(subtotal)}</span>
                </div>

                {bundleDiscount && bundleDiscount.hasDiscount && (
                  <div className="flex justify-between text-emerald-700 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                    <div>
                      <span className="font-bold block">Remise Spéciale Packs</span>
                      <span className="text-[10px] text-emerald-600">Offre groupée automatique</span>
                    </div>
                    <span className="font-extrabold text-emerald-700">
                      -{formatPrice(bundleDiscount.discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Livraison</span>
                  <span className="text-[11px] text-[#2fb49c] font-bold">
                    Calculée à la commande (Gratuite à Casa)
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-bold text-[#0f3d38] uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-serif font-black text-[#0f3d38]">
                    {formatPrice(total)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Paiement à la livraison après inspection du colis
                </p>
              </div>

              {hasOutOfStockItems && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Certains articles sont épuisés ou dépassent le stock. Veuillez ajuster votre panier pour commander.</span>
                </div>
              )}

              {hasOutOfStockItems ? (
                <button
                  disabled
                  className="w-full py-4 bg-gray-200 text-gray-400 text-xs font-bold uppercase tracking-widest rounded-full cursor-not-allowed text-center block"
                >
                  Stock insuffisant pour commander
                </button>
              ) : (
                <Link
                  to="/commander"
                  className="w-full py-4 bg-[#0f3d38] hover:bg-[#2fb49c] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-md hover:shadow-lg text-center block cursor-pointer"
                >
                  Passer la commande
                </Link>
              )}

              <div className="pt-2 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#2fb49c] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Livraison partout au Maroc sous 24-48h</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#2fb49c] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Formules 0% sulfates, 0% parabènes</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#2fb49c] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Paiement en espèces à la réception</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
