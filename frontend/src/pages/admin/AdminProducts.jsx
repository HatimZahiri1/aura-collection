import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { adminAPI } from '../../api/client'

export default function AdminProducts() {
  const [parfums, setParfums] = useState([])
  const [marques, setMarques] = useState([])
  const [collectionsList, setCollectionsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCollection, setSelectedCollection] = useState('all') // 'all' | 'gel-parfum-homme' | 'gel-parfum-femme' | 'promotions' | 'packs-speciaux'

  // Standard Product Modal
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    nom: '', marque: '', description: '', genre: 'homme',
    famille_olfactive: 'boisee', concentration: 'gel',
    notes_tete: '', notes_coeur: '', notes_fond: '',
    actif: true, mis_en_avant: false,
    is_promo: false, prix_promo: '',
    collections: [],
    photo_principale: null,
    formats: [
      { type_format: 'flacon_250', contenance_ml: 250, prix: '89', stock: 50 },
    ],
  })

  // Dedicated Pack Spécial Modal
  const [showPackModal, setShowPackModal] = useState(false)
  const [editingPackId, setEditingPackId] = useState(null)
  const [packSearch, setPackSearch] = useState('')
  const [packData, setPackData] = useState({
    nom: '',
    format_type: 'pack_3', // 'pack_3' | 'pack_4' | 'flacon_250'
    parfums: [], // 2 à 4 IDs
    prix: '',
    stock: 10,
    description: '',
    photo_principale: null,
    is_promo: false,
    prix_promo: '',
  })

  // Quick Promo Modal
  const [promoModalParfum, setPromoModalParfum] = useState(null)
  const [promoFormats, setPromoFormats] = useState([])

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      adminAPI.getParfums({ search, page_size: 100 }),
      adminAPI.getMarques(),
      adminAPI.getCollections(),
    ]).then(([pRes, mRes, cRes]) => {
      setParfums(pRes.data.results || pRes.data)
      setMarques(mRes.data.results || mRes.data)
      setCollectionsList(cRes.data.results || cRes.data || [])
    }).catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [search])

  const resetForm = () => {
    const initialGenre = (selectedCollection === 'gel-parfum-femme' || selectedCollection === 'parfums-femme') ? 'femme' : 'homme'
    setFormData({
      nom: '', marque: '', description: '', genre: initialGenre,
      famille_olfactive: 'boisee', concentration: 'gel',
      notes_tete: '', notes_coeur: '', notes_fond: '',
      actif: true, mis_en_avant: false,
      is_promo: selectedCollection === 'promotions',
      prix_promo: '',
      collections: [],
      photo_principale: null,
      formats: [
        { type_format: 'flacon_250', contenance_ml: 250, prix: '89', prix_promo: '', stock: 50 },
      ],
    })
    setEditingId(null)
  }

  const handleEdit = (parfum) => {
    if (parfum.is_pack) {
      handleEditPack(parfum)
      return
    }

    setEditingId(parfum.id)
    const existingColIds = Array.isArray(parfum.collections)
      ? parfum.collections.map(c => typeof c === 'object' ? c.id : c)
      : []

    setFormData({
      nom: parfum.nom,
      marque: parfum.marque,
      description: parfum.description || '',
      genre: parfum.genre,
      famille_olfactive: parfum.famille_olfactive,
      concentration: parfum.concentration,
      notes_tete: parfum.notes_tete || '',
      notes_coeur: parfum.notes_coeur || '',
      notes_fond: parfum.notes_fond || '',
      actif: parfum.actif,
      mis_en_avant: parfum.mis_en_avant,
      is_promo: Boolean(parfum.is_promo),
      prix_promo: parfum.prix_promo || '',
      collections: existingColIds,
      photo_principale: null,
      formats: (parfum.formats && parfum.formats.length > 0)
        ? parfum.formats.map(f => ({
            id: f.id,
            type_format: f.type_format,
            contenance_ml: f.contenance_ml,
            prix: f.prix,
            prix_promo: f.prix_promo || '',
            stock: f.stock,
          }))
        : [
            { type_format: 'decant_5', contenance_ml: 5, prix: '', prix_promo: '', stock: 0 },
            { type_format: 'decant_10', contenance_ml: 10, prix: '', prix_promo: '', stock: 0 },
            { type_format: 'complet', contenance_ml: 100, prix: '', prix_promo: '', stock: 0 },
          ],
    })
    setShowForm(true)
  }

  const toggleCollection = (colId) => {
    setFormData(prev => {
      const exists = prev.collections.includes(colId)
      return {
        ...prev,
        collections: exists ? prev.collections.filter(id => id !== colId) : [...prev.collections, colId]
      }
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const data = new FormData()
      data.append('nom', formData.nom)
      data.append('marque', formData.marque)
      data.append('description', formData.description)
      data.append('genre', formData.genre)
      data.append('famille_olfactive', formData.famille_olfactive)
      data.append('concentration', formData.concentration)
      data.append('notes_tete', formData.notes_tete)
      data.append('notes_coeur', formData.notes_coeur)
      data.append('notes_fond', formData.notes_fond)
      data.append('actif', formData.actif)
      data.append('mis_en_avant', formData.mis_en_avant)
      data.append('is_promo', formData.is_promo)
      data.append('is_pack', false)
      if (formData.prix_promo) {
        data.append('prix_promo', formData.prix_promo)
      }

      formData.collections.forEach(colId => {
        data.append('collections', colId)
      })

      if (formData.photo_principale) {
        data.append('photo_principale', formData.photo_principale)
      }

      if (editingId) {
        await adminAPI.updateParfum(editingId, data)
        for (const fmt of formData.formats) {
          if (fmt.id) {
            await adminAPI.updateFormat(fmt.id, {
              prix: fmt.prix,
              prix_promo: fmt.prix_promo && parseFloat(fmt.prix_promo) > 0 ? parseFloat(fmt.prix_promo) : null,
              stock: fmt.stock,
              contenance_ml: fmt.contenance_ml,
            })
          } else {
            await adminAPI.createFormat({
              parfum: editingId,
              type_format: fmt.type_format,
              contenance_ml: fmt.contenance_ml,
              prix: fmt.prix || 0,
              prix_promo: fmt.prix_promo && parseFloat(fmt.prix_promo) > 0 ? parseFloat(fmt.prix_promo) : null,
              stock: fmt.stock || 0,
            })
          }
        }
        setMessage('Produit mis à jour avec succès')
      } else {
        const createRes = await adminAPI.createParfum(data)
        const newParfumId = createRes.data?.id
        if (newParfumId) {
          for (const fmt of formData.formats) {
            await adminAPI.createFormat({
              parfum: newParfumId,
              type_format: fmt.type_format,
              contenance_ml: fmt.contenance_ml,
              prix: fmt.prix || 0,
              prix_promo: fmt.prix_promo && parseFloat(fmt.prix_promo) > 0 ? parseFloat(fmt.prix_promo) : null,
              stock: fmt.stock || 0,
            })
          }
        }
        setMessage('Produit créé avec succès')
      }

      loadData()
      setShowForm(false)
      resetForm()
    } catch (err) {
      setMessage('Erreur: ' + (err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Erreur inconnue'))
    } finally {
      setSaving(false)
    }
  }

  // ===== PACK SPÉCIAL HANDLERS =====
  const openNewPackModal = () => {
    setPackData({
      nom: '',
      format_type: 'decant_10',
      parfums: [],
      prix: '',
      stock: 10,
      description: '',
      photo_principale: null,
      is_promo: false,
      prix_promo: '',
    })
    setEditingPackId(null)
    setPackSearch('')
    setShowPackModal(true)
  }

  const handleEditPack = (p) => {
    const fmt = p.formats?.[0]
    let fmtType = 'decant_10'
    if (fmt) {
      if (fmt.contenance_ml === 5 || fmt.type_format === 'decant_5') fmtType = 'decant_5'
      else if (fmt.contenance_ml === 100 || fmt.type_format === 'complet') fmtType = 'complet'
      else fmtType = 'decant_10'
    }

    const existingInclus = Array.isArray(p.parfums_inclus_detail) && p.parfums_inclus_detail.length > 0
      ? p.parfums_inclus_detail.map(item => item.id)
      : Array.isArray(p.parfums_inclus)
      ? p.parfums_inclus.map(item => typeof item === 'object' ? item.id : item)
      : []

    setPackData({
      nom: p.nom,
      format_type: fmtType,
      parfums: existingInclus,
      prix: fmt?.prix || '',
      stock: fmt?.stock || 10,
      description: p.description || '',
      photo_principale: null,
      is_promo: Boolean(p.is_promo),
      prix_promo: p.prix_promo || '',
    })
    setEditingPackId(p.id)
    setPackSearch('')
    setShowPackModal(true)
  }

  const togglePackParfum = (parfumId) => {
    setPackData(prev => {
      const exists = prev.parfums.includes(parfumId)
      if (exists) {
        return { ...prev, parfums: prev.parfums.filter(id => id !== parfumId) }
      }
      if (prev.parfums.length >= 4) {
        alert('Un pack spécial peut contenir au maximum 4 parfums.')
        return prev
      }
      const newParfums = [...prev.parfums, parfumId]
      // Si le nom du pack est vide ou générique, on peut suggérer un nom
      let suggestedNom = prev.nom
      if (!prev.nom || prev.nom.startsWith('Pack')) {
        const count = newParfums.length
        const countWord = count === 2 ? 'Duo' : count === 3 ? 'Trio' : count === 4 ? 'Quatuor' : `${count} Parfums`
        const fmtName = prev.format_type === 'decant_5' ? '5ml' : prev.format_type === 'decant_10' ? '10ml' : 'Complet'
        suggestedNom = `Pack ${countWord} (${fmtName})`
      }

      return {
        ...prev,
        nom: suggestedNom,
        parfums: newParfums
      }
    })
  }

  const handleSavePack = async (e) => {
    e.preventDefault()
    if (packData.parfums.length < 2 || packData.parfums.length > 4) {
      alert('Veuillez sélectionner entre 2 et 4 parfums pour composer ce pack spécial.')
      return
    }
    if (!packData.prix || parseFloat(packData.prix) <= 0) {
      alert('Veuillez renseigner un prix total supérieur à 0 DH.')
      return
    }
    if (packData.is_promo && (!packData.prix_promo || parseFloat(packData.prix_promo) <= 0)) {
      alert('Veuillez renseigner un prix promotionnel supérieur à 0 DH pour ce pack.')
      return
    }
    setSaving(true)
    setMessage('')

    try {
      const data = new FormData()
      data.append('nom', packData.nom)
      data.append('format_type', packData.format_type)
      data.append('prix', packData.prix)
      data.append('stock', packData.stock)
      data.append('description', packData.description)
      data.append('is_promo', packData.is_promo ? 'true' : 'false')
      if (packData.is_promo && packData.prix_promo) {
        data.append('prix_promo', packData.prix_promo)
      } else {
        data.append('prix_promo', '')
      }

      packData.parfums.forEach(id => {
        data.append('parfums', id)
      })
      if (packData.photo_principale) {
        data.append('photo_principale', packData.photo_principale)
      }

      if (editingPackId) {
        await adminAPI.updatePack(editingPackId, data)
        setMessage('Pack Spécial mis à jour avec succès')
      } else {
        await adminAPI.createPack(data)
        setMessage('Pack Spécial créé avec succès')
      }

      loadData()
      setShowPackModal(false)
    } catch (err) {
      setMessage('Erreur: ' + (err.response?.data?.error || err.response?.data?.detail || 'Erreur lors de la création du pack'))
    } finally {
      setSaving(false)
    }
  }

  // ===== QUICK PROMO TOGGLE & PER-FORMAT PROMOTIONS =====
  const openPromoModal = (parfum) => {
    setPromoModalParfum(parfum)
    if (parfum.is_pack) {
      const fmt = parfum.formats?.[0]
      setPromoFormats([
        {
          id: fmt?.id,
          type_format: 'pack',
          contenance_ml: fmt?.contenance_ml || 10,
          prix: fmt?.prix || parfum.prix_min || 0,
          prix_promo: fmt?.prix_promo || parfum.prix_promo || '',
        }
      ])
    } else {
      const fmts = (parfum.formats || []).map(f => ({
        id: f.id,
        type_format: f.type_format,
        contenance_ml: f.contenance_ml,
        prix: f.prix,
        prix_promo: f.prix_promo || '',
      }))
      setPromoFormats(fmts)
    }
  }

  const handleUpdatePromoFormat = (index, value) => {
    setPromoFormats(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], prix_promo: value }
      return copy
    })
  }

  const handleClearFormatPromo = (index) => {
    setPromoFormats(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], prix_promo: '' }
      return copy
    })
  }

  const handleSaveQuickPromo = async (clearAll = false) => {
    if (!promoModalParfum) return
    setSaving(true)
    try {
      if (promoModalParfum.is_pack) {
        const packFmt = promoFormats[0]
        const promoVal = clearAll ? '' : (packFmt?.prix_promo || '')
        const isPromoActive = Boolean(!clearAll && promoVal && parseFloat(promoVal) > 0)

        const data = new FormData()
        data.append('is_promo', isPromoActive ? 'true' : 'false')
        data.append('prix_promo', isPromoActive ? promoVal : '')
        await adminAPI.updatePack(promoModalParfum.id, data)
      } else {
        let hasAnyPromo = false
        for (const f of promoFormats) {
          if (f.id) {
            const promoVal = clearAll ? null : (f.prix_promo && parseFloat(f.prix_promo) > 0 ? parseFloat(f.prix_promo) : null)
            if (promoVal) hasAnyPromo = true
            await adminAPI.updateFormat(f.id, {
              prix_promo: promoVal
            })
          }
        }
        const pData = new FormData()
        pData.append('is_promo', hasAnyPromo ? 'true' : 'false')
        if (!hasAnyPromo) pData.append('prix_promo', '')
        await adminAPI.updateParfum(promoModalParfum.id, pData)
      }
      setMessage(clearAll ? `Promotions retirées pour "${promoModalParfum.nom}"` : `Promotions enregistrées avec succès pour "${promoModalParfum.nom}"`)
      setPromoModalParfum(null)
      loadData()
    } catch (err) {
      alert('Erreur lors de la mise à jour des promotions: ' + (err.response?.data?.detail || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (parfum) => {
    try {
      const data = new FormData()
      data.append('actif', !parfum.actif)
      await adminAPI.updateParfum(parfum.id, data)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (parfum) => {
    if (!window.confirm(`Supprimer "${parfum.nom}" ? Cette action est irréversible.`)) return
    try {
      await adminAPI.deleteParfum(parfum.id)
      loadData()
    } catch (err) {
      alert('Erreur lors de la suppression')
    }
  }

  // Filtrage par les collections AURA
  const countAll = parfums.length
  const countHomme = parfums.filter(p => !p.is_pack && (p.genre === 'homme' || p.collections?.some(c => ['gel-parfum-homme', 'parfums-homme'].includes(c.slug || c)))).length
  const countFemme = parfums.filter(p => !p.is_pack && (p.genre === 'femme' || p.collections?.some(c => ['gel-parfum-femme', 'parfums-femme'].includes(c.slug || c)))).length
  const countPromo = parfums.filter(p => p.is_promo || p.collections?.some(c => (c.slug || c) === 'promotions')).length
  const countPacks = parfums.filter(p => p.is_pack || p.collections?.some(c => (c.slug || c) === 'packs-speciaux')).length

  const filteredParfums = parfums.filter((p) => {
    if (selectedCollection === 'all') return true
    if (selectedCollection === 'gel-parfum-homme' || selectedCollection === 'parfums-homme') {
      return !p.is_pack && (p.genre === 'homme' || p.collections?.some(c => ['gel-parfum-homme', 'parfums-homme'].includes(c.slug || c)))
    }
    if (selectedCollection === 'gel-parfum-femme' || selectedCollection === 'parfums-femme') {
      return !p.is_pack && (p.genre === 'femme' || p.collections?.some(c => ['gel-parfum-femme', 'parfums-femme'].includes(c.slug || c)))
    }
    if (selectedCollection === 'promotions') {
      return Boolean(p.is_promo) || p.collections?.some(c => (c.slug || c) === 'promotions')
    }
    if (selectedCollection === 'packs-speciaux') {
      return Boolean(p.is_pack) || p.collections?.some(c => (c.slug || c) === 'packs-speciaux')
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Top Header avec 2 boutons : Nouveau Gel Douche + Créer un Pack */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#0f3d38]">Catalogue & Produits AURA</h1>
          <p className="text-xs text-gray-500 mt-1">Gérez vos gels douche parfumés 250ml, offres promotionnelles et packs spéciaux</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={openNewPackModal}
            className="inline-flex items-center gap-2 bg-[#0f3d38] hover:bg-[#2fb49c] text-white px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Créer un Pack Spécial
          </button>

          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="inline-flex items-center gap-2 bg-[#2fb49c] hover:bg-[#239380] text-white px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau Produit Gel
          </button>
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

      {/* Onglets des Collections AURA */}
      <div className="bg-white rounded-2xl border border-[#d4e8e3] p-1.5 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSelectedCollection('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedCollection === 'all'
              ? 'bg-[#0f3d38] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#0f3d38] hover:bg-gray-100'
          }`}
        >
          <span>Tous les produits</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            selectedCollection === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {countAll}
          </span>
        </button>

        <button
          onClick={() => setSelectedCollection('gel-parfum-homme')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedCollection === 'gel-parfum-homme' || selectedCollection === 'parfums-homme'
              ? 'bg-[#0f3d38] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#0f3d38] hover:bg-gray-100'
          }`}
        >
          <span>Gel Parfum Homme</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            selectedCollection === 'gel-parfum-homme' || selectedCollection === 'parfums-homme' ? 'bg-white/20 text-white' : 'bg-[#f0fbf8] text-[#0f3d38]'
          }`}>
            {countHomme}
          </span>
        </button>

        <button
          onClick={() => setSelectedCollection('gel-parfum-femme')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedCollection === 'gel-parfum-femme' || selectedCollection === 'parfums-femme'
              ? 'bg-[#0f3d38] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#0f3d38] hover:bg-gray-100'
          }`}
        >
          <span>Gel Parfum Femme</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            selectedCollection === 'gel-parfum-femme' || selectedCollection === 'parfums-femme' ? 'bg-white/20 text-white' : 'bg-[#f0fbf8] text-[#2fb49c]'
          }`}>
            {countFemme}
          </span>
        </button>

        <button
          onClick={() => setSelectedCollection('packs-speciaux')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedCollection === 'packs-speciaux'
              ? 'bg-[#0f3d38] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#0f3d38] hover:bg-gray-100'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2fb49c]" />
          <span>Packs Spéciaux</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            selectedCollection === 'packs-speciaux' ? 'bg-white/20 text-white' : 'bg-[#f0fbf8] text-[#0f3d38]'
          }`}>
            {countPacks}
          </span>
        </button>

        <button
          onClick={() => setSelectedCollection('promotions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedCollection === 'promotions'
              ? 'bg-[#0f3d38] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#0f3d38] hover:bg-gray-100'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span>Promotions</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            selectedCollection === 'promotions' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700'
          }`}>
            {countPromo}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Rechercher un parfum, une marque, un pack..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs text-[#0f3d38] placeholder-gray-400 focus:outline-hidden focus:border-[#0f3d38] shadow-xs transition-all"
        />
        <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* MODAL 1: DÉDIÉE PACK SPÉCIAL (2 À 4 PARFUMS + FORMAT 5ML/10ML/COMPLET + PRIX TOTAL) */}
      <AnimatePresence>
        {showPackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center overflow-y-auto py-8 px-4"
            onClick={() => setShowPackModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl border border-amber-200 shadow-2xl p-6 sm:p-8 w-full max-w-2xl my-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#0f3d38]">
                      {editingPackId ? 'Modifier le Pack Spécial' : 'Créer un Pack Spécial'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sélectionnez entre 2 et 4 parfums existants, choisissez le format et fixez le prix total
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPackModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSavePack} className="space-y-5">
                {/* 1. Choix du Format pour tout le Pack */}
                <div>
                  <label className="text-gray-700 text-xs font-bold uppercase tracking-wider block mb-2">
                    1. Format des parfums dans ce pack *
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'pack_3', label: 'Pack de 3 Gels', sub: '3 x 250ml (ex: 239 DH)' },
                      { id: 'pack_4', label: 'Pack de 4 Gels', sub: '4 x 250ml (ex: 299 DH)' },
                      { id: 'flacon_250', label: 'Flacon 250ml', sub: 'Format 250ml' },
                    ].map(fmt => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setPackData({...packData, format_type: fmt.id})}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          packData.format_type === fmt.id
                            ? 'bg-[#0f3d38] text-white border-[#0f3d38] shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <span className="block text-sm font-bold">{fmt.label}</span>
                        <span className={`text-[10px] block mt-0.5 ${packData.format_type === fmt.id ? 'text-gray-300' : 'text-gray-400'}`}>
                          {fmt.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Sélection des 2 à 4 Parfums Inclus */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-amber-950 text-xs font-bold uppercase tracking-wider block">
                        2. Sélectionner les parfums inclus (2 à 4 parfums) *
                      </label>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        {packData.parfums.length === 0
                          ? 'Cochez au moins 2 parfums dans la liste ci-dessous'
                          : `${packData.parfums.length} parfum${packData.parfums.length > 1 ? 's' : ''} sélectionné${packData.parfums.length > 1 ? 's' : ''} (min 2, max 4)`}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      packData.parfums.length >= 2 && packData.parfums.length <= 4
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-200 text-amber-900'
                    }`}>
                      {packData.parfums.length} / 4
                    </span>
                  </div>

                  {/* Badges des parfums sélectionnés */}
                  {packData.parfums.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white/90 rounded-xl border border-amber-200">
                      {packData.parfums.map(pId => {
                        const p = parfums.find(item => item.id === pId)
                        return (
                          <span key={pId} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold">
                            <span>{p ? `${p.marque_nom || ''} ${p.nom}` : `Parfum #${pId}`}</span>
                            <button
                              type="button"
                              onClick={() => togglePackParfum(pId)}
                              className="w-4 h-4 rounded-full bg-amber-200 hover:bg-rose-500 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Barre de recherche dans la liste */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filtrer les parfums par nom ou marque..."
                      value={packSearch}
                      onChange={(e) => setPackSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-[#0f3d38] focus:outline-hidden focus:border-amber-600 placeholder-amber-400"
                    />
                    <svg className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Liste des parfums avec checkboxes */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-amber-200 rounded-xl p-2 bg-white">
                    {parfums
                      .filter(p => !p.is_pack)
                      .filter(p => !packSearch || `${p.nom} ${p.marque_nom || ''}`.toLowerCase().includes(packSearch.toLowerCase()))
                      .map(p => {
                        const isChecked = packData.parfums.includes(p.id)
                        const disabled = !isChecked && packData.parfums.length >= 4

                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                              isChecked
                                ? 'bg-amber-100/80 border border-amber-300'
                                : disabled
                                ? 'opacity-40 cursor-not-allowed bg-gray-50 border border-transparent'
                                : 'hover:bg-amber-50/50 cursor-pointer border border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={disabled}
                              onChange={() => togglePackParfum(p.id)}
                              className="accent-amber-600 rounded w-4 h-4 cursor-pointer"
                            />
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                              <img src={p.photo_principale || ''} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-[#0f3d38] block truncate">{p.nom}</span>
                              <span className="text-[10px] text-gray-500">{p.marque_nom} · {p.genre === 'homme' ? 'Homme' : p.genre === 'femme' ? 'Femme' : 'Unisexe'}</span>
                            </div>
                          </label>
                        )
                      })}
                  </div>
                </div>

                {/* 3. Nom et Prix Total du Pack */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-700 text-xs font-bold uppercase tracking-wider block mb-1.5">
                      3. Nom du Pack *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] font-semibold focus:bg-white focus:border-[#0f3d38] focus:outline-hidden transition-all"
                      value={packData.nom}
                      onChange={(e) => setPackData({...packData, nom: e.target.value})}
                      placeholder="Ex: Pack Découverte 3 Parfums"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-gray-700 text-xs font-bold uppercase tracking-wider block mb-1.5">
                      4. Prix Total du Pack (MAD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] font-bold focus:bg-white focus:border-[#0f3d38] focus:outline-hidden transition-all"
                      value={packData.prix}
                      onChange={(e) => setPackData({...packData, prix: e.target.value})}
                      placeholder="Ex: 350"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                      Stock disponible
                    </label>
                    <input
                      type="number"
                      className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden transition-all"
                      value={packData.stock}
                      onChange={(e) => setPackData({...packData, stock: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div>
                    <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                      Photo personnalisée (Optionnelle)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-700 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#0f3d38] file:text-white hover:file:bg-[#1b5e54] cursor-pointer"
                      onChange={(e) => setPackData({...packData, photo_principale: e.target.files[0]})}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Si non fournie, la photo du premier parfum sélectionné sera utilisée.</p>
                  </div>
                </div>

                {/* 5. Promotion Spéciale sur ce Pack */}
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-rose-950 text-xs font-bold uppercase tracking-wider cursor-pointer">
                      <input
                        type="checkbox"
                        checked={packData.is_promo}
                        onChange={(e) => setPackData({...packData, is_promo: e.target.checked})}
                        className="accent-rose-600 rounded w-4 h-4 cursor-pointer"
                      />
                      <span>Mettre ce Pack Spécial en Promotion</span>
                    </label>
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                      packData.is_promo ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {packData.is_promo ? 'Promotion Active' : 'Sans Promo'}
                    </span>
                  </div>

                  {packData.is_promo && (
                    <div className="pt-2 border-t border-rose-200/70 space-y-2">
                      <label className="text-gray-700 text-xs font-bold uppercase tracking-wider block">
                        Prix Promotionnel Réduit du Pack (MAD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required={packData.is_promo}
                        value={packData.prix_promo}
                        onChange={(e) => setPackData({...packData, prix_promo: e.target.value})}
                        placeholder="Ex: 280 (au lieu de 350)"
                        className="w-full px-3.5 py-2.5 bg-white border border-rose-300 rounded-xl text-xs font-bold text-rose-600 focus:outline-hidden focus:border-rose-600 shadow-2xs"
                      />
                      {packData.prix && packData.prix_promo && (
                        <p className="text-[11px] text-rose-900 bg-white/80 p-2 rounded-lg border border-rose-200/60">
                          Affichage boutique : Prix normal barré <span className="line-through text-gray-400 font-semibold">{packData.prix} DH</span> ➔ <strong className="text-rose-600 font-bold">{packData.prix_promo} DH</strong> (Économie : {(parseFloat(packData.prix) - parseFloat(packData.prix_promo)).toFixed(2)} DH)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={saving || packData.parfums.length < 2 || packData.parfums.length > 4}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {saving ? 'Création en cours...' : editingPackId ? 'Mettre à jour le Pack' : 'Créer le Pack Spécial'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPackModal(false)}
                    className="px-6 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-semibold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: MODAL STANDARD POUR PARFUM INDIVIDUEL (HOMME, FEMME, UNISEXE + PROMO) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center overflow-y-auto py-10 px-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-8 w-full max-w-2xl my-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#0f3d38]">
                    {editingId ? 'Modifier le parfum' : 'Nouveau parfum individuel'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Complétez les informations pour la collection sélectionnée</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">Nom du parfum *</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden transition-all"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">Marque *</label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden transition-all"
                      value={formData.marque}
                      onChange={(e) => setFormData({...formData, marque: e.target.value})}
                      required
                    >
                      <option value="">Sélectionner une marque...</option>
                      {marques.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">Collection (Genre)</label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden transition-all font-semibold"
                      value={formData.genre}
                      onChange={(e) => setFormData({...formData, genre: e.target.value})}
                    >
                      <option value="homme">Collection Homme</option>
                      <option value="femme">Collection Femme</option>
                      <option value="mixte">Collection Unisexe / Mixte</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">Type de Produit / Concentration</label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#2fb49c] focus:outline-hidden transition-all"
                      value={formData.concentration}
                      onChange={(e) => setFormData({...formData, concentration: e.target.value})}
                    >
                      <option value="gel">Gel Douche Parfumé (250ml)</option>
                      <option value="EDP">Eau de Parfum (EDP)</option>
                      <option value="EDT">Eau de Toilette (EDT)</option>
                      <option value="extrait">Extrait de Parfum</option>
                      <option value="cologne">Eau de Cologne</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">Famille olfactive</label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden transition-all"
                      value={formData.famille_olfactive}
                      onChange={(e) => setFormData({...formData, famille_olfactive: e.target.value})}
                    >
                      {['boisee','florale','orientale','fraiche','aromatique','gourmande','chypree','fougere','cuiree','musquee']
                        .map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">Photo principale</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-700 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#0f3d38] file:text-white hover:file:bg-[#1b5e54] cursor-pointer"
                      onChange={(e) => setFormData({...formData, photo_principale: e.target.files[0]})}
                    />
                  </div>
                </div>

                {/* Option Promotion */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  formData.is_promo ? 'bg-rose-50 border-rose-300' : 'bg-gray-50 border-gray-200'
                }`}>
                  <label className="flex items-center gap-2 text-xs font-bold text-rose-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_promo}
                      onChange={(e) => setFormData({...formData, is_promo: e.target.checked})}
                      className="accent-rose-600 rounded w-4 h-4 cursor-pointer"
                    />
                    <span>Mettre ce parfum en Promotion</span>
                  </label>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Le parfum restera dans sa catégorie ({formData.genre === 'homme' ? 'Homme' : formData.genre === 'femme' ? 'Femme' : 'Unisexe'}) <strong>ET</strong> apparaîtra également dans la collection <strong>Promotions</strong>.
                  </p>
                  {formData.is_promo && (
                    <div className="mt-2.5">
                      <label className="text-[10px] uppercase font-bold text-rose-800 block mb-1">
                        Prix Promotionnel Réduit (MAD) :
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 850"
                        value={formData.prix_promo}
                        onChange={(e) => setFormData({...formData, prix_promo: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-[#0f3d38] font-bold focus:outline-hidden focus:border-rose-600"
                      />
                    </div>
                  )}
                </div>

                {/* Collections Associées (Checklist) */}
                <div className="pt-2">
                  <label className="text-[#0f3d38] text-xs font-bold uppercase tracking-wider block mb-2">
                    Collections Associées
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {collectionsList.map((col) => {
                      const isSelected = formData.collections.includes(col.id)
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => toggleCollection(col.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#0f3d38] text-white border-[#0f3d38] shadow-xs'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <svg className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isSelected ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            )}
                          </svg>
                          <span>{col.nom}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">Description</label>
                  <textarea
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden transition-all min-h-[70px] resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Histoire du parfum, notes olfactives et inspirations..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">Notes de tête</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden"
                      value={formData.notes_tete}
                      onChange={(e) => setFormData({...formData, notes_tete: e.target.value})}
                      placeholder="Ex: Bergamote, Citron"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">Notes de cœur</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden"
                      value={formData.notes_coeur}
                      onChange={(e) => setFormData({...formData, notes_coeur: e.target.value})}
                      placeholder="Ex: Rose, Jasmin"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-1.5">Notes de fond</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#0f3d38] focus:bg-white focus:border-[#0f3d38] focus:outline-hidden"
                      value={formData.notes_fond}
                      onChange={(e) => setFormData({...formData, notes_fond: e.target.value})}
                      placeholder="Ex: Ambre, Vanille, Oud"
                    />
                  </div>
                </div>

                {/* Formats */}
                <div className="pt-2">
                  <label className="text-[#0f3d38] text-xs font-bold uppercase tracking-wider block mb-2.5">
                    Tarifs & Stock par Format (MAD)
                  </label>
                  <div className="space-y-2.5">
                    {formData.formats.map((fmt, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-200/80 items-center">
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase font-semibold block mb-0.5">Format</span>
                          <span className="text-[#0f3d38] text-xs font-bold">
                            {fmt.type_format === 'flacon_250' ? 'Flacon 250ml' : fmt.type_format === 'pack_3' ? 'Pack de 3' : fmt.type_format === 'pack_4' ? 'Pack de 4' : fmt.type_format === 'decant_5' ? 'Format 5ml' : fmt.type_format === 'decant_10' ? 'Format 10ml' : 'Flacon complet'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase font-semibold block mb-0.5">Contenance (ML)</span>
                          <input
                            type="number"
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-[#0f3d38] focus:outline-hidden focus:border-[#0f3d38]"
                            value={fmt.contenance_ml}
                            onChange={(e) => {
                              const f = [...formData.formats]
                              f[idx] = {...f[idx], contenance_ml: parseInt(e.target.value) || 0}
                              setFormData({...formData, formats: f})
                            }}
                          />
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase font-semibold block mb-0.5">Prix Normal (MAD)</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 65"
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-[#0f3d38] font-semibold focus:outline-hidden focus:border-[#0f3d38]"
                            value={fmt.prix}
                            onChange={(e) => {
                              const f = [...formData.formats]
                              f[idx] = {...f[idx], prix: e.target.value}
                              setFormData({...formData, formats: f})
                            }}
                          />
                        </div>
                        <div>
                          <span className="text-rose-600 text-[10px] uppercase font-bold block mb-0.5">Prix Promo (MAD)</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Optionnel"
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold focus:outline-hidden transition-all ${
                              fmt.prix_promo
                                ? 'bg-rose-50 border border-rose-300 text-rose-700 focus:border-rose-600'
                                : 'bg-white border border-gray-200 text-gray-700 focus:border-[#0f3d38]'
                            }`}
                            value={fmt.prix_promo || ''}
                            onChange={(e) => {
                              const f = [...formData.formats]
                              f[idx] = {...f[idx], prix_promo: e.target.value}
                              setFormData({...formData, formats: f})
                            }}
                          />
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase font-semibold block mb-0.5">Stock</span>
                          <input
                            type="number"
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-[#0f3d38] focus:outline-hidden focus:border-[#0f3d38]"
                            value={fmt.stock}
                            onChange={(e) => {
                              const f = [...formData.formats]
                              f[idx] = {...f[idx], stock: parseInt(e.target.value) || 0}
                              setFormData({...formData, formats: f})
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-gray-700 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.actif}
                      onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                      className="accent-[#0f3d38] rounded w-4 h-4 cursor-pointer"
                    />
                    Produit Actif
                  </label>
                  <label className="flex items-center gap-2 text-gray-700 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mis_en_avant}
                      onChange={(e) => setFormData({...formData, mis_en_avant: e.target.checked})}
                      className="accent-[#0f3d38] rounded w-4 h-4 cursor-pointer"
                    />
                    Mis en avant (Page d'accueil)
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#0f3d38] hover:bg-[#1b5e54] text-white py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    {saving ? 'Enregistrement...' : editingId ? 'Enregistrer les modifications' : 'Créer le produit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm() }}
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

      {/* MODAL 3: MODAL PROMOTION PAR FORMAT ET PACKS SPÉCIAUX */}
      <AnimatePresence>
        {promoModalParfum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setPromoModalParfum(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl border border-rose-200 shadow-2xl p-6 sm:p-7 w-full max-w-lg my-8"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {promoModalParfum.photo_principale ? (
                      <img src={promoModalParfum.photo_principale} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-rose-600 text-lg font-black">%</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-serif font-bold text-[#0f3d38]">
                        Gérer les Promotions
                      </h3>
                      {promoModalParfum.is_pack ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          PACK SPÉCIAL
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          promoModalParfum.genre === 'homme'
                            ? 'bg-blue-100 text-blue-800'
                            : promoModalParfum.genre === 'femme'
                            ? 'bg-pink-100 text-pink-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {promoModalParfum.genre === 'homme' ? 'HOMME' : promoModalParfum.genre === 'femme' ? 'FEMME' : 'UNISEXE'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 font-bold mt-0.5">{promoModalParfum.nom}</p>
                    <p className="text-[11px] text-gray-400">{promoModalParfum.marque_nom || 'AURA COLLECTION'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPromoModalParfum(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Instructions */}
              <div className="mb-4 p-3 bg-rose-50/60 border border-rose-100 rounded-2xl">
                <p className="text-xs text-gray-700 leading-relaxed">
                  {promoModalParfum.is_pack
                    ? 'Définissez le prix promotionnel pour ce pack spécial. Laissez vide pour conserver le prix normal.'
                    : 'Définissez le prix promotionnel pour chaque décant (5ml, 10ml) et pour le flacon complet individuellement. Laissez le champ vide si un format n\'est pas en promotion.'}
                </p>
              </div>

              {/* Formats List */}
              <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-1">
                {promoFormats.map((fmt, idx) => {
                  const formatLabel = fmt.type_format === 'decant_5'
                    ? 'Format 5ml'
                    : fmt.type_format === 'decant_10'
                    ? 'Pack Spécial'
                    : fmt.type_format === 'complet'
                    ? `Gel Douche (${fmt.contenance_ml || 250}ml)`
                    : fmt.type_format === 'flacon_250'
                    ? `Gel Douche 250ml`
                    : fmt.type_format === 'pack_3'
                    ? 'Pack Spécial (3 Gels Parfumés)'
                    : fmt.type_format === 'pack_4'
                    ? 'Pack Spécial (4 Gels Parfumés)'
                    : `Pack Spécial (${fmt.contenance_ml || 10}ml)`

                  const regularPrice = parseFloat(fmt.prix) || 0
                  const promoPrice = fmt.prix_promo ? parseFloat(fmt.prix_promo) : null
                  const isDiscountValid = promoPrice && promoPrice > 0 && promoPrice < regularPrice
                  const discountPercent = isDiscountValid ? Math.round((1 - promoPrice / regularPrice) * 100) : 0
                  const savings = isDiscountValid ? (regularPrice - promoPrice).toFixed(0) : 0

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isDiscountValid
                          ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0f3d38]">
                            {formatLabel}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            (Prix normal : <strong className="text-gray-700">{regularPrice} DH</strong>)
                          </span>
                        </div>
                        {isDiscountValid && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                            -{discountPercent}% (Économie : {savings} DH)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Prix Promo en DH (ex: 49)"
                            value={fmt.prix_promo}
                            onChange={(e) => handleUpdatePromoFormat(idx, e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-[#0f3d38] focus:bg-white focus:outline-hidden focus:border-rose-600 shadow-xs"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                            DH
                          </span>
                        </div>
                        {fmt.prix_promo && (
                          <button
                            type="button"
                            onClick={() => handleClearFormatPromo(idx)}
                            className="px-2.5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Effacer la promo pour ce format"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveQuickPromo(false)}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{saving ? 'Enregistrement...' : 'Enregistrer les promotions'}</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveQuickPromo(true)}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-semibold transition-all cursor-pointer"
                >
                  Retirer les promotions
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tableau des Produits / Packs */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-[#0f3d38] rounded-full animate-spin" />
        </div>
      ) : filteredParfums.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs text-center py-16 px-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#0f3d38]">Aucun produit trouvé</p>
          <p className="text-xs text-gray-400 mt-1">
            Aucun article ne correspond aux critères sélectionnés.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#eff0f5]/70 border-b border-gray-200/80 text-left">
                  <th className="p-4 text-[#0f3d38] font-bold uppercase tracking-wider">Produit / Pack</th>
                  <th className="p-4 text-[#0f3d38] font-bold uppercase tracking-wider">Marque</th>
                  <th className="p-4 text-[#0f3d38] font-bold uppercase tracking-wider">Collections & Statut</th>
                  <th className="p-4 text-[#0f3d38] font-bold uppercase tracking-wider">Tarification & Stock</th>
                  <th className="p-4 text-[#0f3d38] font-bold uppercase tracking-wider">Disponibilité</th>
                  <th className="p-4 text-[#0f3d38] font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredParfums.map((p) => {
                  const f5 = p.formats?.find(f => f.type_format === 'decant_5' || f.contenance_ml === 5)
                  const f10 = p.formats?.find(f => f.type_format === 'decant_10' || f.contenance_ml === 10)
                  const fFull = p.formats?.find(f => f.type_format === 'complet' || f.contenance_ml > 10)
                  const mainFormat = p.formats?.[0]

                  const inclusList = p.parfums_inclus_detail || []
                  const inclusCount = inclusList.length || (Array.isArray(p.parfums_inclus) ? p.parfums_inclus.length : 0)

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border shrink-0 ${
                            p.is_pack ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-200'
                          }`}>
                            <img
                              src={p.photo_principale || ''}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => e.target.style.display='none'}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#0f3d38] block text-sm">{p.nom}</span>
                              {p.is_pack && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  PACK
                                </span>
                              )}
                            </div>
                            {p.is_pack && inclusList.length > 0 ? (
                              <p className="text-[11px] text-amber-800 font-medium line-clamp-1 mt-0.5">
                                Contient : {inclusList.map(item => item.nom).join(', ')}
                              </p>
                            ) : (
                              <span className="text-[11px] text-gray-400 capitalize">{p.famille_olfactive}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 font-medium">{p.marque_nom}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 items-center max-w-xs">
                          {/* Genre pill */}
                          {!p.is_pack && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
                              p.genre === 'homme'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : p.genre === 'femme'
                                ? 'bg-pink-50 text-pink-700 border-pink-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                              {p.genre === 'homme' ? 'Homme' : p.genre === 'femme' ? 'Femme' : 'Unisexe'}
                            </span>
                          )}

                          {/* Promo badge cliquable */}
                          {(() => {
                            const hasFormatPromo = p.formats?.some(f => f.prix_promo && parseFloat(f.prix_promo) > 0)
                            const isPromoActive = Boolean(p.is_promo || p.has_promo || hasFormatPromo)
                            return (
                              <button
                                type="button"
                                onClick={() => openPromoModal(p)}
                                title="Gérer les promotions par format"
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                  isPromoActive
                                    ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 shadow-xs'
                                    : 'bg-gray-50 text-gray-400 border-dashed border-gray-300 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isPromoActive ? 'bg-rose-500 animate-pulse' : 'bg-gray-300'}`} />
                                {isPromoActive ? 'Promo Active (%)' : '+ Promo'}
                              </button>
                            )
                          })()}

                          {/* Pack badge */}
                          {p.is_pack && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <span>Pack Spécial</span>
                              <span className="bg-amber-200 text-amber-900 rounded-full px-1.5 text-[9px]">
                                {inclusCount} parfums
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-700 font-medium">
                        {p.is_pack ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                Pack Spécial
                              </span>
                              {(p.is_promo && p.prix_promo) || (mainFormat?.prix_promo && parseFloat(mainFormat.prix_promo) > 0) ? (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-sm font-extrabold text-rose-600">
                                    {parseFloat(mainFormat?.prix_promo || p.prix_promo).toFixed(2)} DH
                                  </span>
                                  <span className="text-[11px] text-gray-400 line-through">
                                    {mainFormat?.prix ? `${parseFloat(mainFormat.prix).toFixed(2)} DH` : ''}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-extrabold text-[#0f3d38]">
                                  {mainFormat?.prix ? `${parseFloat(mainFormat.prix).toFixed(2)} DH` : '—'}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 block mt-0.5">Stock : {mainFormat?.stock || 0}</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            {p.formats && p.formats.length > 0 ? (
                              p.formats.map((f) => {
                                const label = f.type_format === 'flacon_250' || f.contenance_ml === 250
                                  ? '250ml'
                                  : f.type_format === 'decant_5' || f.contenance_ml === 5
                                  ? '5ml'
                                  : f.type_format === 'decant_10' || f.contenance_ml === 10
                                  ? '10ml'
                                  : f.type_format === 'complet'
                                  ? 'Flacon'
                                  : `${f.contenance_ml}ml`
                                return (
                                  <span
                                    key={f.id}
                                    className={`px-2 py-0.5 rounded-md ${
                                      f.prix_promo && parseFloat(f.prix_promo) > 0
                                        ? 'bg-rose-50 border border-rose-200'
                                        : 'bg-[#0f3d38]/5 text-[#0f3d38] font-semibold'
                                    }`}
                                  >
                                    {label}:{' '}
                                    {f.prix_promo && parseFloat(f.prix_promo) > 0 ? (
                                      <>
                                        <span className="line-through text-gray-400 mr-0.5">{parseFloat(f.prix).toFixed(2)}</span>
                                        <strong className="text-rose-600 font-extrabold">{parseFloat(f.prix_promo).toFixed(2)} DH</strong>
                                      </>
                                    ) : (
                                      <strong>{f.prix ? `${parseFloat(f.prix).toFixed(2)} DH` : '—'}</strong>
                                    )}
                                  </span>
                                )
                              })
                            ) : (
                              <span className="text-gray-400 italic">Aucun format</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                            p.actif
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.actif ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {p.actif ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(p)}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-[#0f3d38] flex items-center justify-center transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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
    </div>
  )
}
