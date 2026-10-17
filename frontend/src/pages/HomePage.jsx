import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { catalogAPI } from '../api/client'

export default function HomePage() {
  const defaultCollections = [
    {
      id: 'gel-parfum-homme',
      slug: 'gel-parfum-homme',
      title: 'GEL PARFUM HOMME',
      subtitle: 'Bleu de Chanel • Fraîcheur boisée (250ml)',
      image: '/gels/bleu-chanel.jpeg',
      link: '/catalogue?collection=gel-parfum-homme',
    },
    {
      id: 'gel-parfum-femme',
      slug: 'gel-parfum-femme',
      title: 'GEL PARFUM FEMME',
      subtitle: 'Mademoiselle, J’adore & My Way (250ml)',
      image: '/gels/mademoiselle.jpeg',
      link: '/catalogue?collection=gel-parfum-femme',
    },
    {
      id: 'packs-speciaux',
      slug: 'packs-speciaux',
      title: 'PACKS SPÉCIAUX',
      subtitle: 'Pack Spécial 3 Gels (239 DH) & Pack Spécial 4 Gels (299 DH)',
      image: '/gels/pack-de-3.png',
      link: '/catalogue?collection=packs-speciaux',
    },
  ]

  const [collections, setCollections] = useState(defaultCollections)

  useEffect(() => {
    catalogAPI.getCollections()
      .then((res) => {
        const data = res.data.results || res.data
        if (data && data.length > 0) {
          const imageMap = {
            'gel-parfum-homme': '/gels/bleu-chanel.jpeg',
            'parfums-homme': '/gels/bleu-chanel.jpeg',
            'gel-parfum-femme': '/gels/mademoiselle.jpeg',
            'parfums-femme': '/gels/mademoiselle.jpeg',
            'packs-speciaux': '/gels/pack-de-3.png',
            'promotions': '/gels/pack-de-4.jpeg',
          }
          const mainSlugs = ['gel-parfum-homme', 'gel-parfum-femme', 'packs-speciaux']
          const filtered = data.filter(c => mainSlugs.includes(c.slug) || ['parfums-homme', 'parfums-femme'].includes(c.slug))
          const displayData = filtered.length >= 3 ? filtered : data
          const merged = displayData.slice(0, 3).map((c) => ({
            id: c.id,
            slug: c.slug,
            title: c.nom.toUpperCase(),
            subtitle: c.description || 'Collection exclusive AURA',
            image: c.image || imageMap[c.slug] || '/gels/mademoiselle.jpeg',
            link: `/catalogue?collection=${c.slug}`,
          }))
          if (merged.length > 0) {
            setCollections(merged)
          }
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="bg-[#f4faf8] pb-16">
      {/* 1. Hero Banner: Pleine largeur, vidéo d'ambiance en boucle infinie */}
      <section className="relative w-full min-h-[480px] sm:h-[520px] lg:h-[600px] py-12 sm:py-0 overflow-hidden bg-[#082522] flex items-center justify-center">
        {/* Background Vidéo en boucle infinie */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center scale-105 brightness-[0.55] transition-transform duration-1000"
            src="/login-bg.mp4"
          />
          {/* Dégradé émeraude et noir luxueux pour une lisibilité parfaite */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#082522] via-[#082522]/70 to-[#082522]/40" />
          <div className="absolute inset-0 bg-[#0f3d38]/30 mix-blend-multiply" />
        </div>

        {/* Contenu textuel centré sur l'image */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center text-white flex flex-col items-center">
          {/* Badge élégant */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#2fb49c]/40 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8eead1] mb-5 shadow-lg"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2fb49c] animate-pulse" />
            Haute Parfumerie & Gels Douche Sensoriels
          </motion.div>

          {/* Nom de la Marque */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-widest uppercase text-white drop-shadow-md"
            style={{ letterSpacing: '0.12em' }}
          >
            AURA COLLECTION
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-[#2fb49c] mt-1"
          >
            GEL DOUCHE PARFUMÉ • 250 ML
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#2fb49c] to-transparent my-4"
          />

          {/* Tagline & Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-xs sm:text-sm lg:text-base text-gray-200/95 font-light max-w-2xl leading-relaxed drop-shadow-sm mb-7"
          >
            L’élégance des grands parfums, au cœur de votre quotidien. Plus qu’un gel douche, vivez une expérience sensorielle unique avec des formules d’exception sans sulfates ni parabènes.
          </motion.p>

          {/* Boutons d'Action */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto max-w-sm sm:max-w-none"
          >
            <Link
              to="/catalogue"
              className="px-6 sm:px-10 py-3.5 bg-[#2fb49c] hover:bg-[#239380] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 cursor-pointer text-center"
            >
              Découvrir la collection
            </Link>
            <Link
              to="/catalogue?collection=packs-speciaux"
              className="px-6 sm:px-10 py-3.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 shadow-xl hover:scale-105 cursor-pointer text-center"
            >
              Voir les Packs (dès 239 DH)
            </Link>
          </motion.div>

          {/* Avantages rassurants */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-[11px] font-medium text-gray-300 tracking-wider uppercase"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#2fb49c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>0% Sulfates • 0% Parabènes</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#2fb49c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Format Généreux 250 ML</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#2fb49c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Paiement à la livraison</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Offers Banner (Offre Spéciale : 1 unité 89 DH | Pack 3 à 239 DH | Pack 4 à 299 DH) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl border border-[#d4e8e3] shadow-lg p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Offre 1 */}
            <div className="flex flex-col items-center text-center p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#f0fbf8] text-[#0f3d38] border border-[#d4e8e3] mb-2">
                À L'Unité (250 ML)
              </span>
              <h4 className="text-xl font-extrabold text-[#0f3d38]">1 Gel Douche</h4>
              <p className="text-2xl font-black text-[#2fb49c] my-1">89 DH</p>
              <p className="text-xs text-gray-500">Parfum au choix de 250ml</p>
            </div>

            {/* Offre 2 : Pack 3 */}
            <div className="flex flex-col items-center text-center p-3 pt-6 md:pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2 font-semibold">
                Économisez 28 DH
              </span>
              <h4 className="text-xl font-extrabold text-[#0f3d38]">Pack de 3 Gels</h4>
              <div className="flex items-baseline gap-2 my-1">
                <span className="text-2xl font-black text-[#2fb49c]">239 DH</span>
                <span className="text-sm text-gray-400 line-through">267 DH</span>
              </div>
              <p className="text-xs text-gray-500">3 fragrances au choix (3 x 250ml)</p>
            </div>

            {/* Offre 3 : Pack 4 (Meilleure Offre) */}
            <div className="flex flex-col items-center text-center p-3 pt-6 md:pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#0f3d38] text-white mb-2 shadow-xs inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>Meilleure Offre • Éco 57 DH</span>
              </span>
              <h4 className="text-xl font-extrabold text-[#0f3d38]">Pack Spécial (4 Gels)</h4>
              <div className="flex items-baseline gap-2 my-1">
                <span className="text-2xl font-black text-[#0f3d38]">299 DH</span>
                <span className="text-sm text-gray-400 line-through">356 DH</span>
              </div>
              <p className="text-xs text-gray-500">Collection intégrale (4 x 250ml)</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Collections Section (Exactement les 3 Collections demandées) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f3d38] uppercase tracking-wider font-sans">
              Nos Collections
            </h2>
            <div className="w-12 h-1 bg-[#2fb49c] rounded-full mt-2"></div>
          </div>
          <Link
            to="/catalogue"
            className="text-xs font-bold uppercase tracking-widest text-[#0f3d38] hover:text-[#2fb49c] flex items-center gap-1 group"
          >
            <span>Voir tout</span>
            <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div key={col.id || col.slug}>
              <Link
                to={col.link}
                className="group block bg-white rounded-3xl overflow-hidden border border-[#d4e8e3] shadow-xs hover:shadow-xl transition-all duration-300"
              >
                {/* 4:5 Aspect Ratio Image */}
                <div className="aspect-[4/3] sm:aspect-[4/3] bg-[#f0fbf8] overflow-hidden relative">
                  <img
                    src={col.image}
                    alt={col.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </div>

                {/* Caption / Title */}
                <div className="p-5 flex flex-col justify-between min-h-[90px]">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f3d38] group-hover:text-[#2fb49c] flex items-center justify-between gap-1 transition-colors">
                    <span className="line-clamp-1">{col.title}</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-[#2fb49c] group-hover:translate-x-1 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </h3>
                  {col.subtitle && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {col.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Bouton d'accès direct au Catalogue complet */}
        <div className="mt-12 text-center">
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-3 px-10 py-4 bg-[#0f3d38] hover:bg-[#134d47] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 cursor-pointer"
          >
            <span>Explorer tout le catalogue</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}
