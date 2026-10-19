import { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { adminAPI } from '../../api/client'

export default function AdminOrders() {
  const { refreshStats } = useOutletContext() || {}
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Sélection multiple & Suppression groupée
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState('')

  // Filtres et Tri
  const [periode, setPeriode] = useState('all') // 'all' | 'jour' | 'semaine' | 'mois'
  const [statutFilter, setStatutFilter] = useState('all') // 'all' | 'en_attente' | 'confirmee' | 'en_livraison' | 'livree' | 'annulee'
  const [sortBy, setSortBy] = useState('-created_at') // '-created_at' | 'created_at' | '-total' | 'total' | 'statut'
  const [search, setSearch] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setCurrentPage(1)
  }, [periode, statutFilter, sortBy, search])

  const loadCommandes = () => {
    setLoading(true)
    const params = {}
    if (periode !== 'all') params.periode = periode
    if (statutFilter !== 'all') params.statut = statutFilter
    if (sortBy) params.ordering = sortBy

    adminAPI.getCommandes(params)
      .then(res => {
        const list = res.data.results || res.data || []
        setCommandes(list)
        if (list.length > 0 && !selectedOrder) {
          // Preselect first order for convenience on desktop
          // setSelectedOrder(list[0])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCommandes()
  }, [periode, statutFilter, sortBy])

  const handleViewDetail = async (orderId) => {
    setDetailLoading(true)
    try {
      const res = await adminAPI.getCommande(orderId)
      setSelectedOrder(res.data)
    } catch { }
    finally { setDetailLoading(false) }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminAPI.updateCommande(orderId, { statut: newStatus })
      loadCommandes()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, statut: newStatus }))
      }
      if (refreshStats) {
        refreshStats()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return
    setDeleting(true)
    try {
      await adminAPI.deleteCommande(orderToDelete.id)
      setCommandes(prev => prev.filter(c => c.id !== orderToDelete.id))
      if (selectedOrder?.id === orderToDelete.id) {
        setSelectedOrder(null)
      }
      setOrderToDelete(null)
      if (refreshStats) {
        refreshStats()
      }
    } catch (err) {
      console.error('Erreur suppression commande:', err)
      alert("Une erreur est survenue lors de la suppression de la commande.")
    } finally {
      setDeleting(false)
    }
  }

  // Fonctions de sélection multiple & suppression groupée
  const toggleSelectOrder = (orderId, e) => {
    if (e) e.stopPropagation()
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    )
  }

  const handleToggleSelectPage = () => {
    const pageIds = paginatedCommandes.map(c => c.id)
    const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedOrderIds.includes(id))
    if (allPageSelected) {
      setSelectedOrderIds(prev => prev.filter(id => !pageIds.includes(id)))
    } else {
      const merged = new Set([...selectedOrderIds, ...pageIds])
      setSelectedOrderIds(Array.from(merged))
    }
  }

  const handleSelectAllFiltered = () => {
    setSelectedOrderIds(filteredCommandes.map(c => c.id))
  }

  const handleDeselectAll = () => {
    setSelectedOrderIds([])
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return
    setBulkDeleting(true)
    try {
      const count = selectedOrderIds.length
      await adminAPI.bulkDeleteCommandes(selectedOrderIds)
      setCommandes(prev => prev.filter(c => !selectedOrderIds.includes(c.id)))
      if (selectedOrder && selectedOrderIds.includes(selectedOrder.id)) {
        setSelectedOrder(null)
      }
      setSelectedOrderIds([])
      setShowBulkDeleteModal(false)
      setBulkSuccessMessage(`${count} commande(s) supprimée(s) avec succès.`)
      setTimeout(() => setBulkSuccessMessage(''), 5000)
      if (refreshStats) {
        refreshStats()
      }
    } catch (err) {
      console.error('Erreur suppression multiple:', err)
      alert("Une erreur est survenue lors de la suppression des commandes sélectionnées.")
    } finally {
      setBulkDeleting(false)
    }
  }

  const formatPrice = (price) => `${parseFloat(price || 0).toLocaleString('fr-MA')} MAD`
  
  const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const statusColors = {
    en_attente: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmee: 'bg-blue-50 text-blue-700 border-blue-200',
    en_livraison: 'bg-purple-50 text-purple-700 border-purple-200',
    livree: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    annulee: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  const statusLabels = {
    en_attente: 'En attente',
    confirmee: 'Confirmée',
    en_livraison: 'En livraison',
    livree: 'Livrée',
    annulee: 'Annulée',
  }

  // Filtrage local supplémentaire par recherche client / téléphone / ville / ID
  const filteredCommandes = useMemo(() => {
    let list = [...commandes]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => 
        String(c.id).includes(q) ||
        (c.nom_client || '').toLowerCase().includes(q) ||
        (c.telephone || '').toLowerCase().includes(q) ||
        (c.ville || '').toLowerCase().includes(q)
      )
    }

    // Client-side sort fallback if needed
    if (sortBy === 'statut') {
      const rank = { en_attente: 0, confirmee: 1, en_livraison: 2, livree: 3, annulee: 4 }
      list.sort((a, b) => (rank[a.statut] ?? 9) - (rank[b.statut] ?? 9))
    }

    return list
  }, [commandes, search, sortBy])

  // Pagination des commandes
  const totalOrders = filteredCommandes.length
  const totalPages = Math.ceil(totalOrders / pageSize) || 1
  const paginatedCommandes = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCommandes.slice(start, start + pageSize)
  }, [filteredCommandes, currentPage, pageSize])

  // Statistiques de la sélection actuelle
  const statsSelection = useMemo(() => {
    const totalCount = filteredCommandes.length
    const enAttenteCount = filteredCommandes.filter(c => c.statut === 'en_attente').length
    const chiffreAffaires = filteredCommandes
      .filter(c => c.statut !== 'annulee')
      .reduce((acc, c) => acc + parseFloat(c.total || 0), 0)

    return { totalCount, enAttenteCount, chiffreAffaires }
  }, [filteredCommandes])

  // Total des commandes cochées / sélectionnées pour la suppression
  const selectedOrdersTotal = useMemo(() => {
    return filteredCommandes
      .filter(c => selectedOrderIds.includes(c.id))
      .reduce((acc, c) => acc + parseFloat(c.total || 0), 0)
  }, [filteredCommandes, selectedOrderIds])

  const handleWhatsAppCustomer = (order) => {
    let articlesSummary = ''
    if (order.lignes && order.lignes.length > 0) {
      articlesSummary = '\n\nDétail des articles :\n' + order.lignes.map(l => {
        let lineStr = `- ${l.quantite}x ${l.parfum_nom}`
        if (l.fragrances_choisies) {
          lineStr += ` (Fragrances: ${l.fragrances_choisies})`
        }
        return lineStr
      }).join('\n')
    }
    const text = `Bonjour ${order.nom_client}, nous vous contactons concernant votre commande #${order.id} sur AURA COLLECTION d'un montant de ${formatPrice(order.total)}.${articlesSummary}\n\nVotre statut actuel est : "${statusLabels[order.statut] || order.statut}".`
    const phoneClean = (order.telephone || '').replace(/[^0-9]/g, '')
    const fullPhone = phoneClean.startsWith('0') ? `212${phoneClean.slice(1)}` : phoneClean
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#0f3d38]">Gestion des Commandes</h1>
          <p className="text-xs text-gray-500 mt-1">
            Traitez, filtrez et organisez vos commandes par <strong>jour</strong>, <strong>semaine</strong> ou <strong>mois</strong>
          </p>
        </div>

        {/* Bouton d'actualisation rapide */}
        <button
          onClick={loadCommandes}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-[#0f3d38] rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* Alerte Succès Suppression Multiple */}
      <AnimatePresence>
        {bulkSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{bulkSuccessMessage}</span>
            </div>
            <button
              onClick={() => setBulkSuccessMessage('')}
              className="text-emerald-700 hover:text-emerald-900 text-sm font-bold cursor-pointer"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3 Cartes de Synthèse de la Période Active */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              Commandes ({periode === 'jour' ? 'Aujourd\'hui' : periode === 'semaine' ? 'Cette semaine' : periode === 'mois' ? 'Ce mois' : 'Total'})
            </span>
            <span className="text-2xl font-extrabold text-[#0f3d38] mt-0.5 block">
              {statsSelection.totalCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              Chiffre d'Affaires de la période
            </span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-0.5 block">
              {formatPrice(statsSelection.chiffreAffaires)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              À Traiter en Priorité
            </span>
            <span className={`text-2xl font-extrabold mt-0.5 block ${statsSelection.enAttenteCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              {statsSelection.enAttenteCount} en attente
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Barre de Filtrage par Période (Jour, Semaine, Mois, Tout) & Tri */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-3 shadow-xs space-y-3">
        {/* Ligne 1: Sélecteur de Période (Pills) & Tri */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Périodes demandées : Jour, Semaine, Mois, Toutes */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-1 hidden sm:inline">
              Période :
            </span>

            {[
              { id: 'all', label: 'Toutes les périodes' },
              { id: 'jour', label: 'Aujourd\'hui (Jour)' },
              { id: 'semaine', label: 'Cette Semaine' },
              { id: 'mois', label: 'Ce Mois' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriode(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  periode === p.id
                    ? 'bg-[#0f3d38] text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Tri des commandes */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 shrink-0">
              Trier par :
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#0f3d38] focus:outline-hidden focus:border-[#0f3d38] cursor-pointer"
            >
              <option value="-created_at">Plus récentes d'abord</option>
              <option value="created_at">Plus anciennes d'abord</option>
              <option value="-total">Montant : Décroissant</option>
              <option value="total">Montant : Croissant</option>
              <option value="statut">Par statut (En attente d'abord)</option>
            </select>
          </div>
        </div>

        {/* Ligne 2: Filtre par statut & Recherche rapide */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-1 hidden sm:inline">
              Statut :
            </span>
            <button
              onClick={() => setStatutFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                statutFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tous
            </button>
            {Object.entries(statusLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatutFilter(key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  statutFilter === key ? 'bg-[#0f3d38] text-white shadow-2xs' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Champ de recherche */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Rechercher par client, tél, ville, #ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#0f3d38] placeholder-gray-400 focus:bg-white focus:outline-hidden focus:border-[#0f3d38]"
            />
            <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs cursor-pointer">
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Affichage des Commandes */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-[#0f3d38] rounded-full animate-spin" />
        </div>
      ) : filteredCommandes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs text-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4 text-[#0f3d38]">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-base font-serif font-bold text-[#0f3d38] mb-1">
            Aucune commande trouvée
          </h3>
          <p className="text-xs text-gray-500">
            Aucune commande ne correspond aux filtres sélectionnés ({periode === 'all' ? 'toutes périodes' : periode}).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Liste des Commandes */}
          <div className="lg:col-span-2 space-y-3">
            {/* Barre de sélection multiple */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-3 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={paginatedCommandes.length > 0 && paginatedCommandes.every(c => selectedOrderIds.includes(c.id))}
                    onChange={handleToggleSelectPage}
                    className="w-4 h-4 rounded text-[#0f3d38] border-gray-300 focus:ring-[#2fb49c] cursor-pointer"
                  />
                  <span>Sélectionner cette page ({paginatedCommandes.length})</span>
                </label>

                {filteredCommandes.length > paginatedCommandes.length && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-xs text-[#2fb49c] hover:underline font-semibold cursor-pointer"
                  >
                    Sélectionner les {filteredCommandes.length} commandes
                  </button>
                )}
              </div>

              {selectedOrderIds.length > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs font-bold text-[#0f3d38] bg-[#f0fbf8] px-2.5 py-1 rounded-lg border border-[#d4e8e3]">
                    {selectedOrderIds.length} sélectionnée{selectedOrderIds.length > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Supprimer ({selectedOrderIds.length})</span>
                  </button>
                </div>
              )}
            </div>

            {paginatedCommandes.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                  selectedOrderIds.includes(order.id)
                    ? 'border-[#2fb49c] bg-[#f0fbf8]/50 ring-2 ring-[#2fb49c]/30'
                    : selectedOrder?.id === order.id
                    ? 'border-[#0f3d38] ring-2 ring-[#0f3d38]/10'
                    : 'border-gray-200/90 hover:border-gray-300'
                }`}
                onClick={() => handleViewDetail(order.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Checkbox de sélection individuelle */}
                    <div
                      onClick={(e) => toggleSelectOrder(order.id, e)}
                      className="pt-0.5 shrink-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={(e) => toggleSelectOrder(order.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded text-[#0f3d38] border-gray-300 focus:ring-[#2fb49c] cursor-pointer"
                        aria-label={`Sélectionner la commande #${order.id}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <span className="text-sm font-bold text-[#0f3d38]">Commande #{order.id}</span>
                      <span className="text-xs font-semibold text-gray-800">{order.nom_client}</span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[order.statut] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[order.statut] || order.statut}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#0f3d38]">{order.ville}</span>
                      <span>•</span>
                      <span>{order.telephone}</span>
                      <span>•</span>
                      <span className="text-gray-400">{formatDate(order.created_at)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 shrink-0">
                    <div className="text-right">
                      <p className="text-base font-extrabold text-[#0f3d38]">{formatPrice(order.total)}</p>
                      <p className="text-gray-400 text-[11px]">{order.nombre_articles || 1} article(s)</p>
                    </div>
                    {/* Bouton de suppression définitive */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOrderToDelete(order)
                      }}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Supprimer définitivement cette commande"
                      aria-label="Supprimer définitivement la commande"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Boutons d'Action Rapide : Contact WhatsApp + Statuts */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-gray-400 mr-1">Statut :</span>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(order.id, key)}
                        disabled={order.statut === key}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          order.statut === key
                            ? 'bg-[#0f3d38] text-white shadow-2xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Bouton WhatsApp Client direct */}
                  <button
                    onClick={() => handleWhatsAppCustomer(order)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[11px] font-bold rounded-full transition-all shadow-2xs cursor-pointer ml-auto"
                    title="Envoyer un message WhatsApp au client"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                    </svg>
                    <span>WhatsApp</span>
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                  <span>
                    Affichage de <strong>{Math.min((currentPage - 1) * pageSize + 1, totalOrders)}</strong> à{' '}
                    <strong>{Math.min(currentPage * pageSize, totalOrders)}</strong> sur{' '}
                    <strong>{totalOrders}</strong> commande(s)
                  </span>
                  <span className="text-gray-300">•</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-[#0f3d38] focus:outline-none cursor-pointer"
                  >
                    <option value={5}>5 par page</option>
                    <option value={10}>10 par page</option>
                    <option value={20}>20 par page</option>
                    <option value={50}>50 par page</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-[#0f3d38] hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    ← Précédent
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1]
                        return (
                          <div key={p} className="flex items-center">
                            {prev && p - prev > 1 && <span className="px-1 text-gray-400 text-xs">…</span>}
                            <button
                              onClick={() => setCurrentPage(p)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentPage === p
                                  ? 'bg-[#0f3d38] text-white shadow-2xs'
                                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            >
                              {p}
                            </button>
                          </div>
                        )
                      })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-[#0f3d38] hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panneau Détail de la Commande sélectionnée */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {detailLoading ? (
                <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-8 text-center">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0f3d38] rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Chargement des détails...</p>
                </div>
              ) : selectedOrder ? (
                <motion.div
                  key={selectedOrder.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sticky top-28"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#0f3d38] uppercase tracking-wider">
                        Commande #{selectedOrder.id}
                      </h3>
                      <span className="text-[10px] text-gray-400 block">{formatDate(selectedOrder.created_at)}</span>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[selectedOrder.statut] || 'bg-gray-100'}`}>
                      {statusLabels[selectedOrder.statut] || selectedOrder.statut}
                    </span>
                  </div>

                  <div className="space-y-3 mb-5 text-xs">
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-semibold block mb-0.5">Client</span>
                      <p className="text-[#0f3d38] font-bold text-sm">{selectedOrder.nom_client}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-semibold block mb-0.5">Téléphone</span>
                      <div className="flex items-center gap-2">
                        <a href={`tel:${selectedOrder.telephone}`} className="text-[#0f3d38] hover:underline font-bold">
                          {selectedOrder.telephone}
                        </a>
                        <button
                          onClick={() => handleWhatsAppCustomer(selectedOrder)}
                          className="px-2 py-0.5 bg-[#25D366] text-white rounded text-[10px] font-semibold hover:bg-[#20ba5a] cursor-pointer"
                        >
                          WhatsApp
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-semibold block mb-0.5">Adresse de livraison</span>
                      <p className="text-gray-700 font-medium">{selectedOrder.adresse}, <strong className="text-[#0f3d38]">{selectedOrder.ville}</strong></p>
                    </div>
                    {selectedOrder.notes && (
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase font-semibold block mb-0.5">Notes du client</span>
                        <p className="text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 italic">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Articles commandés */}
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block mb-2.5">Articles commandés</span>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedOrder.lignes?.map((ligne) => (
                        <div key={ligne.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                          <div className="flex justify-between items-start text-xs">
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-[#0f3d38] truncate">{ligne.parfum_nom}</p>
                              <p className="text-gray-500 text-[10px]">
                                {ligne.format_detail?.contenance_ml || ''}ml × {ligne.quantite}
                              </p>
                            </div>
                            <span className="font-extrabold text-[#0f3d38] shrink-0">
                              {formatPrice(ligne.sous_total)}
                            </span>
                          </div>

                          {/* Fragrances choisies pour les packs */}
                          {ligne.fragrances_choisies && (
                            <div className="mt-2 pt-1.5 border-t border-gray-200/60">
                              <span className="text-[9px] font-bold uppercase text-emerald-700 block">
                                Fragrances sélectionnées :
                              </span>
                              <p className="text-[10px] text-gray-700 font-medium mt-0.5 bg-white p-1.5 rounded-lg border border-gray-200/80">
                                {ligne.fragrances_choisies}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Frais et Total */}
                  <div className="border-t border-gray-100 pt-3 space-y-1.5 mb-2 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Frais d'expédition</span>
                      <span className="font-semibold text-[#0f3d38]">
                        {parseFloat(selectedOrder.frais_livraison || 0) === 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Gratuit (Casablanca)
                          </span>
                        ) : (
                          `${parseFloat(selectedOrder.frais_livraison).toFixed(2)} MAD`
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total à encaisser</span>
                    <span className="text-xl font-serif font-black text-[#0f3d38]">{formatPrice(selectedOrder.total)}</span>
                  </div>

                  {/* Bouton de suppression dans le panneau latéral */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end">
                    <button
                      onClick={() => setOrderToDelete(selectedOrder)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-full transition-all cursor-pointer shadow-2xs"
                      title="Supprimer définitivement cette commande"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Supprimer la commande</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3 text-[#0f3d38]">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-[#0f3d38] mb-1">Sélectionnez une commande</p>
                  <p className="text-[11px] text-gray-400">Cliquez sur une commande pour afficher ses détails complets et contacter le client</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Modal Confirmation de Suppression Définitive */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleting && setOrderToDelete(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-10"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
                Supprimer définitivement la commande #{orderToDelete.id} ?
              </h3>
              <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
                Cette commande au nom de <strong>{orderToDelete.nom_client}</strong> ({formatPrice(orderToDelete.total)}) sera définitivement effacée de la base de données. Cette action est irréversible.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  disabled={deleting}
                  className="flex-1 py-3 px-4 rounded-full border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? 'Suppression...' : 'Supprimer définitivement'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Action Bar for Bulk Delete */}
      <AnimatePresence>
        {selectedOrderIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0f3d38] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4 sm:gap-6 backdrop-blur-md max-w-[95vw]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#2fb49c] text-white flex items-center justify-center text-xs font-bold">
                {selectedOrderIds.length}
              </span>
              <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                {selectedOrderIds.length} commande{selectedOrderIds.length > 1 ? 's' : ''} sélectionnée{selectedOrderIds.length > 1 ? 's' : ''}
              </span>
              <span className="text-xs text-white/60 hidden md:inline">
                ({formatPrice(selectedOrdersTotal)})
              </span>
            </div>

            <div className="h-4 w-px bg-white/20 hidden sm:block" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:shadow-rose-900/30 cursor-pointer whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Supprimer la sélection ({selectedOrderIds.length})</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Confirmation de Suppression Multiple */}
      <AnimatePresence>
        {showBulkDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !bulkDeleting && setShowBulkDeleteModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-10"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
                Supprimer {selectedOrderIds.length} commande{selectedOrderIds.length > 1 ? 's' : ''} ?
              </h3>
              <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
                Vous avez sélectionné <strong>{selectedOrderIds.length} commande{selectedOrderIds.length > 1 ? 's' : ''}</strong> pour un montant total de <strong>{formatPrice(selectedOrdersTotal)}</strong>. Ces commandes seront définitivement effacées de la base de données. Cette action est irréversible.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={bulkDeleting}
                  className="flex-1 py-3 px-4 rounded-full border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
                  disabled={bulkDeleting}
                  className="flex-1 py-3 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {bulkDeleting ? 'Suppression...' : `Supprimer définitivement (${selectedOrderIds.length})`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
