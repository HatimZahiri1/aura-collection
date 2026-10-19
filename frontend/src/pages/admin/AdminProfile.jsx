import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { adminAPI } from '../../api/client'

export default function AdminProfile() {
  // Profil state
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileData, setProfileData] = useState({
    id: null,
    username: '',
    email: '',
    is_superuser: false,
    date_joined: '',
  })
  const [usernameInput, setUsernameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Fetch initial profile
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoadingProfile(true)
    setProfileError('')
    try {
      const res = await adminAPI.getProfile()
      setProfileData(res.data)
      setUsernameInput(res.data.username || '')
      setEmailInput(res.data.email || '')
    } catch (err) {
      setProfileError("Impossible de charger les données du profil.")
    } finally {
      setLoadingProfile(false)
    }
  }

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileSuccess('')
    setProfileError('')

    if (!usernameInput.trim()) {
      setProfileError("Le nom d'utilisateur ne peut pas être vide.")
      return
    }

    setSavingProfile(true)
    try {
      const res = await adminAPI.updateProfile({
        username: usernameInput.trim(),
        email: emailInput.trim(),
      })
      setProfileData(res.data.user || { ...profileData, username: usernameInput, email: emailInput })
      setProfileSuccess(res.data.detail || "Nom d'utilisateur et email enregistrés avec succès !")
      setTimeout(() => setProfileSuccess(''), 5000)
    } catch (err) {
      const data = err.response?.data
      if (data?.username) {
        setProfileError(Array.isArray(data.username) ? data.username[0] : data.username)
      } else if (data?.detail) {
        setProfileError(data.detail)
      } else {
        setProfileError("Une erreur est survenue lors de la mise à jour du profil.")
      }
    } finally {
      setSavingProfile(false)
    }
  }

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Vide', color: 'bg-gray-200', text: 'text-gray-400' }
    let score = 0
    if (pass.length >= 6) score += 1
    if (pass.length >= 10) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1

    if (score <= 1) return { score: 1, label: 'Faible', color: 'bg-red-500', text: 'text-red-600' }
    if (score === 2 || score === 3) return { score: 2, label: 'Moyen', color: 'bg-amber-500', text: 'text-amber-600' }
    if (score === 4) return { score: 3, label: 'Fort', color: 'bg-teal-500', text: 'text-teal-600' }
    return { score: 4, label: 'Très robuste', color: 'bg-emerald-600', text: 'text-emerald-600' }
  }

  const pwdStrength = getPasswordStrength(newPassword)
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword
  const passwordMismatch = confirmPassword && newPassword !== confirmPassword

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordSuccess('')
    setPasswordError('')

    if (!currentPassword) {
      setPasswordError("Veuillez saisir votre mot de passe actuel.")
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit comporter au moins 6 caractères.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les deux nouveaux mots de passe ne correspondent pas.")
      return
    }

    setSavingPassword(true)
    try {
      const res = await adminAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      setPasswordSuccess(res.data.detail || "Votre mot de passe a été modifié avec succès !")
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(''), 6000)
    } catch (err) {
      const data = err.response?.data
      if (data?.current_password) {
        setPasswordError(Array.isArray(data.current_password) ? data.current_password[0] : data.current_password)
      } else if (data?.new_password) {
        setPasswordError(Array.isArray(data.new_password) ? data.new_password[0] : data.new_password)
      } else if (data?.confirm_password) {
        setPasswordError(Array.isArray(data.confirm_password) ? data.confirm_password[0] : data.confirm_password)
      } else if (data?.detail) {
        setPasswordError(data.detail)
      } else {
        setPasswordError("Erreur lors de la modification du mot de passe.")
      }
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0f3d38] via-[#134d47] to-[#0f3d38] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-[#2fb49c]/20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#2fb49c]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-20 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold uppercase tracking-wider text-[#8eead1]">
              <span className="w-2 h-2 rounded-full bg-[#2fb49c] animate-pulse" />
              Sécurité du Compte & Identifiants
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight">
              Gestion de votre Compte Administrateur
            </h1>
            <p className="text-sm text-white/70 max-w-2xl font-light">
              Gérez ici votre nom d'utilisateur pour la connexion à l'espace de gestion et renouvelez votre mot de passe en toute sécurité.
            </p>
          </div>

          {/* Badge utilisateur actuel */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-lg shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2fb49c] to-[#0f3d38] flex items-center justify-center font-bold text-lg text-white border-2 border-white/40 shadow-md">
              {(profileData.username || 'A')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">Connecté en tant que</p>
              <p className="text-base font-bold text-white tracking-wide font-mono">
                {loadingProfile ? 'Chargement...' : profileData.username}
              </p>
              <span className="inline-block px-2 py-0.5 mt-0.5 rounded-full bg-[#2fb49c]/30 text-[#8eead1] text-[10px] font-semibold uppercase tracking-wider">
                Super Administrateur
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* ========================================================= */}
        {/* CARTE 1 : Nom d'utilisateur & Informations générales       */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl border border-[#d4e8e3] p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-[#f0fbf8] border border-[#2fb49c]/30 flex items-center justify-center text-[#0f3d38]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0f3d38] uppercase tracking-wider">
                  Identifiants du Compte
                </h2>
                <p className="text-xs text-gray-500">
                  Modifiez votre nom d'utilisateur utilisé pour vous connecter
                </p>
              </div>
            </div>

            {/* Alertes Profil */}
            <AnimatePresence>
              {profileSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{profileSuccess}</span>
                </motion.div>
              )}

              {profileError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{profileError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Nom d'utilisateur <span className="text-[#2fb49c]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    required
                    minLength={3}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8faf9] border border-gray-200 focus:border-[#2fb49c] focus:bg-white rounded-xl text-sm font-medium text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#2fb49c]/20"
                    placeholder="ex: admin"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ce nom sera requis lors de votre prochaine connexion sur la page d'administration.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Email administratif
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8faf9] border border-gray-200 focus:border-[#2fb49c] focus:bg-white rounded-xl text-sm font-medium text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#2fb49c]/20"
                    placeholder="admin@parfum.ma"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Utilisé pour recevoir les alertes système ou les notifications de réinitialisation.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile || loadingProfile}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#0f3d38] hover:bg-[#144f49] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Enregistrer le Nom d'utilisateur</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Rôle système</span>
            <span className="font-semibold text-[#0f3d38]">Administrateur Principal</span>
          </div>
        </motion.div>


        {/* ========================================================= */}
        {/* CARTE 2 : Mot de passe & Sécurité                          */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-3xl border border-[#d4e8e3] p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-[#f0fbf8] border border-[#2fb49c]/30 flex items-center justify-center text-[#0f3d38]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0f3d38] uppercase tracking-wider">
                  Modifier le Mot de Passe
                </h2>
                <p className="text-xs text-gray-500">
                  Renouvelez votre mot de passe pour garantir la sécurité de la boutique
                </p>
              </div>
            </div>

            {/* Alertes Mot de Passe */}
            <AnimatePresence>
              {passwordSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-bold">{passwordSuccess}</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Votre session reste active avec le nouveau mot de passe.</p>
                  </div>
                </motion.div>
              )}

              {passwordError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{passwordError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
              {/* Mot de passe actuel */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Mot de passe actuel <span className="text-[#2fb49c]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 pr-10 bg-[#f8faf9] border border-gray-200 focus:border-[#2fb49c] focus:bg-white rounded-xl text-sm font-medium text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#2fb49c]/20"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nouveau mot de passe <span className="text-[#2fb49c]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 pr-10 bg-[#f8faf9] border border-gray-200 focus:border-[#2fb49c] focus:bg-white rounded-xl text-sm font-medium text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#2fb49c]/20"
                    placeholder="Au moins 6 caractères"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Indicateur de force */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">Robustesse :</span>
                      <span className={`font-bold ${pwdStrength.text}`}>{pwdStrength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full transition-all duration-300 ${pwdStrength.score >= 1 ? pwdStrength.color : 'bg-transparent'} flex-1`} />
                      <div className={`h-full transition-all duration-300 ${pwdStrength.score >= 2 ? pwdStrength.color : 'bg-transparent'} flex-1`} />
                      <div className={`h-full transition-all duration-300 ${pwdStrength.score >= 3 ? pwdStrength.color : 'bg-transparent'} flex-1`} />
                      <div className={`h-full transition-all duration-300 ${pwdStrength.score >= 4 ? pwdStrength.color : 'bg-transparent'} flex-1`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmer le nouveau mot de passe */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Confirmer le nouveau mot de passe <span className="text-[#2fb49c]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full px-4 py-2.5 pr-10 bg-[#f8faf9] border rounded-xl text-sm font-medium text-gray-800 transition-all focus:outline-none focus:ring-2 ${
                      passwordsMatch
                        ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-200'
                        : passwordMismatch
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                        : 'border-gray-200 focus:border-[#2fb49c] focus:ring-[#2fb49c]/20'
                    }`}
                    placeholder="Confirmez à l'identique"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {passwordsMatch && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Les mots de passe correspondent parfaitement.
                  </p>
                )}
                {passwordMismatch && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1">
                    Les mots de passe ne correspondent pas encore.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword || passwordMismatch || !newPassword}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0f3d38] to-[#1a5b54] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mise à jour en cours...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-[#8eead1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Mettre à jour le Mot de Passe</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Sécurité session</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Chiffrement Django sécurisé
            </span>
          </div>
        </motion.div>

      </div>

      {/* 3. Carte d'information & Bonnes Pratiques */}
      <div className="bg-[#f0fbf8] border border-[#d4e8e3] rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0f3d38] text-white flex items-center justify-center shrink-0 shadow-md">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0f3d38] uppercase tracking-wider">
              Conseils de protection AURA COLLECTION
            </h3>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              Conservez précieusement vos nouveaux identifiants. Si vous changez votre nom d'utilisateur ou mot de passe, pensez à le noter ou à l'enregistrer dans votre gestionnaire de mots de passe.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
