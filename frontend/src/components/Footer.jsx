import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState(null)

  const policies = {
    privacy: {
      title: 'Politique de confidentialité',
      content: `Chez AURA COLLECTION, la confidentialité de vos données personnelles est une priorité absolue. Nous collectons uniquement les informations strictement nécessaires au traitement et à l'expédition de vos commandes de gels douche parfumés (nom, numéro de téléphone, adresse de livraison, ville). Vos données ne sont en aucun cas vendues ou cédées à des tiers. Vous disposez d'un droit permanent d'accès et de rectification de vos données en nous contactant directement.`,
    },
    refund: {
      title: 'Politique de retour et remboursement',
      content: `Nous garantissons l'authenticité et la qualité supérieure de tous nos gels douche parfumés AURA COLLECTION (formules 0% sulfates, 0% parabènes). Si vous recevez un produit endommagé durant la livraison ou non conforme à votre commande, contactez-nous sous 48 heures avec photos à l'appui pour un remplacement immédiat ou un remboursement intégral. Pour des raisons d'hygiène évidentes, les flacons ouverts et utilisés ne peuvent faire l'objet d'un retour.`,
    },
    terms: {
      title: "Conditions générales de vente",
      content: `En commandant sur AURA COLLECTION, vous acceptez sans réserve les présentes conditions générales. Nos prix sont indiqués en Dirhams Marocains (MAD / DH). Nos offres promotionnelles (Pack Spécial 3 Gels à 239 DH et Pack Spécial 4 Gels à 299 DH) sont valables dans la limite des stocks disponibles. Tous nos visuels, logos et descriptions de produits sont la propriété exclusive de Maison AURA.`,
    },
    shipping: {
      title: "Politique d'expédition & Livraison",
      content: `Nous livrons partout au Maroc avec un service rapide et sécurisé :
- Délais : Livraison express en 24 à 48 heures dans toutes les villes du Royaume (Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir, etc.).
- Tarifs : Frais de port réduits ou offerts selon nos offres en cours.
- Paiement : Paiement à la livraison en espèces (Cash on Delivery) pour une sécurité et une tranquillité totales. Vous vérifiez votre colis lors de la remise.`,
    },
  }

  return (
    <>
      <footer className="bg-white border-t border-gray-200 mt-20 text-[#0f3d38]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex flex-col items-center justify-center text-center space-y-8">
            {/* Logo and Brand Name en Cercle */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-0.5 border-2 border-[#0f3d38]/20 shadow-md bg-[#68ccc2] mb-3">
                <img
                  src="/logo-aura.jpeg"
                  alt="AURA COLLECTION - Gel Douche Parfumé"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <p className="text-xs text-[#0f3d38] font-bold uppercase tracking-widest mt-1">
                L'art du gel douche parfumé de haute facture au Maroc
              </p>
            </div>

            {/* Social Media Links: Instagram & WhatsApp */}
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/maison.aura.collection?rpxt=OWVpeHhzdm40cWp5"
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 rounded-full bg-[#f0fbf8] flex items-center justify-center text-[#0f3d38] hover:bg-[#0f3d38] hover:text-white transition-all shadow-2xs focus:outline-none cursor-pointer"
                aria-label="Instagram @maison.aura.collection"
                title="Instagram @maison.aura.collection"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              <a
                href="https://wa.me/212651470308"
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 rounded-full bg-[#f0fbf8] flex items-center justify-center text-[#0f3d38] hover:bg-[#0f3d38] hover:text-white transition-all shadow-2xs focus:outline-none cursor-pointer"
                aria-label="WhatsApp AURA COLLECTION (+212 651-470308)"
                title="WhatsApp AURA COLLECTION (+212 6 51 47 03 08)"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
              </a>
            </div>

            {/* Policy Links */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-gray-500">
              <button
                onClick={() => setActivePolicy(policies.privacy)}
                className="hover:text-[#0f3d38] underline-offset-4 hover:underline transition-colors cursor-pointer"
              >
                Politique de confidentialité
              </button>
              <button
                onClick={() => setActivePolicy(policies.refund)}
                className="hover:text-[#0f3d38] underline-offset-4 hover:underline transition-colors cursor-pointer"
              >
                Politique de remboursement
              </button>
              <button
                onClick={() => setActivePolicy(policies.terms)}
                className="hover:text-[#0f3d38] underline-offset-4 hover:underline transition-colors cursor-pointer"
              >
                Conditions d’utilisation
              </button>
              <button
                onClick={() => setActivePolicy(policies.shipping)}
                className="hover:text-[#0f3d38] underline-offset-4 hover:underline transition-colors cursor-pointer"
              >
                Politique d’expédition
              </button>
            </div>

            {/* Copyright */}
            <div className="pt-2 text-xs font-medium text-gray-400">
              <p>© 2026, <strong>AURA COLLECTION</strong>. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      <AnimatePresence>
        {activePolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePolicy(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-8 z-10 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-lg font-bold uppercase tracking-wider text-[#0f3d38]">
                  {activePolicy.title}
                </h3>
                <button
                  onClick={() => setActivePolicy(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100"
                  aria-label="Fermer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {activePolicy.content}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setActivePolicy(null)}
                  className="px-5 py-2.5 bg-[#0f3d38] text-white text-xs font-bold uppercase rounded-full hover:bg-[#2fb49c] transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
