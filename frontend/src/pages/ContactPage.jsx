import { useState } from 'react'
import { motion } from 'framer-motion'
import { contactAPI } from '../api/client'

export default function ContactPage() {
  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState({ type: '', text: '' })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nom.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ type: 'error', text: 'Veuillez remplir les champs obligatoires (Nom, E-mail, Commentaire).' })
      return
    }

    setSending(true)
    setStatus({ type: '', text: '' })

    const waText = `Bonjour AURA COLLECTION,\n\n👤 *Nom :* ${form.nom.trim()}\n📧 *E-mail :* ${form.email.trim()}${form.telephone.trim() ? `\n📞 *Téléphone :* ${form.telephone.trim()}` : ''}\n\n💬 *Message :*\n${form.message.trim()}`
    const waUrl = `https://wa.me/212651470308?text=${encodeURIComponent(waText)}`

    try {
      await contactAPI.sendMessage(form)
    } catch (err) {
      console.warn('Contact API non-blocking error:', err)
    } finally {
      setSending(false)
      setStatus({
        type: 'success',
        text: 'Votre message a bien été envoyé ! Votre application WhatsApp s’ouvre pour échanger directement avec notre équipe.',
        waUrl: waUrl,
      })
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      } catch {
        window.scrollTo(0, 0)
      }
      window.open(waUrl, '_blank')
      setForm({ nom: '', email: '', telephone: '', message: '' })
    }
  }

  return (
    <div className="min-h-screen bg-[#eff0f5] py-12 lg:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Title Matching Shopify Refresh */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f3d38] uppercase tracking-wider font-sans">
            Contact
          </h1>
          <div className="w-12 h-1 bg-[#0f3d38] rounded-full mx-auto mt-3"></div>
        </div>

        {/* Contact Form Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-200/90 shadow-sm">
          {status.text && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm font-medium ${
                status.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <p>{status.text}</p>
              {status.waUrl && (
                <div className="mt-3">
                  <a
                    href={status.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                    </svg>
                    <span>Ouvrir WhatsApp (+212 6 51 47 03 08)</span>
                  </a>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom & E-mail in two columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nom" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Nom
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  placeholder="Nom"
                  required
                  className="w-full px-4 py-3 bg-[#eff0f5] border border-gray-200 rounded-xl text-sm text-[#0f3d38] placeholder-gray-400 focus:outline-none focus:border-[#0f3d38] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="E-mail"
                  required
                  className="w-full px-4 py-3 bg-[#eff0f5] border border-gray-200 rounded-xl text-sm text-[#0f3d38] placeholder-gray-400 focus:outline-none focus:border-[#0f3d38] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Numéro de téléphone */}
            <div>
              <label htmlFor="telephone" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                placeholder="Numéro de téléphone (ex: 06 12 34 56 78)"
                className="w-full px-4 py-3 bg-[#eff0f5] border border-gray-200 rounded-xl text-sm text-[#0f3d38] placeholder-gray-400 focus:outline-none focus:border-[#0f3d38] focus:bg-white transition-colors"
              />
            </div>

            {/* Commentaire / Message */}
            <div>
              <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                Commentaire
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                value={form.message}
                onChange={handleChange}
                placeholder="Commentaire"
                required
                className="w-full px-4 py-3 bg-[#eff0f5] border border-gray-200 rounded-xl text-sm text-[#0f3d38] placeholder-gray-400 focus:outline-none focus:border-[#0f3d38] focus:bg-white transition-colors resize-y"
              ></textarea>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#0f3d38] hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {sending ? 'Envoi en cours...' : 'Envoyer'}
              </button>
            </div>
          </form>
        </div>

        {/* WhatsApp & Social Assistance Box */}
        <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f3d38]">
              Besoin d'une réponse immédiate ?
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Notre équipe AURA COLLECTION est disponible 7j/7 sur WhatsApp au{' '}
              <strong className="text-[#0f3d38] font-semibold">+212 6 51 47 03 08</strong>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto flex-shrink-0">
            <a
              href="https://www.instagram.com/maison.aura.collection?rpxt=OWVpeHhzdm40cWp5"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-[#f0fbf8] hover:bg-[#0f3d38] text-[#0f3d38] hover:text-white border border-[#d4e8e3] text-xs font-bold uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2 shadow-2xs"
              title="Instagram @maison.aura.collection"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Instagram</span>
            </a>
            <a
              href="https://wa.me/212651470308?text=Bonjour%20AURA%20COLLECTION,%20j'ai%20une%20question%20concernant%20vos%20gels%20douche%20parfum%C3%A9s"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2 shadow-sm"
              title="Discuter sur WhatsApp (+212 6 51 47 03 08)"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
