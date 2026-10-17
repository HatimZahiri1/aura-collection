import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { adminAPI } from '../../api/client'

export default function AdminStock() {
  const [parfums, setParfums] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingRowId, setSavingRowId] = useState(null)
  const [changes, setChanges] = useState({}) // { [formatId]: { prix, stock } }
  const [message, setMessage] = useState('')
  const [selectedCollection, setSelectedCollection] = useState('all')
  const [search, setSearch] = useState('')
  const [infoModal, setInfoModal] = useState(null) // parfum object for detail modal

  const loadData = () => {
    setLoading(true)
    Promise.all([
      adminAPI.getParfums({ page_size: 200 }),
      adminAPI.getCollections(),
    ])
      .then(([pRes, cRes]) => {
        setParfums(pRes.data.results || pRes.data || [])
        setCollections(cRes.data.results || cRes.data || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Trouver le format principal du parfum (flacon 250ml, pack_3, pack_4 ou complet)
  const getMainFormat = (parfum) => {
    if (!parfum?.formats || parfum.formats.length === 0) return null
    return (
      parfum.formats.find((f) => f.type_format === 'flacon_250') ||
      parfum.formats.find((f) => f.type_format === 'pack_3') ||
      parfum.formats.find((f) => f.type_format === 'pack_4') ||
      parfum.formats.find((f) => f.type_format === 'complet') ||
      parfum.formats[0]
    )
  }

  const getFormatValue = (fmt, field) => {
    if (!fmt) return ''
    if (changes[fmt.id] && changes[fmt.id][field] !== undefined) {
      return changes[fmt.id][field]
    }
    return fmt[field]
  }

  const handleFieldChange = (fmt, field, value) => {
    if (!fmt) return
    setChanges((prev) => ({
      ...prev,
      [fmt.id]: {
        ...prev[fmt.id],
        prix: prev[fmt.id]?.prix !== undefined ? prev[fmt.id].prix : fmt.prix,
        stock: prev[fmt.id]?.stock !== undefined ? prev[fmt.id].stock : fmt.stock,
        [field]: field === 'stock' ? Math.max(0, parseInt(value) || 0) : value,
      },
    }))
  }

  const handleStockAdjust = (fmt, delta) => {
    if (!fmt) return
    const currentStock = parseInt(getFormatValue(fmt, 'stock')) || 0
    const newStock = Math.max(0, currentStock + delta)
    handleFieldChange(fmt, 'stock', newStock)
  }

  const isFormatChanged = (fmt) => {
    if (!fmt) return false
    return changes[fmt.id] !== undefined
  }

  const handleSaveAll = async () => {
    const entries = Object.entries(changes)
    if (entries.length === 0) return
    setSaving(true)
    setMessage('')
    try {
      for (const [id, data] of entries) {
        await adminAPI.updateFormat(id, data)
      }
      setMessage(`${entries.length} produit(s) mis à jour avec succès`)
      setChanges({})
      loadData()
    } catch {
      setMessage('Erreur lors de la mise à jour des prix et stocks')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveParfumRow = async (parfum) => {
    const fmt = getMainFormat(parfum)
    if (!fmt || !changes[fmt.id]) return

    setSavingRowId(parfum.id)
    try {
      await adminAPI.updateFormat(fmt.id, changes[fmt.id])
      setMessage(`Stock et prix de "${parfum.nom}" enregistrés avec succès !`)
      setChanges((prev) => {
        const next = { ...prev }
        delete next[fmt.id]
        return next
      })
      loadData()
    } catch {
      alert('Erreur lors de la mise à jour')
    } finally {
      setSavingRowId(null)
    }
  }

  // Filtrage par collection et recherche
  const filteredParfums = parfums.filter((p) => {
    if (selectedCollection === 'homme' && p.genre !== 'homme') return false
    if (selectedCollection === 'femme' && p.genre !== 'femme') return false
    if (selectedCollection === 'mixte' && p.genre !== 'mixte') return false
    if (selectedCollection === 'promotions' && !p.is_promo) return false
    if (selectedCollection === 'packs-speciaux' && !p.is_pack) return false
    if (
      selectedCollection !== 'all' &&
      !['homme', 'femme', 'mixte', 'promotions', 'packs-speciaux'].includes(selectedCollection)
    ) {
      const matchCol =
        p.collections?.includes(selectedCollection) ||
        p.collections_detail?.some((c) => c.slug === selectedCollection || c.id === selectedCollection)
      if (!matchCol) return false
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      const nom = (p.nom || '').toLowerCase()
      const marque = (p.marque_nom || '').toLowerCase()
      return nom.includes(q) || marque.includes(q)
    }
    return true
  })

  const countTotal = parfums.length
  const countHomme = parfums.filter((p) => p.genre === 'homme').length
  const countFemme = parfums.filter((p) => p.genre === 'femme').length
  const countMixte = parfums.filter((p) => p.genre === 'mixte').length
  const countPromo = parfums.filter((p) => p.is_promo).length
  const countPacks = parfums.filter((p) => p.is_pack).length

  // Stats globales de stock
  const stockMetrics = parfums.reduce(
    (acc, p) => {
      const fmt = getMainFormat(p)
      if (fmt) {
        const st = parseInt(getFormatValue(fmt, 'stock')) || 0
        if (st === 0) acc.rupture++
        else if (st <= 5) acc.faible++
        else acc.ok++
        acc.totalUnits += st
      }
      return acc
    },
    { rupture: 0, faible: 0, ok: 0, totalUnits: 0 }
  )

  const totalModifications = Object.keys(changes).length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#0f3d38]">Gestion des Stocks & Tarifs</h1>
          <p className="text-xs text-gray-500 mt-1">
            Gérez directement le stock et le prix unitaire de vos <strong>Gels Douche Parfumés (250ml)</strong> et <strong>Packs Spéciaux</strong>
          </p>
        </div>
        {totalModifications > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#0f3d38] hover:bg-[#134d47] text-white px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {saving ? 'Enregistrement...' : `Sauvegarder tout (${totalModifications} modif.)`}
          </button>
        )}
      </div>

      {/* KPI Cards Stock */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-gray-400">Total Unités</span>
          <p className="text-xl font-bold text-[#0f3d38] mt-1">{stockMetrics.totalUnits} flacons</p>
          <span className="text-[10px] text-gray-500">En stock global</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-emerald-600">Stock Normal</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{stockMetrics.ok} références</p>
          <span className="text-[10px] text-emerald-600">&gt; 5 flacons</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-amber-600">Stock Faible</span>
          <p className="text-xl font-bold text-amber-700 mt-1">{stockMetrics.faible} références</p>
          <span className="text-[10px] text-amber-600">1 à 5 flacons restants</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-rose-600">Ruptures</span>
          <p className="text-xl font-bold text-rose-700 mt-1">{stockMetrics.rupture} références</p>
          <span className="text-[10px] text-rose-600">Épuisés (0 stock)</span>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-xs"
        >
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{message}</span>
        </motion.div>
      )}

      {/* Onglets des Catégories */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-1.5 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSelectedCollection('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedCollection === 'all'
              ? 'bg-[#0f3d38] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#0f3d38] hover:bg-gray-100'
          }`}
        >
          <span>Tous les gels</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              selectedCollection === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {countTotal}
          </span>
        </button>

        <button
          onClick={() => setSelectedCollection('homme')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedCollection === 'homme'
              ? 'bg-[#0f3d38] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#0f3d38] hover:bg-gray-100'
          }`}
        >
          <span>Homme</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              selectedCollection === 'homme' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
            }`}
          >
            {countHomme}
          </span>
        </button>

        <button
          onClick={() => setSelectedCollection('femme')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedCollection === 'femme'
              ? 'bg-[#0f3d38] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#0f3d38] hover:bg-gray-100'
          }`}
        >
          <span>Femme</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              selectedCollection === 'femme' ? 'bg-white/20 text-white' : 'bg-pink-50 text-pink-700'
            }`}
          >
            {countFemme}
          </span>
        </button>

        {countPacks > 0 && (
          <button
            onClick={() => setSelectedCollection('packs-speciaux')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedCollection === 'packs-speciaux'
                ? 'bg-[#0f3d38] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#0f3d38] hover:bg-gray-100'
            }`}
          >
            <span>Packs Spéciaux</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedCollection === 'packs-speciaux' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-800'
              }`}
            >
              {countPacks}
            </span>
          </button>
        )}

        {countPromo > 0 && (
          <button
            onClick={() => setSelectedCollection('promotions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedCollection === 'promotions'
                ? 'bg-[#0f3d38] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#0f3d38] hover:bg-gray-100'
            }`}
          >
            <span>En Promotion</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedCollection === 'promotions' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {countPromo}
            </span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Rechercher par nom de parfum ou marque..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs text-[#0f3d38] placeholder-gray-400 focus:outline-hidden focus:border-[#0f3d38] shadow-xs transition-all"
        />
        <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Table des Gels Douche Parfumés (Sans les décants 5ml/10ml) */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-[#0f3d38] rounded-full animate-spin" />
        </div>
      ) : filteredParfums.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs text-center py-16 px-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#0f3d38]">Aucun parfum trouvé</p>
          <p className="text-xs text-gray-400 mt-1">Aucun produit ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#eff0f5]/80 border-b border-gray-200/80 text-left">
                  <th className="p-4 text-[#0f3d38] font-bold uppercase tracking-wider min-w-[240px]">
                    Gel Douche Parfumé
                  </th>
                  <th className="p-4 text-[#0f3d38] font-bold uppercase tracking-wider min-w-[150px]">
                    Format & Contenance
                  </th>
                  <th className="p-4 text-[#0f3d38] font-bold uppercase tracking-wider min-w-[140px]">
                    Prix Unitaire
                  </th>
                  <th className="p-4 text-[#0f3d38] font-bold uppercase tracking-wider min-w-[240px]">
                    Stock Disponible & Ajustement
                  </th>
                  <th className="p-4 text-[#0f3d38] font-bold uppercase tracking-wider min-w-[120px]">
                    État du Stock
                  </th>
                  <th className="p-4 text-[#0f3d38] font-bold uppercase tracking-wider text-right min-w-[140px]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredParfums.map((p) => {
                  const mainFormat = getMainFormat(p)
                  const hasChanges = isFormatChanged(mainFormat)
                  const stockVal = mainFormat ? parseInt(getFormatValue(mainFormat, 'stock')) || 0 : 0
                  const isSavingThis = savingRowId === p.id

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${hasChanges ? 'bg-amber-50/50' : 'hover:bg-gray-50/60'}`}
                    >
                      {/* Produit & Marque */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-2xs">
                            {p.photo_principale ? (
                              <img
                                src={p.photo_principale}
                                alt={p.nom}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                                Gel
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-[#0f3d38] block text-sm">{p.nom}</span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-gray-500 font-medium">{p.marque_nom || 'AURA COLLECTION'}</span>
                              {p.is_pack ? (
                                <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                                  Pack Spécial
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                                    p.genre === 'homme'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : p.genre === 'femme'
                                      ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}
                                >
                                  {p.genre}
                                </span>
                              )}
                              {p.is_promo && (
                                <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                                  Promo {p.prix_promo ? `(${parseFloat(p.prix_promo).toFixed(0)} DH)` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Format */}
                      <td className="p-4">
                        {p.is_pack ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-gray-800 block text-xs">
                              {mainFormat?.type_format === 'pack_4' ? 'Pack de 4 Gels' : 'Pack de 3 Gels'}
                            </span>
                            <span className="text-[11px] text-gray-400">250ml par flacon</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#0f3d38] block text-xs">Flacon Complet</span>
                            <span className="text-[11px] text-gray-500 font-medium">Contenance 250 ml</span>
                          </div>
                        )}
                      </td>

                      {/* Prix */}
                      <td className="p-4">
                        {mainFormat ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.01"
                              value={getFormatValue(mainFormat, 'prix')}
                              onChange={(e) => handleFieldChange(mainFormat, 'prix', e.target.value)}
                              className={`w-20 px-2.5 py-1.5 rounded-lg border text-xs font-bold text-[#0f3d38] ${
                                hasChanges
                                  ? 'border-amber-400 bg-amber-50/70 ring-1 ring-amber-300'
                                  : 'border-gray-200 bg-white focus:border-[#0f3d38]'
                              }`}
                            />
                            <span className="text-[11px] font-semibold text-gray-500">DH</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic">—</span>
                        )}
                      </td>

                      {/* Stock & Boutons d'ajustement rapide */}
                      <td className="p-4">
                        {mainFormat ? (
                          <div className="flex items-center gap-2">
                            {/* Input direct */}
                            <input
                              type="number"
                              min="0"
                              value={stockVal}
                              onChange={(e) => handleFieldChange(mainFormat, 'stock', e.target.value)}
                              className={`w-16 px-2.5 py-1.5 rounded-lg border text-center text-xs font-bold ${
                                stockVal === 0
                                  ? 'text-rose-600 border-rose-300 bg-rose-50/60'
                                  : stockVal <= 5
                                  ? 'text-amber-700 border-amber-300 bg-amber-50/60'
                                  : 'text-[#0f3d38] border-gray-200 bg-white'
                              }`}
                            />

                            {/* Boutons d'ajustement rapide */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStockAdjust(mainFormat, -1)}
                                disabled={stockVal <= 0}
                                title="Enlever 1 unité"
                                className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold transition-all disabled:opacity-30 cursor-pointer text-xs"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => handleStockAdjust(mainFormat, 1)}
                                title="Ajouter 1 unité"
                                className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center text-[#0f3d38] font-bold transition-all cursor-pointer text-xs"
                              >
                                +1
                              </button>
                              <button
                                onClick={() => handleStockAdjust(mainFormat, 10)}
                                title="Ajouter 10 unités (+10)"
                                className="px-2 h-7 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold transition-all cursor-pointer text-[10px]"
                              >
                                +10
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic">—</span>
                        )}
                      </td>

                      {/* État du stock */}
                      <td className="p-4">
                        {stockVal === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Rupture
                          </span>
                        ) : stockVal <= 5 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Faible ({stockVal})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            En stock ({stockVal})
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setInfoModal(p)}
                            title="Voir la fiche détaillée du produit"
                            className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-gray-500 hover:text-[#0f3d38] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {hasChanges ? (
                            <button
                              onClick={() => handleSaveParfumRow(p)}
                              disabled={isSavingThis}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f3d38] hover:bg-[#134d47] text-white rounded-full text-xs font-bold uppercase transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
                            >
                              <svg className={`w-3.5 h-3.5 ${isSavingThis ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{isSavingThis ? '...' : 'Enregistrer'}</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-semibold px-2 py-1">
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              À jour
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Fiche Produit (Œil 👁️) */}
      <AnimatePresence>
        {infoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 relative"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all cursor-pointer font-bold"
              >
                ✕
              </button>

              {/* Product Header */}
              <div className="flex items-start gap-4 pr-10 pb-6 border-b border-gray-100">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-sm">
                  {infoModal.photo_principale ? (
                    <img
                      src={infoModal.photo_principale}
                      alt={infoModal.nom}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      AURA
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2fb49c]">
                    {infoModal.marque_nom || 'AURA COLLECTION'}
                  </span>
                  <h3 className="text-xl font-bold font-serif text-[#0f3d38] mt-0.5">
                    {infoModal.nom}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {infoModal.is_pack ? 'Pack Spécial' : 'Gel 250ml'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                      Genre : {infoModal.genre_display || infoModal.genre}
                    </span>
                    {infoModal.is_promo && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                        En Promotion
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      infoModal.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {infoModal.actif ? 'Actif en boutique' : 'Masqué'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formats & Stocks Breakdown */}
              <div className="py-5 border-b border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Déclinaisons de Format & Valorisation Stock
                </h4>
                <div className="space-y-2">
                  {infoModal.formats?.map((fmt) => {
                    const price = parseFloat(getFormatValue(fmt, 'prix')) || 0
                    const stock = parseInt(getFormatValue(fmt, 'stock')) || 0
                    const valuation = price * stock

                    return (
                      <div
                        key={fmt.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200/80 gap-2"
                      >
                        <div>
                          <p className="font-bold text-xs text-[#0f3d38]">
                            {fmt.type_format_display || fmt.type_format} ({fmt.contenance_ml} ml)
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Prix unitaire : <strong className="text-gray-800">{price.toFixed(2)} DH</strong>
                            {fmt.prix_promo ? ` (Promo: ${parseFloat(fmt.prix_promo).toFixed(2)} DH)` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 sm:text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            stock === 0
                              ? 'bg-rose-100 text-rose-800'
                              : stock <= 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {stock} en stock
                          </span>
                          <span className="text-xs font-extrabold text-[#0f3d38]">
                            Val. : {valuation.toFixed(2)} DH
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Description & Notes Olfactives */}
              <div className="py-5 space-y-4">
                {infoModal.description && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Description du parfum
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      {infoModal.description}
                    </p>
                  </div>
                )}

                {(infoModal.notes_tete || infoModal.notes_coeur || infoModal.notes_fond) && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Pyramide Olfactive
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {infoModal.notes_tete && (
                        <div className="bg-[#f0fbf8] p-3 rounded-xl border border-[#d4e8e3]">
                          <span className="text-[10px] font-bold uppercase text-[#2fb49c] block">Notes de tête</span>
                          <p className="font-medium text-[#0f3d38] mt-0.5">{infoModal.notes_tete}</p>
                        </div>
                      )}
                      {infoModal.notes_coeur && (
                        <div className="bg-[#f0fbf8] p-3 rounded-xl border border-[#d4e8e3]">
                          <span className="text-[10px] font-bold uppercase text-[#2fb49c] block">Notes de cœur</span>
                          <p className="font-medium text-[#0f3d38] mt-0.5">{infoModal.notes_coeur}</p>
                        </div>
                      )}
                      {infoModal.notes_fond && (
                        <div className="bg-[#f0fbf8] p-3 rounded-xl border border-[#d4e8e3]">
                          <span className="text-[10px] font-bold uppercase text-[#2fb49c] block">Notes de fond</span>
                          <p className="font-medium text-[#0f3d38] mt-0.5">{infoModal.notes_fond}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Parfums inclus dans le pack */}
                {infoModal.is_pack && infoModal.parfums_inclus_detail?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Gels douche inclus dans ce pack ({infoModal.parfums_inclus_detail.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {infoModal.parfums_inclus_detail.map((inc) => (
                        <div key={inc.id} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200">
                          {inc.photo_principale && (
                            <img src={inc.photo_principale} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#0f3d38] truncate">{inc.nom}</p>
                            <span className="text-[10px] text-gray-400 uppercase">{inc.marque_nom}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <a
                  href={`/produit/${infoModal.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#2fb49c] hover:underline flex items-center gap-1"
                >
                  <span>Ouvrir sur la boutique</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button
                  type="button"
                  onClick={() => setInfoModal(null)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-full transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
