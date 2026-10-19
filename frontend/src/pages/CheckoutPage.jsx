import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ordersAPI } from '../api/client'
import useCartStore from '../store/cartStore'

export default function CheckoutPage() {
  const { items, clearCart, total, subtotal, bundleDiscount } = useCartStore()

  const [form, setForm] = useState({
    nom_client: '',
    telephone: '',
    adresse: '',
    notes: '',
  })
  const [villeChoice, setVilleChoice] = useState('casablanca') // 'casablanca' | 'autre'
  const [customVille, setCustomVille] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  // Réinitialiser systématiquement le défilement au sommet de la page dès la confirmation de commande
  useEffect(() => {
    if (success) {
      const resetToTop = () => {
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
      resetToTop()
      const rafId = requestAnimationFrame(resetToTop)
      const t1 = setTimeout(resetToTop, 10)
      const t2 = setTimeout(resetToTop, 50)
      const t3 = setTimeout(resetToTop, 150)
      return () => {
        cancelAnimationFrame(rafId)
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }
  }, [success])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Frais de livraison: 0 DH pour Casablanca, 20 DH pour toute autre ville
  const shippingCost = villeChoice === 'casablanca' ? 0 : 20
  const grandTotal = total + shippingCost
  const discountAmount = bundleDiscount?.discount || 0
  const resolvedVille = villeChoice === 'casablanca' ? 'Casablanca' : customVille.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.nom_client.trim() || !form.telephone.trim() || !form.adresse.trim()) {
      setError('Veuillez remplir tous les champs obligatoires (Nom complet, Téléphone, Adresse).')
      return
    }

    if (villeChoice === 'autre' && !customVille.trim()) {
      setError('Veuillez indiquer le nom de votre ville de livraison.')
      return
    }

    if (items.length === 0) {
      setError('Votre panier est vide.')
      return
    }

    // Vérification du stock avant soumission
    for (const item of items) {
      const stock = item.format?.stock
      if (stock !== undefined && stock !== null) {
        if (stock <= 0) {
          setError(`Le produit "${item.parfum.nom}" est actuellement en rupture de stock. Veuillez le retirer du panier pour valider votre commande.`)
          return
        }
        if (item.quantity > stock) {
          setError(`Stock insuffisant pour "${item.parfum.nom}" : seulement ${stock} flacon(s) disponible(s) alors que votre commande en contient ${item.quantity}.`)
          return
        }
      }
    }

    setLoading(true)
    try {
      const orderData = {
        nom_client: form.nom_client.trim(),
        telephone: form.telephone.trim(),
        adresse: form.adresse.trim(),
        ville: resolvedVille,
        notes: form.notes ? form.notes.trim() : '',
        lignes: items.map((item) => ({
          format_id: item.format?.id || 157,
          quantite: parseInt(item.quantity) || 1,
          fragrances_choisies: item.selectedFragrances || [],
        })),
      }
      const res = await ordersAPI.createCommande(orderData)

      // Construire le récapitulatif complet et structuré de la commande pour WhatsApp
      const itemsList = items.map((item) => {
        const fmtLabel = formatLabels[item.format?.type_format] || item.format?.type_format || 'Gel Douche'
        let desc = `• ${item.quantity}x ${item.parfum.nom} (${fmtLabel}) : ${(parseFloat(item.format.prix) * item.quantity).toFixed(2)} DH`
        if (item.selectedFragrances && item.selectedFragrances.length > 0) {
          desc += `\n   ↳ Fragrances : ${item.selectedFragrances.join(', ')}`
        }
        return desc
      }).join('\n')

      let waOrderText = `*NOUVELLE COMMANDE - AURA COLLECTION*\n*Réf :* #${res.data.id}\n\n`
      waOrderText += `*Client :* ${form.nom_client.trim()}\n`
      waOrderText += `*Téléphone :* ${form.telephone.trim()}\n`
      waOrderText += `*Ville :* ${resolvedVille}\n`
      waOrderText += `*Adresse :* ${form.adresse.trim()}\n`
      if (form.notes && form.notes.trim()) {
        waOrderText += `*Notes :* ${form.notes.trim()}\n`
      }
      waOrderText += `\n*Articles commandés :*\n${itemsList}\n`
      if (discountAmount > 0) {
        waOrderText += `\n*Remise Pack Auto :* -${discountAmount.toFixed(2)} DH`
      }
      waOrderText += `\n*Livraison :* ${shippingCost === 0 ? 'Gratuite (Casablanca)' : '20.00 DH'}`
      waOrderText += `\n*TOTAL À PAYER :* ${grandTotal.toFixed(2)} DH (Paiement à la livraison)`

      const waOrderUrl = `https://wa.me/212651470308?text=${encodeURIComponent(waOrderText)}`

      setSuccess({
        ...res.data,
        nom_client: form.nom_client.trim(),
        telephone: form.telephone.trim(),
        ville: resolvedVille,
        shippingCost,
        totalPaye: grandTotal,
        waUrl: waOrderUrl,
      })
      clearCart()

      // Défilement forcé et immédiat tout en haut à partir de la navbar
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      } catch {
        window.scrollTo(0, 0)
      }
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
      window.dispatchEvent(new CustomEvent('aura:scroll-to-top'))

      window.open(waOrderUrl, '_blank')
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        setError(Object.values(detail).flat().join(', ') || 'Erreur lors de la création de la commande.')
      } else {
        setError('Erreur lors de la création de la commande. Veuillez vérifier vos informations.')
      }
    } finally {
      setLoading(false)
    }
  }

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

  if (success) {
    return (
      <div className="min-h-[75vh] bg-[#f4faf8] pt-4 sm:pt-8 pb-16 px-4 flex items-start justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-[#d4e8e3] shadow-xl p-6 sm:p-8 md:p-12 text-center max-w-lg mx-auto w-full"
        >
          {/* Animated check badge */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block mb-3">
            Commande Confirmée avec Succès
          </span>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0f3d38] mb-2">
            Merci pour votre commande !
          </h2>

          <div className="bg-[#f0fbf8] border border-[#d4e8e3] rounded-2xl p-4 my-5 text-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-0.5">
              Référence Commande
            </span>
            <p className="text-lg font-bold text-[#0f3d38] mb-1">
              Commande #{success.id}
            </p>
            <p className="text-2xl font-serif font-extrabold text-[#0f3d38]">
              {parseFloat(success.totalPaye || success.total).toFixed(2)} DH
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-2 flex-wrap">
              <span>Ville : <strong className="text-gray-800">{success.ville}</strong></span>
              <span>•</span>
              <span>Livraison : <strong className="text-emerald-700">{success.shippingCost === 0 ? 'Gratuite' : '20.00 DH'}</strong></span>
              <span>•</span>
              <span>Paiement en espèces à la livraison</span>
            </div>
          </div>

          {/* Message clair et rassurant sur le contact par l'équipe AURA COLLECTION */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200 rounded-2xl p-4 mb-6 text-left shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-1">
                  Confirmation & Expédition :
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Une personne de l'équipe <strong>AURA COLLECTION</strong> va vous contacter très prochainement par <strong>téléphone ou WhatsApp</strong> au <strong className="text-[#0f3d38] underline">{success.telephone}</strong> afin de vous communiquer toutes les informations concernant l'expédition et la livraison de votre commande.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={success.waUrl || 'https://wa.me/212651470308'}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
              <span>Envoyer la commande sur WhatsApp (+212 6 51 47 03 08)</span>
            </a>

            <Link
              to="/catalogue"
              className="w-full py-3.5 bg-[#0f3d38] hover:bg-[#2fb49c] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-sm hover:shadow-md block text-center"
            >
              Continuer les achats
            </Link>

            <Link
              to="/"
              className="w-full py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-widest rounded-full transition-all block text-center"
            >
              Retour à l'accueil
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#eff0f5] py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wider text-[#0f3d38]">
            Validation de commande
          </h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
            Paiement sécurisé en espèces à la livraison (Cash on Delivery)
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-[#0f3d38]">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#0f3d38] uppercase mb-2">Votre panier est vide</h2>
            <p className="text-xs text-gray-500 mb-6">Ajoutez des parfums à votre panier pour finaliser votre commande.</p>
            <Link to="/catalogue" className="btn-luxury inline-block px-8 py-3">
              Explorer le catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left: Shipping Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-200/90 shadow-xs">
                <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#0f3d38] mb-4 sm:mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0f3d38]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Informations de Livraison
                </h2>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2.5"
                  >
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nom complet */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nom_client"
                      value={form.nom_client}
                      onChange={handleChange}
                      placeholder="Nom et prénom"
                      required
                      className="luxury-input"
                    />
                  </div>

                  {/* Numéro de téléphone */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                      Numéro de téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={form.telephone}
                      onChange={handleChange}
                      placeholder="06 12 34 56 78 (WhatsApp de préférence)"
                      required
                      className="luxury-input"
                    />
                  </div>

                  {/* Choix de la Ville et Frais de Livraison */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0f3d38] mb-2">
                      Ville de destination <span className="text-red-500">*</span>
                    </label>

                    {/* Sélection Casablanca / Autre ville */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      {/* Option 1 : Casablanca (Gratuit) */}
                      <button
                        type="button"
                        onClick={() => {
                          setVilleChoice('casablanca')
                          setError('')
                        }}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                          villeChoice === 'casablanca'
                            ? 'border-[#0f3d38] bg-white ring-2 ring-[#0f3d38]/10 shadow-xs'
                            : 'border-gray-200 bg-gray-50/70 hover:bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                villeChoice === 'casablanca' ? 'border-[#0f3d38]' : 'border-gray-300'
                              }`}
                            >
                              {villeChoice === 'casablanca' && (
                                <div className="w-2 h-2 rounded-full bg-[#0f3d38]" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-[#0f3d38] uppercase tracking-wider">
                              Casablanca
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Livraison Gratuite
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 pl-6">
                          Livraison à domicile offerte sur tout le grand Casablanca (24h - 48h)
                        </p>
                      </button>

                      {/* Option 2 : Autre ville (+20 DH) */}
                      <button
                        type="button"
                        onClick={() => {
                          setVilleChoice('autre')
                          setError('')
                        }}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                          villeChoice === 'autre'
                            ? 'border-[#0f3d38] bg-white ring-2 ring-[#0f3d38]/10 shadow-xs'
                            : 'border-gray-200 bg-gray-50/70 hover:bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                villeChoice === 'autre' ? 'border-[#0f3d38]' : 'border-gray-300'
                              }`}
                            >
                              {villeChoice === 'autre' && (
                                <div className="w-2 h-2 rounded-full bg-[#0f3d38]" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-[#0f3d38] uppercase tracking-wider">
                              Autre ville
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#0f3d38] text-white">
                            +20 DH
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 pl-6">
                          Livraison sécurisée partout au Maroc (24h - 72h)
                        </p>
                      </button>
                    </div>

                    {/* Champ animé pour saisir la ville quand 'Autre ville' est sélectionné */}
                    <AnimatePresence>
                      {villeChoice === 'autre' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden mb-3"
                        >
                          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#0f3d38] mb-1.5">
                              Entrez le nom de votre ville <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={customVille}
                                onChange={(e) => setCustomVille(e.target.value)}
                                placeholder="Ex: Rabat, Marrakech, Tanger, Fès, Agadir, Oujda, Meknès..."
                                required
                                autoFocus
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#0f3d38] rounded-xl text-xs text-[#0f3d38] placeholder-gray-400 focus:outline-hidden ring-2 ring-[#0f3d38]/10 shadow-xs transition-all"
                              />
                              <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#0f3d38] font-semibold">
                              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Frais de livraison de 20 DH ajoutés automatiquement au récapitulatif</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Adresse complète */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                      Adresse complète de livraison <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="adresse"
                      value={form.adresse}
                      onChange={handleChange}
                      placeholder="Quartier, résidence, rue, n° appartement..."
                      required
                      className="luxury-input"
                    />
                  </div>

                  {/* Notes optionnelles */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                      Instructions ou notes pour le livreur (optionnel)
                    </label>
                    <textarea
                      name="notes"
                      rows={2}
                      value={form.notes}
                      onChange={handleChange}
                      placeholder="Heure de passage souhaitée, indications spécifiques..."
                      className="luxury-input resize-y min-h-[60px]"
                    />
                  </div>

                  {/* Payment method */}
                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0f3d38] mb-2">
                      Mode de règlement :
                    </label>
                    <div className="p-4 rounded-2xl border-2 border-[#0f3d38] bg-[#eff0f5]/70 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#0f3d38] shadow-2xs border border-gray-200 shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#0f3d38]">
                            Paiement à la livraison (Cash on Delivery)
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Payez en espèces au livreur lors de la réception de votre colis.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">
                        100% Sécurisé
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-[#0f3d38] hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Traitement en cours...' : `Confirmer ma commande (${grandTotal.toFixed(0)} DH)`}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-200/90 shadow-xs sticky top-28 space-y-5 sm:space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 sm:pb-4">
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#0f3d38]">
                    Récapitulatif ({items.length})
                  </h2>
                  <span className="text-xs text-gray-500 font-medium">AURA COLLECTION</span>
                </div>

                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-2">
                  {items.map((item) => {
                    const key = item.itemKey || item.format.id
                    return (
                      <div key={key} className="py-3 flex items-center gap-3">
                        <div className="w-14 h-14 bg-[#eff0f5] rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                          {item.parfum.photo_principale ? (
                            <img src={item.parfum.photo_principale} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                              Parfum
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{item.parfum.nom}</h4>
                          <p className="text-[11px] text-gray-500">
                            {formatLabels[item.format.type_format] || item.format.type_format} • Qté: {item.quantity}
                          </p>
                          {item.selectedFragrances?.length > 0 && (
                            <p className="text-[10px] text-[#0f3d38] font-semibold mt-0.5 flex items-center gap-1">
                              <svg className="w-3 h-3 text-[#2fb49c] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                              <span>Fragrances : {item.selectedFragrances.join(' • ')}</span>
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-[#0f3d38]">
                          {(item.format.prix * item.quantity).toFixed(2)} dh
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Bundle discount badge */}
                {discountAmount > 0 && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-800">
                      {bundleDiscount.badgeText}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 space-y-2.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total articles</span>
                    <span className={`font-semibold ${discountAmount > 0 ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{subtotal.toFixed(2)} dh</span>
                  </div>

                  {/* Discount line */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span className="font-bold flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                        Remise Pack Automatique
                      </span>
                      <span className="font-bold">-{discountAmount.toFixed(2)} dh</span>
                    </div>
                  )}

                  {/* Ligne des frais de livraison dynamique */}
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <span>Livraison</span>
                      <span className="text-gray-400 font-normal">
                        ({villeChoice === 'casablanca' ? 'Casablanca' : customVille.trim() || 'Hors Casablanca'})
                      </span>
                    </span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          GRATUIT
                        </span>
                      ) : (
                        <span className="font-bold text-[#0f3d38]">20.00 dh</span>
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline text-base font-black text-[#0f3d38]">
                    <span>Total à payer</span>
                    <span className="text-xl font-bold font-serif">{grandTotal.toFixed(2)} dh MAD</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-[11px] text-gray-500 space-y-1">
                  <p className="flex items-center gap-1.5 text-gray-700 font-semibold">
                    <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Parfums 100% originaux certifiés
                  </p>
                  <p className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Livraison rapide avec suivi téléphonique
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
