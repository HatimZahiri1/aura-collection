import { create } from 'zustand'

/**
 * Calculateur dynamique et optimal des remises par pack pour les gels douche individuels (250ml)
 * - 1 gel = 89 DH
 * - 2 gels = 178 DH
 * - 3 gels = Pack Trio Automatique à 239 DH (au lieu de 267 DH, économie 28 DH)
 * - 4 gels = Pack Complet Automatique à 299 DH (au lieu de 356 DH, économie 57 DH)
 * - N > 4 = Combinaison optimale la plus avantageuse pour le client
 */
export function calculateGelsBundleDiscount(items) {
  if (!items || items.length === 0) {
    return {
      singleGelsCount: 0,
      hasDiscount: false,
      discount: 0,
      appliedBundles: [],
      badgeText: '',
      nextTierMessage: '',
      packs4: 0,
      packs3: 0,
      singles: 0,
    }
  }

  // Compter les gels douche individuels éligibles (250ml, non-pack)
  let singleGelsCount = 0
  let singleGelsRawTotal = 0

  items.forEach((item) => {
    const isPack = Boolean(item.parfum?.is_pack || item.format?.type_format?.includes('pack'))
    if (!isPack) {
      const unitPrice = parseFloat(item.format?.original_prix || item.format?.prix || 89)
      const qty = parseInt(item.quantity) || 1
      singleGelsCount += qty
      singleGelsRawTotal += unitPrice * qty
    }
  })

  if (singleGelsCount < 3) {
    let nextTierMessage = ''
    if (singleGelsCount === 1) {
      nextTierMessage = 'Ajoutez 2 gels de plus pour débloquer automatiquement le Pack Trio à 239 DH (-28 DH) !'
    } else if (singleGelsCount === 2) {
      nextTierMessage = 'Ajoutez 1 gel de plus pour débloquer immédiatement le Pack Trio à 239 DH (-28 DH) !'
    }
    return {
      singleGelsCount,
      hasDiscount: false,
      discount: 0,
      appliedBundles: [],
      badgeText: '',
      nextTierMessage,
      packs4: 0,
      packs3: 0,
      singles: singleGelsCount,
    }
  }

  // Programmation dynamique pour trouver le coût minimum exact
  const dp = new Array(singleGelsCount + 1).fill(Infinity)
  const choice = new Array(singleGelsCount + 1).fill(1)
  dp[0] = 0

  for (let i = 1; i <= singleGelsCount; i++) {
    // Option 1 : gel unitaire à 89 DH
    if (dp[i - 1] + 89 < dp[i]) {
      dp[i] = dp[i - 1] + 89
      choice[i] = 1
    }
    // Option 2 : Pack de 3 à 239 DH
    if (i >= 3 && dp[i - 3] + 239 < dp[i]) {
      dp[i] = dp[i - 3] + 239
      choice[i] = 3
    }
    // Option 3 : Pack de 4 à 299 DH
    if (i >= 4 && dp[i - 4] + 299 < dp[i]) {
      dp[i] = dp[i - 4] + 299
      choice[i] = 4
    }
  }

  // Retracer les packs appliqués
  let curr = singleGelsCount
  let packs4 = 0
  let packs3 = 0
  let singles = 0
  while (curr > 0) {
    const c = choice[curr]
    if (c === 4) { packs4++; curr -= 4 }
    else if (c === 3) { packs3++; curr -= 3 }
    else { singles++; curr -= 1 }
  }

  const optimalGelsTotal = dp[singleGelsCount]
  const discount = Math.max(0, singleGelsRawTotal - optimalGelsTotal)

  const appliedBundles = []
  if (packs4 > 0) appliedBundles.push(`${packs4} × Pack Spécial 4 Gels (299 DH)`)
  if (packs3 > 0) appliedBundles.push(`${packs3} × Pack Spécial 3 Gels (239 DH)`)

  let badgeText = ''
  let nextTierMessage = ''

  if (singleGelsCount === 3) {
    badgeText = 'Offre Pack Spécial automatique appliquée : 239 DH au lieu de 267 DH (-28 DH)'
    nextTierMessage = 'Ajoutez 1 gel de plus pour passer au Pack Spécial 4 Gels à 299 DH !'
  } else if (singleGelsCount === 4) {
    badgeText = 'Offre Pack Spécial (4 Gels) automatique appliquée : 299 DH au lieu de 356 DH (-57 DH)'
  } else if (discount > 0) {
    badgeText = `Remise Pack Spécial automatique appliquée : -${discount.toFixed(0)} DH sur vos gels`
  }

  return {
    singleGelsCount,
    hasDiscount: discount > 0,
    discount,
    appliedBundles,
    badgeText,
    nextTierMessage,
    packs4,
    packs3,
    singles,
  }
}

/**
 * Calculateur centralisé de tous les totaux du panier
 */
export function calculateCartMetrics(items) {
  const safeItems = Array.isArray(items) ? items : []
  const subtotal = safeItems.reduce((sum, item) => {
    const price = parseFloat(item.format?.prix || 0)
    const qty = parseInt(item.quantity) || 1
    return sum + price * qty
  }, 0)

  const bundleDiscount = calculateGelsBundleDiscount(safeItems)
  const discountVal = bundleDiscount?.discount || 0
  const total = Math.max(0, subtotal - discountVal)
  const count = safeItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0)

  return {
    subtotal,
    bundleDiscount,
    total,
    count,
  }
}

// Initialisation sécurisée depuis localStorage
const initialItems = (() => {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]')
  } catch {
    return []
  }
})()

const initialMetrics = calculateCartMetrics(initialItems)

const useCartStore = create((set, get) => ({
  items: initialItems,
  subtotal: initialMetrics.subtotal,
  bundleDiscount: initialMetrics.bundleDiscount,
  total: initialMetrics.total,
  count: initialMetrics.count,
  isDrawerOpen: false,

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  /**
   * addItem supporte:
   * - format
   * - parfum
   * - quantity (default 1)
   * - selectedFragrances (tableau optionnel pour les packs personnalisés)
   */
  addItem: (arg1, arg2, arg3 = 1, arg4 = []) => {
    let format, parfum, quantity = 1, selectedFragrances = []
    if (arg1 && arg1.format && arg1.parfum) {
      format = arg1.format
      parfum = arg1.parfum
      quantity = arg2 || 1
      selectedFragrances = arg1.selectedFragrances || []
    } else {
      format = arg1
      parfum = arg2
      quantity = arg3 || 1
      selectedFragrances = arg4 || []
    }

    if (!format || !parfum) return

    // Vérifier si le format est en rupture de stock
    const maxStock = (format.stock !== undefined && format.stock !== null) ? format.stock : Infinity
    if (maxStock <= 0) return

    const hasFormatPromo = format.prix_promo && parseFloat(format.prix_promo) > 0 && parseFloat(format.prix_promo) < parseFloat(format.prix)
    const effectivePrice = hasFormatPromo
      ? parseFloat(format.prix_promo)
      : (parfum.is_promo && parfum.prix_promo)
      ? parseFloat(parfum.prix_promo)
      : parseFloat(format.prix)

    const formatToSave = {
      ...format,
      original_prix: format.original_prix || format.prix,
      prix: effectivePrice,
      prix_promo: hasFormatPromo ? parseFloat(format.prix_promo) : (parfum.prix_promo ? parseFloat(parfum.prix_promo) : null),
      is_promo: Boolean(hasFormatPromo || (parfum.is_promo && parfum.prix_promo)),
    }

    // Clé unique d'article qui tient compte des fragrances choisies pour les packs
    const fragranceKey = (selectedFragrances && selectedFragrances.length > 0)
      ? selectedFragrances.slice().sort().join('|')
      : ''
    const itemKey = `${format.id}-${fragranceKey}`

    set((state) => {
      const existing = state.items.find(item => {
        const itemFragranceKey = (item.selectedFragrances && item.selectedFragrances.length > 0)
          ? item.selectedFragrances.slice().sort().join('|')
          : ''
        return `${item.format.id}-${itemFragranceKey}` === itemKey
      })

      let newItems
      if (existing) {
        const nextQty = Math.min(maxStock, existing.quantity + quantity)
        newItems = state.items.map(item => {
          const itemFragranceKey = (item.selectedFragrances && item.selectedFragrances.length > 0)
            ? item.selectedFragrances.slice().sort().join('|')
            : ''
          return `${item.format.id}-${itemFragranceKey}` === itemKey
            ? { ...item, format: formatToSave, quantity: nextQty }
            : item
        })
      } else {
        const initialQty = Math.min(maxStock, quantity)
        if (initialQty <= 0) return state

        newItems = [...state.items, {
          itemKey,
          format: formatToSave,
          parfum: {
            id: parfum.id,
            nom: parfum.nom,
            marque_nom: parfum.marque_nom || parfum.marque?.nom,
            photo_principale: parfum.photo_principale,
            is_promo: parfum.is_promo,
            is_pack: parfum.is_pack,
          },
          quantity: initialQty,
          selectedFragrances: selectedFragrances || [],
        }]
      }

      const metrics = calculateCartMetrics(newItems)
      try {
        localStorage.setItem('cart', JSON.stringify(newItems))
      } catch {}

      return {
        items: newItems,
        subtotal: metrics.subtotal,
        bundleDiscount: metrics.bundleDiscount,
        total: metrics.total,
        count: metrics.count,
        isDrawerOpen: true,
      }
    })
  },

  removeItem: (itemIdentifier) => {
    set((state) => {
      const newItems = state.items.filter(item => 
        item.itemKey !== itemIdentifier && item.format.id !== itemIdentifier
      )
      const metrics = calculateCartMetrics(newItems)
      try {
        localStorage.setItem('cart', JSON.stringify(newItems))
      } catch {}

      return {
        items: newItems,
        subtotal: metrics.subtotal,
        bundleDiscount: metrics.bundleDiscount,
        total: metrics.total,
        count: metrics.count,
      }
    })
  },

  updateQuantity: (itemIdentifier, quantity) => {
    set((state) => {
      const targetItem = state.items.find(item => item.itemKey === itemIdentifier || item.format.id === itemIdentifier)
      const maxStock = (targetItem?.format?.stock !== undefined && targetItem?.format?.stock !== null)
        ? targetItem.format.stock
        : Infinity
      const safeQty = Math.min(quantity, maxStock)

      const newItems = safeQty <= 0
        ? state.items.filter(item => item.itemKey !== itemIdentifier && item.format.id !== itemIdentifier)
        : state.items.map(item =>
            (item.itemKey === itemIdentifier || item.format.id === itemIdentifier)
              ? { ...item, quantity: safeQty }
              : item
          )
      const metrics = calculateCartMetrics(newItems)
      try {
        localStorage.setItem('cart', JSON.stringify(newItems))
      } catch {}

      return {
        items: newItems,
        subtotal: metrics.subtotal,
        bundleDiscount: metrics.bundleDiscount,
        total: metrics.total,
        count: metrics.count,
      }
    })
  },

  clearCart: () => {
    try {
      localStorage.removeItem('cart')
    } catch {}
    const metrics = calculateCartMetrics([])
    set({
      items: [],
      subtotal: metrics.subtotal,
      bundleDiscount: metrics.bundleDiscount,
      total: metrics.total,
      count: metrics.count,
    })
  },
}))

export default useCartStore
