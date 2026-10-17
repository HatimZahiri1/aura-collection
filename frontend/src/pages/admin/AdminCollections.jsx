import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { adminAPI } from '../../api/client'

export default function AdminCollections() {
  const [collections, setCollections] = useState([])
  const [allParfums, setAllParfums] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')

  // Modal Gérer les Parfums
  const [selectedColForParfums, setSelectedColForParfums] = useState(null)
  const [assignedParfumIds, setAssignedParfumIds] = useState([])
  const [parfumSearch, setParfumSearch] = useState('')
  const [savingParfums, setSavingParfums] = useState(false)

  // Formulaire Collection
  const [formData, setFormData] = useState({
    nom: '',
    slug: '',
    description: '',
    actif: true,
    ordre: 0,
    image: null,
  })
  const [saving, setSaving] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      adminAPI.getCollections(),
      adminAPI.getParfums({ page_size: 200 }),
    ])
      .then(([cRes, pRes]) => {
        setCollections(cRes.data.results || cRes.data)
        setAllParfums(pRes.data.results || pRes.data)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setFormData({
      nom: '',
      slug: '',
      description: '',
      actif: true,
      ordre: collections.length + 1,
      image: null,
    })
    setEditingId(null)
  }

  const handleEdit = (col) => {
    setEditingId(col.id)
    setFormData({
      nom: col.nom,
      slug: col.slug,
      description: col.description || '',
      actif: col.actif,
      ordre: col.ordre || 0,
      image: null,
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const data = new FormData()
      data.append('nom', formData.nom)
      // Generate slug if not provided
      const slugVal = formData.slug.trim() || formData.nom.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      data.append('slug', slugVal)
      data.append('description', formData.description)
      data.append('actif', formData.actif)
      data.append('ordre', formData.ordre)
      if (formData.image) {
        data.append('image', formData.image)
      }

      if (editingId) {
        await adminAPI.updateCollection(editingId, data)
        setMessage('Collection modifiée avec succès')
      } else {
        await adminAPI.createCollection(data)
        setMessage('Nouvelle collection créée avec succès')
      }

      setShowModal(false)
      resetForm()
      loadData()
    } catch (err) {
      setMessage('Erreur: ' + (err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Erreur inconnue'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (col) => {
    if (!window.confirm(`Supprimer la collection "${col.nom}" ? Cette action est irréversible.`)) return
    try {
      await adminAPI.deleteCollection(col.id)
      setMessage('Collection supprimée')
      loadData()
    } catch {
      alert('Erreur lors de la suppression de la collection')
    }
  }

  // Ouvrir le gestionnaire d'association de parfums
  const openParfumManager = (col) => {
    setSelectedColForParfums(col)
    const cSlug = (col.slug || '').toLowerCase()
    let currentlyAssigned = []
    if (cSlug === 'promotions') {
      currentlyAssigned = allParfums.filter((p) => Boolean(p.is_promo) || p.collections?.includes(col.id)).map((p) => p.id)
    } else if (cSlug === 'packs-speciaux') {
      currentlyAssigned = allParfums.filter((p) => Boolean(p.is_pack) || p.collections?.includes(col.id)).map((p) => p.id)
    } else if (cSlug === 'gel-parfum-homme' || cSlug === 'parfums-homme') {
      currentlyAssigned = allParfums.filter((p) => !p.is_pack && p.genre === 'homme').map((p) => p.id)
    } else if (cSlug === 'gel-parfum-femme' || cSlug === 'parfums-femme') {
      currentlyAssigned = allParfums.filter((p) => !p.is_pack && p.genre === 'femme').map((p) => p.id)
    } else if (cSlug === 'parfums-unisexe') {
      currentlyAssigned = allParfums.filter((p) => !p.is_pack && p.genre === 'mixte').map((p) => p.id)
    } else {
      currentlyAssigned = allParfums
        .filter((p) => p.collections?.includes(col.id) || p.collections_detail?.some((c) => c.id === col.id))
        .map((p) => p.id)
    }
    setAssignedParfumIds(currentlyAssigned)
    setParfumSearch('')
  }

  const toggleParfumAssignment = (parfumId) => {
    setAssignedParfumIds((prev) =>
      prev.includes(parfumId) ? prev.filter((id) => id !== parfumId) : [...prev, parfumId]
    )
  }

  const handleSaveParfumAssignment = async () => {
    if (!selectedColForParfums) return
    setSavingParfums(true)
    try {
      await adminAPI.assignParfumsToCollection(selectedColForParfums.id, assignedParfumIds)
      setMessage(`Parfums de la collection "${selectedColForParfums.nom}" mis à jour avec succès`)
      setSelectedColForParfums(null)
      loadData()
    } catch (err) {
      alert("Erreur lors de l'enregistrement des parfums dans la collection")
    } finally {
      setSavingParfums(false)
    }
  }

  const filteredParfumsToAssign = allParfums.filter((p) => {
    if (!parfumSearch.trim()) return true
    const q = parfumSearch.toLowerCase()
    return p.nom.toLowerCase().includes(q) || (p.marque_nom || '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#0f3d38]">Gestion des Collections</h1>
          <p className="text-xs text-gray-500 mt-1">
            Créez, modifiez vos collections et choisissez exactement les parfums qui y apparaissent
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="inline-flex items-center gap-2 bg-[#0f3d38] hover:bg-[#1b5e54] text-white px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-sm hover:shadow-md cursor-pointer self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle Collection
        </button>
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

      {/* Collections Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-[#0f3d38] rounded-full animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs text-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#0f3d38]">Aucune collection créée</p>
          <p className="text-xs text-gray-400 mt-1">Créez votre première collection en cliquant sur "+ Nouvelle Collection".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => {
            let count = col.nombre_parfums
            if (count === undefined) {
              const cSlug = (col.slug || '').toLowerCase()
              if (cSlug === 'promotions') {
                count = allParfums.filter((p) => Boolean(p.is_promo)).length
              } else if (cSlug === 'packs-speciaux') {
                count = allParfums.filter((p) => Boolean(p.is_pack)).length
              } else if (cSlug === 'gel-parfum-homme' || cSlug === 'parfums-homme') {
                count = allParfums.filter((p) => !p.is_pack && p.genre === 'homme').length
              } else if (cSlug === 'gel-parfum-femme' || cSlug === 'parfums-femme') {
                count = allParfums.filter((p) => !p.is_pack && p.genre === 'femme').length
              } else if (cSlug === 'parfums-unisexe') {
                count = allParfums.filter((p) => !p.is_pack && p.genre === 'mixte').length
              } else {
                count = allParfums.filter(
                  (p) => p.collections?.includes(col.id) || p.collections_detail?.some((c) => c.id === col.id)
                ).length
              }
            }

            return (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                        {col.image ? (
                          <img src={col.image} alt={col.nom} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#0f3d38]">{col.nom}</h3>
                        <span className="text-[10px] font-mono text-gray-400 block">/catalogue?collection={col.slug}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        col.actif ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {col.actif ? 'Active' : 'Masquée'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                    {col.description || 'Collection accessible depuis la boutique et le catalogue.'}
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#eff0f5] text-[#0f3d38] border border-gray-200">
                      <svg className="w-3.5 h-3.5 text-[#0f3d38]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      {count} {count > 1 ? 'parfums associés' : 'parfum associé'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openParfumManager(col)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f3d38] hover:bg-[#1b5e54] text-white rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Gérer les parfums
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(col)}
                      className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-[#0f3d38] flex items-center justify-center transition-colors cursor-pointer"
                      title="Modifier la collection"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(col)}
                      className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="Supprimer la collection"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal Créer / Modifier Collection */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-8 w-full max-w-lg"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#0f3d38]">
                    {editingId ? 'Modifier la Collection' : 'Nouvelle Collection'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Visible sur la boutique et dans les filtres du catalogue</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Nom de la collection *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Parfums Homme, Promotions, Packs Spéciaux..."
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Identifiant URL (Slug)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Ex: parfums-homme, promotions (généré auto si vide)"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Description de la collection
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Présentation de la collection pour les clients..."
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Photo de couverture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                    className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-700 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#0f3d38] file:text-white hover:file:bg-[#1b5e54] cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 text-gray-700 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.actif}
                      onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                      className="accent-[#0f3d38] rounded w-4 h-4"
                    />
                    Collection Active (visible dans la boutique)
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#0f3d38] hover:bg-[#1b5e54] text-white py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    {saving ? 'Enregistrement...' : editingId ? 'Enregistrer les modifications' : 'Créer la collection'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-semibold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Associer des Parfums à la Collection */}
      <AnimatePresence>
        {selectedColForParfums && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedColForParfums(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4 shrink-0">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#0f3d38]">
                    Parfums de la collection : <span className="underline decoration-[#0f3d38]/30">{selectedColForParfums.nom}</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Cochez les parfums que vous souhaitez afficher dans cette collection
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedColForParfums(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Barre de recherche dans les parfums */}
              <div className="relative mb-4 shrink-0">
                <input
                  type="text"
                  placeholder="Rechercher un parfum par nom, marque..."
                  value={parfumSearch}
                  onChange={(e) => setParfumSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Sélection rapide */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2 px-1 shrink-0">
                <span>{assignedParfumIds.length} parfum(s) sélectionné(s)</span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignedParfumIds(allParfums.map((p) => p.id))}
                    className="text-[#0f3d38] font-semibold hover:underline cursor-pointer"
                  >
                    Tout cocher
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setAssignedParfumIds([])}
                    className="text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    Tout décocher
                  </button>
                </div>
              </div>

              {/* Liste des parfums avec checkboxes */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 pr-1 space-y-1">
                {filteredParfumsToAssign.map((p) => {
                  const isChecked = assignedParfumIds.includes(p.id)
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                        isChecked ? 'bg-blue-50/70 border border-blue-200/80' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleParfumAssignment(p.id)}
                          className="accent-[#0f3d38] w-4 h-4 rounded"
                        />
                        <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                          <img
                            src={p.photo_principale || ''}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0f3d38]">{p.nom}</p>
                          <p className="text-[11px] text-gray-400">
                            {p.marque_nom} • <span className="capitalize">{p.genre}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isChecked ? 'bg-[#0f3d38] text-white' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isChecked ? 'Inclus' : 'Non inclus'}
                      </span>
                    </label>
                  )
                })}
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4 flex gap-3 shrink-0">
                <button
                  type="button"
                  disabled={savingParfums}
                  onClick={handleSaveParfumAssignment}
                  className="flex-1 bg-[#0f3d38] hover:bg-[#1b5e54] text-white py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md"
                >
                  {savingParfums ? 'Enregistrement...' : `Valider (${assignedParfumIds.length} parfums)`}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedColForParfums(null)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-semibold transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
