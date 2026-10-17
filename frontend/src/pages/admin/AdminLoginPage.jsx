import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { adminAPI } from '../../api/client'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await adminAPI.login({ username, password })
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      navigate('/admin')
    } catch (err) {
      setError('Identifiants invalides. Veuillez vérifier vos accès.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Vidéo d'arrière-plan en boucle infinie */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/login-bg.mp4"
      />

      {/* Overlay sombre pour lisibilité */}
      <div className="absolute inset-0 bg-black/55 z-[1]" />

      {/* Carte de connexion avec glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 backdrop-blur-xl bg-white/15 rounded-3xl border border-white/20 shadow-2xl p-8 sm:p-10 w-full max-w-md text-center"
      >
        <div className="mb-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full overflow-hidden p-0.5 border-2 border-white/30 shadow-lg bg-white/10 mb-3">
            <img
              src="/logo-aura.jpeg"
              alt="AURA COLLECTION"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h2 className="text-base font-black tracking-widest text-white uppercase font-serif drop-shadow-md">
            AURA COLLECTION
          </h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mt-0.5">
            Espace Administration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
              placeholder="Nom d'utilisateur"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
              placeholder="••••••••"
              required
            /> 
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 text-xs text-center font-medium"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-lg hover:shadow-xl border border-white/20 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10">
          <Link
            to="/"
            className="text-xs font-medium text-white/50 hover:text-white transition-colors"
          >
            ← Retour à la boutique
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
