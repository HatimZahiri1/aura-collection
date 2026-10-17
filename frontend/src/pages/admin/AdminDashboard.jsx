import { useState, useEffect, useMemo } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { adminAPI } from '../../api/client'

export default function AdminDashboard() {
  const outletCtx = useOutletContext() || {}
  const [dashStats, setDashStats] = useState(outletCtx.stats || null)
  const [recentOrders, setRecentOrders] = useState([])
  const [parfumsList, setParfumsList] = useState([])
  const [loadingParfums, setLoadingParfums] = useState(true)
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all')
  const [chartPeriod, setChartPeriod] = useState('7j')
  const [activeTooltip, setActiveTooltip] = useState(null)
  const [ventesFilter, setVentesFilter] = useState('tous') // 'tous' | 'gels' | 'packs'
  const [refreshing, setRefreshing] = useState(false)

  // Use fresh dashStats OR fallback to outlet stats
  const stats = dashStats || outletCtx.stats

  const refreshDashboard = () => {
    setRefreshing(true)
    adminAPI.getStats()
      .then(res => setDashStats(res.data))
      .catch(() => {})
      .finally(() => setRefreshing(false))
  }

  useEffect(() => {
    // Fetch fresh stats on every mount (navigating back to dashboard)
    refreshDashboard()

    // 1. Charger les commandes récentes
    adminAPI.getCommandes({ page_size: 6, ordering: '-created_at' })
      .then(res => setRecentOrders((res.data.results || res.data || []).slice(0, 6)))
      .catch(() => {})

    // 2. Charger les parfums pour la vitrine
    setLoadingParfums(true)
    adminAPI.getParfums({ page_size: 50 })
      .then(res => setParfumsList(res.data.results || res.data || []))
      .catch(() => {})
      .finally(() => setLoadingParfums(false))
  }, [])

  const formatPrice = (price) => `${parseFloat(price || 0).toLocaleString('fr-MA')} MAD`

  // KPI Cards avec statistiques réelles
  const statCards = [
    {
      label: 'Chiffre d\'Affaires Total',
      value: formatPrice(stats?.chiffre_affaires_total || 0),
      sub: 'Toutes les commandes validées',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Revenus Ce Mois',
      value: formatPrice(stats?.chiffre_affaires_mois || 0),
      sub: 'Mois en cours',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'text-[#0f3d38]',
      bg: 'bg-teal-50',
    },
    {
      label: 'Panier Moyen',
      value: formatPrice(stats?.panier_moyen || 0),
      sub: 'Valeur moyenne par commande',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'text-purple-700',
      bg: 'bg-purple-50',
    },
    {
      label: 'Total Commandes',
      value: stats?.commandes_total || 0,
      sub: `${stats?.commandes_en_attente || 0} en attente`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      color: 'text-amber-700',
      bg: 'bg-amber-50',
    },
    {
      label: 'Gels Douche Actifs',
      value: stats?.total_parfums || parfumsList.length || 0,
      sub: `${stats?.total_marques || 1} collection AURA`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-[#0f3d38]',
      bg: 'bg-emerald-50',
    },
  ]

  // Données de la Courbe des Revenus (Jour vs Mois)
  const revenueData = useMemo(() => {
    if (chartPeriod === 'mois') {
      if (stats?.ventes_mois && stats.ventes_mois.length > 0) {
        return stats.ventes_mois
      }
      return [
        { label: 'Jan', revenu: 0, commandes: 0 },
        { label: 'Fév', revenu: 0, commandes: 0 },
        { label: 'Mar', revenu: 0, commandes: 0 },
        { label: 'Avr', revenu: 0, commandes: 0 },
        { label: 'Mai', revenu: 0, commandes: 0 },
        { label: 'Juin', revenu: 0, commandes: 0 },
        { label: 'Juil', revenu: 0, commandes: 0 },
        { label: 'Août', revenu: 0, commandes: 0 },
        { label: 'Sep', revenu: 0, commandes: 0 },
        { label: 'Oct', revenu: parseFloat(stats?.chiffre_affaires_mois || 0), commandes: stats?.commandes_total || 0 },
        { label: 'Nov', revenu: 0, commandes: 0 },
        { label: 'Déc', revenu: 0, commandes: 0 },
      ]
    }
    // Par jour (7 derniers jours)
    if (stats?.ventes_jours && stats.ventes_jours.length > 0) {
      return stats.ventes_jours
    }
    return [
      { label: 'Lun', revenu: 0, commandes: 0 },
      { label: 'Mar', revenu: 0, commandes: 0 },
      { label: 'Mer', revenu: 0, commandes: 0 },
      { label: 'Jeu', revenu: 0, commandes: 0 },
      { label: 'Ven', revenu: 0, commandes: 0 },
      { label: 'Sam', revenu: 0, commandes: 0 },
      { label: 'Dim', revenu: 0, commandes: 0 },
    ]
  }, [stats, chartPeriod])

  // Tracé SVG pour la courbe fluide
  const svgMetrics = useMemo(() => {
    const width = 600
    const height = 180
    const padding = 35
    const graphWidth = width - padding * 2
    const graphHeight = height - padding * 2

    const maxVal = Math.max(...revenueData.map(d => d.revenu), 200)
    const points = revenueData.map((d, i) => {
      const x = padding + (i / Math.max(revenueData.length - 1, 1)) * graphWidth
      const y = height - padding - (d.revenu / maxVal) * graphHeight
      return { x, y, ...d }
    })

    let pathD = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const mx = (p0.x + p1.x) / 2
      pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

    return { width, height, points, pathD, areaD, maxVal, padding }
  }, [revenueData])

  // Tous les Parfums & Ventes (Pour le Bar Chart / Courbe de bâtons)
  const allVentes = useMemo(() => {
    if (stats?.top_ventes && stats.top_ventes.length > 0) {
      return stats.top_ventes
    }
    return parfumsList.map((p) => {
      const totalStock = p.formats?.reduce((sum, f) => sum + (f.stock || 0), 0) || 0
      return {
        id: p.id,
        nom: p.nom,
        genre: p.genre,
        photo: p.photo_principale,
        ventes: 0,
        ventes_solo: 0,
        ventes_inclus_packs: 0,
        ca: 0,
        stock_restant: totalStock,
        actif: p.actif,
        is_pack: p.is_pack,
      }
    })
  }, [stats, parfumsList])

  // Filtrage par onglet Palmarès : Tous / Gels Solo / Packs Spéciaux
  const topVentes = useMemo(() => {
    if (ventesFilter === 'gels') return allVentes.filter(v => !v.is_pack)
    if (ventesFilter === 'packs') return allVentes.filter(v => v.is_pack)
    return allVentes
  }, [allVentes, ventesFilter])

  const maxVentesUnits = useMemo(() => {
    const maxVal = Math.max(...topVentes.map((t) => t.ventes || 0), 0)
    return maxVal > 0 ? maxVal : 1
  }, [topVentes])

  // Catégories de produits & répartition
  const categoryStats = useMemo(() => {
    if (stats?.categories_stats && stats.categories_stats.length > 0) {
      // Only show collections that have at least 1 product
      return stats.categories_stats.filter(c => c.count > 0)
    }
    return []
  }, [stats])

  const totalProductsCount = useMemo(() => {
    return categoryStats.reduce((sum, c) => sum + c.count, 0) || 1
  }, [categoryStats])

  // Filtrage des parfums affichés dans la vitrine
  const filteredParfums = useMemo(() => {
    if (selectedCategoryTab === 'all') return parfumsList
    if (selectedCategoryTab === 'homme') return parfumsList.filter(p => !p.is_pack && p.genre === 'homme')
    if (selectedCategoryTab === 'femme') return parfumsList.filter(p => !p.is_pack && p.genre === 'femme')
    if (selectedCategoryTab === 'mixte') return parfumsList.filter(p => !p.is_pack && p.genre === 'mixte')
    if (selectedCategoryTab === 'packs') return parfumsList.filter(p => p.is_pack)
    if (selectedCategoryTab === 'promos') return parfumsList.filter(p => p.is_promo)
    return parfumsList
  }, [parfumsList, selectedCategoryTab])

  const statusBadges = {
    en_attente: 'bg-amber-50 text-amber-800 border-amber-200',
    confirmee: 'bg-blue-50 text-blue-800 border-blue-200',
    en_livraison: 'bg-purple-50 text-purple-800 border-purple-200',
    livree: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    annulee: 'bg-rose-50 text-rose-800 border-rose-200',
  }

  const statusLabels = {
    en_attente: 'En attente',
    confirmee: 'Confirmée',
    en_livraison: 'En livraison',
    livree: 'Livrée',
    annulee: 'Annulée',
  }

  return (
    <div className="space-y-8">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wider text-[#0f3d38]">
            Tableau de Bord Analytique
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Indicateurs clés, courbes de revenus par jour et par mois, et palmarès des ventes • AURA COLLECTION
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={refreshDashboard}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-[#0f3d38] rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
          <Link
            to="/admin/commandes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f3d38] hover:bg-[#134d47] text-white rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Commandes Clients</span>
          </Link>

          <Link
            to="/admin/stock"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-[#0f3d38] rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Gestion des Stocks</span>
          </Link>
        </div>
      </div>

      {/* 1. Grille des Cartes Statistiques KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="bg-white rounded-3xl p-5 border border-gray-200/90 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.label}</span>
              <div className={`w-9 h-9 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-serif font-black text-[#0f3d38]">{card.value}</p>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* 2. SECTION ANALYTIQUE : Courbe des Revenus & Répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique 1 : Courbe des Revenus (MAD) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0f3d38]" />
                <h2 className="text-base font-bold text-[#0f3d38] uppercase tracking-wider">
                  Courbe d'Évolution des Revenus ({chartPeriod === 'mois' ? 'Par Mois' : 'Par Jour'})
                </h2>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {chartPeriod === 'mois'
                  ? 'Total des encaissements mensuels sur l\'ensemble de l\'année'
                  : 'Suivi quotidien des encaissements sur les 7 derniers jours'}
              </p>
            </div>

            {/* Sélecteur de période Fonctionnel : 7 jours vs Par Mois */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full self-start sm:self-auto">
              <button
                onClick={() => setChartPeriod('7j')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  chartPeriod === '7j'
                    ? 'bg-[#0f3d38] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-black hover:bg-gray-200/60'
                }`}
              >
                Par Jour (7j)
              </button>
              <button
                onClick={() => setChartPeriod('mois')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  chartPeriod === 'mois'
                    ? 'bg-[#0f3d38] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-black hover:bg-gray-200/60'
                }`}
              >
                Par Mois (Année)
              </button>
            </div>
          </div>

          {/* Tracé de la Courbe SVG Interactive */}
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}
              className="w-full h-48 sm:h-56 overflow-visible"
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2fb49c" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2fb49c" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0f3d38" />
                  <stop offset="50%" stopColor="#2fb49c" />
                  <stop offset="100%" stopColor="#68ccc2" />
                </linearGradient>
              </defs>

              {/* Lignes de repère horizontales */}
              <line x1={svgMetrics.padding} y1={svgMetrics.padding} x2={svgMetrics.width - svgMetrics.padding} y2={svgMetrics.padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1={svgMetrics.padding} y1={svgMetrics.height / 2} x2={svgMetrics.width - svgMetrics.padding} y2={svgMetrics.height / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1={svgMetrics.padding} y1={svgMetrics.height - svgMetrics.padding} x2={svgMetrics.width - svgMetrics.padding} y2={svgMetrics.height - svgMetrics.padding} stroke="#e2e8f0" strokeWidth="1" />

              {/* Zone dégradée sous la courbe */}
              <path d={svgMetrics.areaD} fill="url(#revenueGradient)" />

              {/* Ligne fluide de la courbe */}
              <path
                d={svgMetrics.pathD}
                fill="none"
                stroke="url(#strokeGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points sur la courbe avec hover tooltip */}
              {svgMetrics.points.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.is_current ? '6' : '4.5'}
                    className={`stroke-[#0f3d38] stroke-[2.5] hover:r-7 transition-all cursor-pointer ${
                      pt.is_current ? 'fill-[#2fb49c]' : 'fill-white hover:stroke-[#2fb49c]'
                    }`}
                    onMouseEnter={() => setActiveTooltip(pt)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  />
                  {/* Label sous l'axe X */}
                  <text
                    x={pt.x}
                    y={svgMetrics.height - 12}
                    textAnchor="middle"
                    className="text-[9px] fill-gray-500 font-bold"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Tooltip flottant au survol */}
            <AnimatePresence>
              {activeTooltip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-2 right-4 bg-[#0f3d38] text-white px-4 py-2.5 rounded-2xl text-xs shadow-xl border border-white/10 pointer-events-none"
                >
                  <p className="font-bold text-[#68ccc2]">{activeTooltip.label}</p>
                  <p className="text-white font-extrabold text-base">{formatPrice(activeTooltip.revenu)}</p>
                  <p className="text-[10px] text-gray-300">{activeTooltip.commandes} commande(s)</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Synthèse sous la courbe */}
          <div className="grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-gray-100 text-center">
            <div>
              <span className="text-[10px] uppercase text-gray-400 font-semibold block">Total Période</span>
              <strong className="text-sm font-extrabold text-[#0f3d38]">
                {formatPrice(revenueData.reduce((acc, d) => acc + d.revenu, 0))}
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase text-gray-400 font-semibold block">Pic de Ventes</span>
              <strong className="text-sm font-extrabold text-emerald-600">
                {formatPrice(Math.max(...revenueData.map(d => d.revenu), 0))}
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase text-gray-400 font-semibold block">Statut</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {chartPeriod === 'mois' ? 'Vue Mensuelle' : 'Temps Réel'}
              </span>
            </div>
          </div>
        </div>

        {/* Graphique 2 : Répartition des Produits par Catégorie */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0f3d38]" />
                <h2 className="text-base font-bold text-[#0f3d38] uppercase tracking-wider">
                  Produits par Catégorie
                </h2>
              </div>
              <span className="text-xs font-bold text-gray-400">
                {totalProductsCount} articles
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Répartition des gels douche parfumés, coffrets et promotions AURA
            </p>

            {/* Barres horizontales de répartition */}
            <div className="space-y-4">
              {categoryStats.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Aucune collection avec des produits actifs
                </div>
              ) : (
                categoryStats.map((cat, idx) => {
                  const percent = Math.round((cat.count / totalProductsCount) * 100) || 0
                  return (
                    <div key={cat.slug || idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-gray-700">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-normal">{cat.count} réf.</span>
                          <span className="text-[#0f3d38] font-bold">{percent}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.08 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-6">
            <Link
              to="/admin/collections"
              className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#0f3d38] rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <span>Gérer les Collections</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. NOUVELLE COURBE EN BÂTONS (BAR CHART) : GELS DOUCHE LES PLUS VENDUS */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2fb49c]" />
              <h2 className="text-lg font-serif font-bold text-[#0f3d38]">
                Palmarès des Ventes
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Volume d'unités vendues et CA par produit — inclut les sélections dans les packs
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#68ccc2]/20 text-[#0f3d38] border border-[#68ccc2]/40 self-start sm:self-auto">
            <svg className="w-3.5 h-3.5 text-[#0f3d38]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {topVentes.length} produit{topVentes.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Onglets de filtre */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {[
            {
              key: 'tous',
              label: 'Tous les Produits',
              icon: (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
            {
              key: 'gels',
              label: 'Gels Douche Solo',
              icon: (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.437l-.318.158a6 6 0 01-3.86.437L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              ),
            },
            {
              key: 'packs',
              label: 'Packs Spéciaux',
              icon: (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ),
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setVentesFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                ventesFilter === tab.key
                  ? 'bg-[#0f3d38] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Graphique de Bâtons (Bar Chart) */}
        {topVentes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucun produit dans cette catégorie
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
            {topVentes.map((item, idx) => {
              const heightPercent = maxVentesUnits > 0 ? Math.max(12, Math.round((item.ventes / maxVentesUnits) * 100)) : 15
              const rankColors = ['bg-amber-400 text-amber-950', 'bg-slate-300 text-slate-800', 'bg-amber-700/60 text-white', 'bg-gray-100 text-gray-600', 'bg-gray-100 text-gray-600', 'bg-gray-100 text-gray-600']
              const barGradient = item.is_pack
                ? 'bg-gradient-to-t from-amber-700 via-amber-500 to-amber-300'
                : 'bg-gradient-to-t from-[#0f3d38] via-[#2fb49c] to-[#68ccc2]'

              return (
                <div
                  key={item.id || idx}
                  className={`flex flex-col items-center p-3 rounded-2xl border hover:shadow-xs transition-all group ${
                    item.is_pack
                      ? 'bg-amber-50/60 border-amber-200/70 hover:border-amber-400'
                      : 'bg-gray-50/70 border-gray-100 hover:border-[#2fb49c]'
                  }`}
                >
                  {/* Badge de Rang + Type */}
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center ${rankColors[idx] || 'bg-gray-100 text-gray-600'}`}>
                      #{idx + 1}
                    </span>
                    {item.is_pack ? (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-500 text-white tracking-wider">
                        PACK
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-semibold capitalize">
                        {item.genre}
                      </span>
                    )}
                  </div>

                  {/* Miniature du Gel Douche */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-200 shadow-2xs mb-3 relative group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
                    {item.photo ? (
                      <img src={item.photo} alt={item.nom} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 bg-gray-50">
                        {item.is_pack ? (
                          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-[#2fb49c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.437l-.318.158a6 6 0 01-3.86.437L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bâton vertical (Histogram bar) */}
                  <div className="w-full h-36 flex flex-col justify-end items-center my-2 bg-white/80 rounded-xl p-1.5 border border-gray-100">
                    <span className="text-[11px] font-extrabold text-[#0f3d38] mb-1">
                      {item.ventes} <span className="text-[9px] font-normal text-gray-400">u.</span>
                    </span>
                    <div className="w-full max-w-[36px] bg-gray-100 rounded-t-lg h-24 flex items-end overflow-hidden">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className={`w-full ${barGradient} rounded-t-lg`}
                      />
                    </div>
                    {/* Détail solo / en pack pour les gels individuels */}
                    {!item.is_pack && (item.ventes_solo > 0 || item.ventes_inclus_packs > 0) && (
                      <div className="mt-1.5 text-center space-y-0.5">
                        {item.ventes_solo > 0 && (
                          <p className="text-[8px] text-gray-400">
                            {item.ventes_solo} solo
                          </p>
                        )}
                        {item.ventes_inclus_packs > 0 && (
                          <p className="text-[8px] text-amber-600 font-semibold">
                            {item.ventes_inclus_packs} en pack
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Nom du parfum & CA */}
                  <div className="text-center w-full mt-1">
                    <p className="text-xs font-bold text-[#0f3d38] truncate" title={item.nom}>
                      {item.nom}
                    </p>
                    <p className={`text-[10px] font-extrabold mt-0.5 ${item.is_pack ? 'text-amber-600' : 'text-[#2fb49c]'}`}>
                      {item.ca > 0 ? formatPrice(item.ca) : 'En rayon'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. VITRINE DES GELS & PACKS + COMMANDES RÉCENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Colonne Gauche (2/3) : Vitrine des Parfums de la Boutique */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-lg font-serif font-bold text-[#0f3d38]">
                  Vitrine des Gels Parfum & Packs
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Vue d'ensemble de vos créations, tarifs, promotions et packs disponibles sur le site
              </p>
            </div>

            <Link
              to="/admin/produits"
              className="text-xs font-bold text-[#0f3d38] hover:underline uppercase tracking-wider shrink-0"
            >
              Gérer tous les produits →
            </Link>
          </div>

          {/* Onglets de filtrage rapide de la vitrine */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 p-1.5 rounded-2xl border border-gray-200/70">
            {[
              { id: 'all', label: 'Tous les produits' },
              { id: 'homme', label: 'Gel Homme' },
              { id: 'femme', label: 'Gel Femme' },
              { id: 'packs', label: 'Packs Spéciaux' },
              { id: 'promos', label: 'En Promotion' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategoryTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategoryTab === tab.id
                    ? 'bg-[#0f3d38] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-black hover:bg-gray-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grille des cartes de parfums */}
          {loadingParfums ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0f3d38] rounded-full animate-spin" />
            </div>
          ) : filteredParfums.length === 0 ? (
            <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Aucun parfum ne correspond à ce filtre.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredParfums.slice(0, 10).map((parfum) => (
                <div
                  key={parfum.id}
                  className="p-3.5 rounded-2xl border border-gray-200/80 bg-white hover:border-[#0f3d38]/40 hover:shadow-xs transition-all flex items-center gap-3.5 group"
                >
                  {/* Photo miniature */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#eff0f5] border border-gray-100 shrink-0 relative">
                    {parfum.photo_principale ? (
                      <img
                        src={parfum.photo_principale}
                        alt={parfum.nom}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400 font-serif">
                        AURA
                      </div>
                    )}
                    {parfum.is_promo && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-rose-600 text-white">
                        %
                      </span>
                    )}
                  </div>

                  {/* Infos & Prix */}
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block truncate">
                      {parfum.marque_nom || 'AURA COLLECTION'}
                    </span>
                    <h3 className="text-xs font-bold text-[#0f3d38] truncate">
                      {parfum.nom}
                    </h3>

                    {/* Badges de statut */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {parfum.is_pack ? (
                        <span className="text-[9px] font-bold px-2 py-0.2 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                          Pack Spécial
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold px-2 py-0.2 bg-gray-100 text-gray-600 rounded-full capitalize">
                          {parfum.genre}
                        </span>
                      )}

                      {parfum.is_promo && parfum.prix_promo ? (
                        <span className="text-[10px] font-extrabold text-rose-600">
                          {parseFloat(parfum.prix_promo).toFixed(0)} DH
                          <span className="text-[9px] text-gray-400 line-through ml-1 font-normal">
                            {parseFloat(parfum.prix_min || parfum.formats?.[0]?.prix || 0).toFixed(0)} DH
                          </span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#0f3d38]">
                          {parfum.prix_min ? `${parseFloat(parfum.prix_min).toFixed(0)} DH` : parfum.formats?.[0]?.prix ? `${parseFloat(parfum.formats[0].prix).toFixed(0)} DH` : '—'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action rapide : Lien direct vers la fiche */}
                  <Link
                    to={`/parfum/${parfum.id}`}
                    target="_blank"
                    className="w-8 h-8 rounded-full bg-gray-50 hover:bg-[#0f3d38] text-gray-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
                    title="Voir sur la boutique"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne Droite (1/3) : Commandes Récentes */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-[#0f3d38] uppercase tracking-wider">
                Commandes Récentes
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Derniers achats clients en direct</p>
            </div>
            <Link
              to="/admin/commandes"
              className="text-xs font-bold text-[#0f3d38] hover:underline uppercase tracking-wider shrink-0"
            >
              Voir tout →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xs font-bold text-[#0f3d38]">Commandes réinitialisées</p>
              <p className="text-[11px] text-gray-400 mt-1">Prêt à recevoir les prochaines commandes réelles des clients !</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0f3d38] truncate">
                      #{order.id} — {order.nom_client}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {order.ville} • {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusBadges[order.statut] || 'bg-gray-100 text-gray-700'}`}>
                      {statusLabels[order.statut] || order.statut}
                    </span>
                    <p className="text-xs font-extrabold text-[#0f3d38] mt-0.5">{formatPrice(order.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <Link
              to="/admin/commandes"
              className="w-full py-2.5 bg-[#0f3d38] hover:bg-[#134d47] text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <span>Accéder aux Commandes</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
