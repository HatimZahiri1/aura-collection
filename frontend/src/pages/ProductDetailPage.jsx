import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { catalogAPI } from '../api/client'
import useCartStore from '../store/cartStore'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [parfum, setParfum] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [mainImage, setMainImage] = useState(0)
  const { addItem, openDrawer } = useCartStore()

  // Senteurs disponibles pour composer ou personnaliser un coffret
  const [catalogGels, setCatalogGels] = useState([])
  const [selectedFragrances, setSelectedFragrances] = useState([])
  const [fragranceFilter, setFragranceFilter] = useState('all')
  const [packSelectionError, setPackSelectionError] = useState('')

  useEffect(() => {
    setLoading(true)
    setPackSelectionError('')
    setSelectedFragrances([])
    catalogAPI.getParfum(id)
      .then((res) => {
        setParfum(res.data)
        if (res.data.formats?.length > 0) {
          const flacon250 = res.data.formats.find(f => f.type_format === 'flacon_250')
          setSelectedFormat(flacon250 || res.data.formats[0])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  // Charger la liste des gels individuels du catalogue pour la sélection personnalisée
  useEffect(() => {
    catalogAPI.getParfums({ is_pack: false, page_size: 100 })
      .then((res) => {
        setCatalogGels(res.data.results || res.data || [])
      })
      .catch(console.error)
  }, [])

  const formatLabels = new Proxy({
    flacon_250: 'Gel Douche 250ml',
    pack_2: 'Pack Spécial (2 Gels Parfumés)',
    pack_3: 'Pack Spécial (3 Gels Parfumés)',
    pack_4: 'Pack Spécial (4 Gels Parfumés)',
    pack_5: 'Pack Spécial (5 Gels Parfumés)',
    pack_6: 'Pack Spécial (6 Gels Parfumés)',
    complet: 'Gel Douche 250ml',
    decant_10: 'Pack Spécial',
    decant_5: 'Format 5ml',
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

  const isPack = Boolean(parfum?.is_pack || selectedFormat?.type_format?.includes('pack'))
  const formatPackMatch = selectedFormat?.type_format?.match(/pack_(\d+)/i)
  const formatPackCount = formatPackMatch ? parseInt(formatPackMatch[1], 10) : null
  const inclusCount = parfum?.parfums_inclus_detail?.length || (Array.isArray(parfum?.parfums_inclus) ? parfum.parfums_inclus.length : null)
  const nomMatch = parfum?.nom?.match(/(\d+)\s*(?:gels?|produits?|flacons?|parfums?)/i) || parfum?.nom?.match(/pack.*?(\d+)/i)
  const nomCount = nomMatch ? parseInt(nomMatch[1], 10) : null

  const targetCount = isPack ? (formatPackCount || inclusCount || nomCount || 3) : 0

  const availableStock = selectedFormat?.stock ?? (parfum?.en_stock ? 10 : 0)
  const isOutOfStock = availableStock <= 0
  const isLowStock = availableStock > 0 && availableStock <= 5

  const getGelStock = (gel) => {
    const f250 = gel.formats?.find(f => f.type_format === 'flacon_250') || gel.formats?.[0]
    return f250?.stock ?? (gel.en_stock ? 10 : 0)
  }

  // Ajuster si l'utilisateur change de format (ex: passe de pack 4 à pack 3)
  useEffect(() => {
    if (isPack && selectedFragrances.length > targetCount) {
      setSelectedFragrances(prev => prev.slice(0, targetCount))
    }
  }, [targetCount, isPack])

  // Ajuster la quantité si elle dépasse le stock disponible
  useEffect(() => {
    if (availableStock > 0 && quantity > availableStock) {
      setQuantity(availableStock)
    } else if (availableStock === 0 && quantity > 1) {
      setQuantity(1)
    }
  }, [availableStock, selectedFormat])

  const isPackComplete = !isPack || (selectedFragrances.length === targetCount)

  // Remplir d'un clic avec la sélection recommandée (uniquement les gels disponibles en stock)
  const handleFillRecommended = () => {
    const inStockGels = catalogGels.filter(g => getGelStock(g) > 0)
    if (inStockGels.length === 0) {
      setPackSelectionError('Aucun gel douche individuel n\'est actuellement disponible en stock pour ce pack.')
      return
    }

    const recommended = []
    // 1ère passe: essayer 1 de chaque senteur disponible
    for (const g of inStockGels) {
      if (recommended.length >= targetCount) break
      const gStock = getGelStock(g)
      const countInRec = recommended.filter(name => name === g.nom).length
      if (countInRec < gStock) {
        recommended.push(g.nom)
      }
    }

    // 2ème passe si besoin pour compléter jusqu'à targetCount avec les gels disponibles
    while (recommended.length < targetCount) {
      const availableGel = inStockGels.find(g => {
        const countInRec = recommended.filter(name => name === g.nom).length
        return countInRec < getGelStock(g)
      })
      if (!availableGel) break
      recommended.push(availableGel.nom)
    }

    if (recommended.length < targetCount) {
      setPackSelectionError(`Stock global insuffisant pour composer un pack complet de ${targetCount} flacons (${recommended.length} disponibles).`)
    } else {
      setPackSelectionError('')
    }
    setSelectedFragrances(recommended)
  }

  // Réinitialiser les flacons choisis
  const handleClearSlots = () => {
    setSelectedFragrances([])
    setPackSelectionError('')
  }

  // Ajouter un gel dans le prochain flacon vide en vérifiant son stock individuel
  const handleAddFragrance = (fragranceNom) => {
    setPackSelectionError('')
    const matched = catalogGels.find(g => g.nom === fragranceNom)
    const gelStock = matched ? getGelStock(matched) : 10

    if (gelStock <= 0) {
      setPackSelectionError(`Le parfum "${fragranceNom}" est en rupture de stock et ne peut pas être ajouté au pack.`)
      return
    }

    const currentCount = selectedFragrances.filter(f => f === fragranceNom).length
    if (currentCount >= gelStock) {
      setPackSelectionError(`Stock insuffisant : vous avez déjà sélectionné les ${gelStock} flacon(s) disponible(s) pour "${fragranceNom}".`)
      return
    }

    if (selectedFragrances.length < targetCount) {
      setSelectedFragrances(prev => [...prev, fragranceNom])
    } else {
      setPackSelectionError(`Votre pack contient déjà ${targetCount} flacons. Retirez un flacon ci-dessus pour en ajouter un autre.`)
    }
  }

  // Retirer un flacon à une position précise
  const handleRemoveSlot = (index) => {
    setPackSelectionError('')
    setSelectedFragrances(prev => prev.filter((_, i) => i !== index))
  }

  const isFormatPromo = Boolean(
    selectedFormat &&
    ((selectedFormat.prix_promo && parseFloat(selectedFormat.prix_promo) > 0 && parseFloat(selectedFormat.prix_promo) < parseFloat(selectedFormat.prix)) ||
     (parfum?.is_promo && parfum?.prix_promo && parseFloat(parfum.prix_promo) < parseFloat(selectedFormat.prix)))
  )

  const activePrice = selectedFormat?.prix_promo && parseFloat(selectedFormat.prix_promo) > 0
    ? parseFloat(selectedFormat.prix_promo)
    : (parfum?.is_promo && parfum?.prix_promo)
    ? parseFloat(parfum.prix_promo)
    : selectedFormat ? parseFloat(selectedFormat.prix) : 0

  const handleAddToCart = () => {
    if (!selectedFormat || isOutOfStock) return
    if (isPack && !isPackComplete) {
      const remaining = targetCount - selectedFragrances.length
      setPackSelectionError(`Veuillez choisir encore ${remaining} gel(s) douche pour compléter votre pack de ${targetCount} flacons avant de l'ajouter au panier.`)
      const el = document.getElementById('pack-composer-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const chosen = isPack ? selectedFragrances : []
    addItem(selectedFormat, parfum, quantity, chosen)
    openDrawer()
  }

  const handleWhatsAppOrder = () => {
    if (!selectedFormat || isOutOfStock) return
    if (isPack && !isPackComplete) {
      const remaining = targetCount - selectedFragrances.length
      setPackSelectionError(`Veuillez choisir vos ${targetCount} gels douche avant de finaliser la commande via WhatsApp (reste ${remaining} flacon(s)).`)
      const el = document.getElementById('pack-composer-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const promoNote = isFormatPromo ? ` (Prix Promo Réduit)` : ''
    const fragsNote = isPack && selectedFragrances.length > 0
      ? `\nFragrances choisies (${selectedFragrances.length} flacons) :\n${selectedFragrances.map((f, i) => `  ${i + 1}. ${f}`).join('\n')}`
      : ''
    const text = `Bonjour AURA COLLECTION, je souhaite commander :\n\n- ${parfum.nom} (${formatLabels[selectedFormat.type_format] || selectedFormat.type_format}) x${quantity} = ${(activePrice * quantity).toFixed(2)} DH${promoNote}${fragsNote}`
    window.open(`https://wa.me/212651470308?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4faf8] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#2fb49c]/30 border-t-[#2fb49c] rounded-full animate-spin" />
      </div>
    )
  }

  if (!parfum || parfum.actif === false) {
    return (
      <div className="min-h-screen bg-[#f4faf8] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-[#d4e8e3] text-center max-w-md shadow-sm">
          <h2 className="text-xl font-bold uppercase tracking-wider text-[#0f3d38] mb-3">
            Produit indisponible
          </h2>
          <p className="text-sm text-gray-500 mb-6">Ce produit est actuellement désactivé ou n'est plus disponible.</p>
          <Link to="/catalogue" className="btn-aura">
            Retour au catalogue
          </Link>
        </div>
      </div>
    )
  }

  const images = parfum.photo_principale
    ? [parfum.photo_principale, ...(parfum.images?.map((img) => img.image) || [])]
    : parfum.images?.map((img) => img.image) || []

  return (
    <div className="min-h-screen bg-[#f4faf8] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-8">
          <Link to="/" className="hover:text-[#2fb49c] transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/catalogue" className="hover:text-[#2fb49c] transition-colors">Catalogue</Link>
          <span>/</span>
          <span className="text-[#0f3d38] font-bold">{parfum.nom}</span>
        </nav>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#d4e8e3] shadow-sm p-4 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-14">
            {/* Left: Gallery */}
            <div>
              <div className="aspect-square bg-[#f0fbf8] rounded-2xl overflow-hidden border border-[#d4e8e3] mb-3 sm:mb-4">
                {images.length > 0 ? (
                  <img
                    src={images[mainImage]}
                    alt={parfum.nom}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-serif">
                    AURA COLLECTION
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMainImage(idx)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                        mainImage === idx ? 'border-[#2fb49c] scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info & Purchase */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#2fb49c]">
                  {parfum.marque_nom || parfum.marque?.nom || 'AURA COLLECTION'}
                </span>
                <h1 className="text-xl sm:text-3xl font-extrabold text-[#0f3d38] mt-1 mb-2 font-serif">
                  {parfum.nom}
                </h1>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 my-2.5 sm:my-3">
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-[#f0fbf8] text-[#0f3d38] border border-[#d4e8e3]">
                    {parfum.is_pack ? 'Pack Spécial' : 'Gel Douche Parfumé'}
                  </span>
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    250 ML
                  </span>
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-[#f0fbf8] text-[#2fb49c] border border-[#2fb49c]/30">
                    0% Sulfates • 0% Parabènes
                  </span>
                </div>

                {/* Price Display */}
                <div className="mt-3 sm:mt-4 flex items-baseline gap-2.5 sm:gap-3 flex-wrap">
                  {isFormatPromo ? (
                    <>
                      <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">
                        {parseFloat(activePrice).toFixed(0)} DH
                      </span>
                      {selectedFormat && (
                        <span className="text-sm sm:text-base text-gray-400 line-through">
                          {parseFloat(selectedFormat.prix).toFixed(0)} DH
                        </span>
                      )}
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 sm:py-1 rounded-full border border-rose-200">
                        Offre Spéciale
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#0f3d38]">
                      {selectedFormat ? `${parseFloat(selectedFormat.prix).toFixed(0)} DH` : '89 DH'}
                    </span>
                  )}

                  {/* Stock Status Pill */}
                  {isOutOfStock ? (
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                      Rupture de stock
                    </span>
                  ) : isLowStock ? (
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Stock faible : plus que {availableStock} restant{availableStock > 1 ? 's' : ''} !
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      En stock ({availableStock} disponibles)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Paiement à la livraison • Vérification du colis avant paiement
                </p>

                {/* Pack Spécial : Sélecteur Obligatoire & Personnalisation de Fragrances */}
                {isPack && (
                  <div id="pack-composer-section" className="mt-6 p-4 sm:p-6 rounded-3xl bg-[#f0fbf8] border-2 border-[#2fb49c]/30 shadow-xs space-y-4">
                    {/* Header du sélecteur */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#d4e8e3]">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPackComplete
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#0f3d38] text-white'
                          }`}>
                            {isPackComplete ? `✓ Complet (${targetCount}/${targetCount})` : `${selectedFragrances.length}/${targetCount} flacons choisis`}
                          </span>
                          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0f3d38]">
                            Composition de votre Pack ({targetCount} Gels 250ml)
                          </h3>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {isPackComplete
                            ? 'Votre pack est complet ! Vous pouvez modifier les flacons ou valider votre panier.'
                            : `Sélectionnez vos ${targetCount} senteurs ci-dessous. Vous pouvez choisir les mêmes parfums ou panacher librement.`}
                        </p>
                      </div>

                      {/* Actions rapides */}
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={handleFillRecommended}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white hover:bg-emerald-50 text-[#0f3d38] border border-[#d4e8e3] hover:border-[#2fb49c] transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                          title="Remplir automatiquement avec 1 de chaque senteur"
                        >
                          <span>✨ 1 de chaque</span>
                        </button>
                        {selectedFragrances.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearSlots}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-gray-200 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs"
                            title="Effacer la sélection"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Alerte si le client tente de valider sans avoir fini */}
                    {packSelectionError && (
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-start gap-2 animate-pulse">
                        <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{packSelectionError}</span>
                      </div>
                    )}

                    {/* Grille visuelle des Flacons (Rack de slots) */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                        Vos {targetCount} flacons sélectionnés :
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                        {Array.from({ length: targetCount }).map((_, idx) => {
                          const chosenFragName = selectedFragrances[idx]
                          const matchedGel = catalogGels.find(g => g.nom === chosenFragName)

                          if (chosenFragName) {
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2.5 rounded-2xl bg-white border-2 border-[#2fb49c]/40 shadow-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                    {matchedGel?.photo_principale ? (
                                      <img src={matchedGel.photo_principale} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-400">
                                        #{idx + 1}
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-[#f0fbf8] text-[#0f3d38] border border-[#d4e8e3]">
                                        Flacon {idx + 1}
                                      </span>
                                      <span className="text-[9px] text-gray-400 uppercase font-semibold">
                                        {matchedGel?.genre === 'homme' ? 'Homme' : 'Femme'} • 250ml
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-extrabold text-[#0f3d38] truncate mt-0.5">
                                      {chosenFragName}
                                    </h4>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(idx)}
                                  className="w-7 h-7 rounded-full text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                                  title="Retirer ce flacon"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )
                          }

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 rounded-2xl bg-white/60 border-2 border-dashed border-[#2fb49c]/40 text-gray-400"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-[#2fb49c] font-bold text-xs shrink-0">
                                  #{idx + 1}
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-gray-500 block">
                                    Flacon {idx + 1} à choisir
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    Cliquez sur un gel ci-dessous ↓
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2fb49c] px-2 py-0.5 rounded-full bg-[#f0fbf8]">
                                Vide
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Catalogue des gels disponibles à ajouter */}
                    <div className="pt-3 border-t border-[#d4e8e3]">
                      <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0f3d38]">
                          Cliquez pour ajouter à votre pack :
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setFragranceFilter('all')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                              fragranceFilter === 'all' ? 'bg-[#0f3d38] text-white' : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                          >
                            Tous ({catalogGels.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setFragranceFilter('homme')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                              fragranceFilter === 'homme' ? 'bg-[#0f3d38] text-white' : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                          >
                            Homme
                          </button>
                          <button
                            type="button"
                            onClick={() => setFragranceFilter('femme')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                              fragranceFilter === 'femme' ? 'bg-[#0f3d38] text-white' : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                          >
                            Femme
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {catalogGels
                          .filter(g => fragranceFilter === 'all' || g.genre === fragranceFilter)
                          .map((g) => {
                            const gelStock = getGelStock(g)
                            const isGelOutOfStock = gelStock <= 0
                            const countInPack = selectedFragrances.filter(f => f === g.nom).length
                            const isGelMaxed = countInPack >= gelStock
                            const isAtCapacity = selectedFragrances.length >= targetCount
                            const isDisabled = isGelOutOfStock || isGelMaxed || (isAtCapacity && countInPack === 0)

                            return (
                              <button
                                type="button"
                                key={g.id}
                                disabled={isDisabled}
                                onClick={() => handleAddFragrance(g.nom)}
                                className={`flex items-center justify-between gap-2 p-2.5 rounded-2xl border text-left transition-all ${
                                  isGelOutOfStock
                                    ? 'border-gray-200 bg-gray-50/80 opacity-60 cursor-not-allowed'
                                    : isGelMaxed && countInPack > 0
                                    ? 'border-amber-300 bg-amber-50/30 cursor-not-allowed'
                                    : countInPack > 0
                                    ? 'border-[#0f3d38] ring-2 ring-[#0f3d38]/10 shadow-xs bg-white cursor-pointer'
                                    : isAtCapacity
                                    ? 'border-gray-200 bg-white opacity-60 cursor-not-allowed'
                                    : 'border-gray-200 hover:border-[#2fb49c] hover:shadow-xs bg-white cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                    {g.photo_principale && (
                                      <img src={g.photo_principale} alt="" className={`w-full h-full object-cover ${isGelOutOfStock ? 'grayscale' : ''}`} />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-[#0f3d38] block truncate">
                                      {g.nom}
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[10px] text-gray-400 uppercase font-medium">
                                        {g.genre_display || g.genre} • 250ml
                                      </span>
                                      {isGelOutOfStock ? (
                                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                          Rupture
                                        </span>
                                      ) : gelStock <= 5 ? (
                                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                          Reste {gelStock}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-1.5">
                                  {countInPack > 0 && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#0f3d38] text-white">
                                      ×{countInPack}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-xl transition-colors ${
                                    isGelOutOfStock
                                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                      : isGelMaxed && countInPack > 0
                                      ? 'bg-amber-100 text-amber-800'
                                      : isAtCapacity && countInPack === 0
                                      ? 'bg-gray-100 text-gray-400'
                                      : 'bg-[#f0fbf8] text-[#0f3d38] border border-[#d4e8e3] group-hover:bg-[#2fb49c]'
                                  }`}>
                                    {isGelOutOfStock
                                      ? 'Épuisé'
                                      : isGelMaxed && countInPack > 0
                                      ? 'Stock max'
                                      : '+ Ajouter'}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                      </div>
                    </div>

                    {/* Statut de complétude */}
                    {isPackComplete ? (
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Votre pack de {targetCount} gels douche est complet ! Vous pouvez maintenant finaliser votre commande.</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between gap-2">
                        <span>Il vous reste <strong>{targetCount - selectedFragrances.length}</strong> flacon(s) à choisir.</span>
                        <span className="text-[10px] uppercase font-bold text-amber-700">Sélection obligatoire</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Format Selector if multiple formats */}
                {parfum.formats && parfum.formats.length > 1 && (
                  <div className="mt-8">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                      Choisir le Format :
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {parfum.formats.map((fmt) => {
                        const fmtHasPromo = fmt.prix_promo && parseFloat(fmt.prix_promo) > 0 && parseFloat(fmt.prix_promo) < parseFloat(fmt.prix)
                        const isSelected = selectedFormat?.id === fmt.id
                        const fmtStock = fmt.stock ?? 0
                        const fmtOutOfStock = fmtStock <= 0
                        const fmtLowStock = fmtStock > 0 && fmtStock <= 5

                        return (
                          <button
                            key={fmt.id}
                            onClick={() => setSelectedFormat(fmt)}
                            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative ${
                              isSelected
                                ? 'border-[#0f3d38] bg-[#0f3d38] text-white shadow-md'
                                : fmtOutOfStock
                                ? 'border-gray-200 bg-gray-50/70 text-gray-400 opacity-60'
                                : fmtHasPromo
                                ? 'border-rose-200 bg-rose-50/40 text-gray-800 hover:border-rose-400'
                                : 'border-[#d4e8e3] bg-white text-gray-700 hover:border-[#2fb49c]'
                            }`}
                          >
                            <div className="text-xs font-bold uppercase tracking-wide">
                              {formatLabels[fmt.type_format] || fmt.type_format}
                            </div>
                            <div className="mt-1 flex items-baseline justify-center gap-1.5 flex-wrap">
                              {fmtHasPromo ? (
                                <>
                                  <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-rose-600'}`}>
                                    {parseFloat(fmt.prix_promo).toFixed(0)} DH
                                  </span>
                                  <span className={`text-[10px] line-through ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                                    {parseFloat(fmt.prix).toFixed(0)} DH
                                  </span>
                                </>
                              ) : (
                                <span className={`text-xs font-bold ${isSelected ? 'text-gray-100' : 'text-[#0f3d38]'}`}>
                                  {parseFloat(fmt.prix).toFixed(0)} DH
                                </span>
                              )}
                              {fmtOutOfStock ? (
                                <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                  Épuisé
                                </span>
                              ) : fmtLowStock ? (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isSelected ? 'text-amber-200 bg-amber-900/40' : 'text-amber-700 bg-amber-50 border border-amber-200'}`}>
                                  Reste {fmtStock}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Quantité :
                    </label>
                    {isOutOfStock ? (
                      <span className="text-[11px] font-bold text-rose-600">
                        Produit épuisé
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[11px] font-bold text-amber-600">
                        Seulement {availableStock} disponible{availableStock > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-gray-400">
                        Stock : {availableStock} unités
                      </span>
                    )}
                  </div>
                  <div className="flex items-center border border-[#d4e8e3] rounded-full overflow-hidden w-32 bg-white shadow-2xs">
                    <button
                      type="button"
                      disabled={isOutOfStock || quantity <= 1}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-base cursor-pointer"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center font-bold text-sm text-[#0f3d38]">
                      {isOutOfStock ? 0 : quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isOutOfStock || quantity >= availableStock}
                      onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-base cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  {quantity >= availableStock && availableStock > 0 && (
                    <p className="text-[11px] font-semibold text-amber-700 mt-1.5 flex items-center gap-1">
                      <span>⚠️ Quantité maximale disponible atteinte ({availableStock})</span>
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-3">
                  {isOutOfStock ? (
                    <>
                      <button
                        type="button"
                        disabled
                        className="w-full py-4 text-xs font-bold uppercase tracking-widest rounded-full bg-gray-200 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2 shadow-xs"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span>Rupture de stock • Produit indisponible</span>
                      </button>

                      <button
                        type="button"
                        disabled
                        className="w-full py-3.5 bg-gray-100 text-gray-400 text-xs font-bold uppercase tracking-widest rounded-full cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <span>Commande impossible (Stock épuisé)</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleAddToCart}
                        className={`w-full py-4 text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                          isPack && !isPackComplete
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-[#0f3d38] hover:bg-[#2fb49c] text-white'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>
                          {isPack
                            ? isPackComplete
                              ? `Valider mon Pack & Ajouter au Panier • ${parseFloat(activePrice).toFixed(0)} DH`
                              : `Complétez votre pack (${selectedFragrances.length}/${targetCount} flacons)`
                            : `Ajouter au panier • ${parseFloat(activePrice).toFixed(0)} DH`}
                        </span>
                      </button>

                      <button
                        onClick={handleWhatsAppOrder}
                        className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                        </svg>
                        <span>Commander via WhatsApp</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs text-gray-600 font-medium">
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-[#2fb49c] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                  <span>Livraison express 24-48h</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-[#2fb49c] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span>0% Sulfates, 0% Parabènes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-[#2fb49c] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Paiement à la livraison</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-[#2fb49c] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Flacon généreux 250 ML</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Pyramide Olfactive */}
          <div className="mt-14 pt-10 border-t border-gray-100 space-y-6">
            <div>
              <h3 className="text-base font-bold uppercase tracking-wider text-[#0f3d38] mb-3 font-serif">
                Rituel & Expérience Sensorielle
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
                {parfum.description || 'Une création olfactive de haute facture, transformant votre douche quotidienne en une véritable expérience sensorielle et raffinée.'}
              </p>
            </div>

            {/* Notes Pyramid */}
            {(parfum.notes_tete || parfum.notes_coeur || parfum.notes_fond) && (
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-[#0f3d38] mb-4 font-serif">
                  Pyramide Olfactive
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
                  {parfum.notes_tete && (
                    <div className="p-4 rounded-2xl bg-[#f0fbf8] border border-[#d4e8e3]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2fb49c] block mb-1">
                        Notes de Tête
                      </span>
                      <p className="text-xs font-semibold text-[#0f3d38]">{parfum.notes_tete}</p>
                    </div>
                  )}
                  {parfum.notes_coeur && (
                    <div className="p-4 rounded-2xl bg-[#f0fbf8] border border-[#d4e8e3]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2fb49c] block mb-1">
                        Notes de Cœur
                      </span>
                      <p className="text-xs font-semibold text-[#0f3d38]">{parfum.notes_coeur}</p>
                    </div>
                  )}
                  {parfum.notes_fond && (
                    <div className="p-4 rounded-2xl bg-[#f0fbf8] border border-[#d4e8e3]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2fb49c] block mb-1">
                        Notes de Fond
                      </span>
                      <p className="text-xs font-semibold text-[#0f3d38]">{parfum.notes_fond}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
