import { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { adminAPI } from '../../api/client'

export default function AdminLayout() {
  const [stats, setStats] = useState(null)
  const [adminUsername, setAdminUsername] = useState(() => {
    return localStorage.getItem('admin_username') || 'admin'
  })
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  })
  const navigate = useNavigate()
  const location = useLocation()

  const updateAdminUsername = (newUsername) => {
    if (newUsername) {
      setAdminUsername(newUsername)
      localStorage.setItem('admin_username', newUsername)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/admin/login')
      return
    }
    adminAPI.getStats()
      .then(res => setStats(res.data))
      .catch(() => navigate('/admin/login'))

    adminAPI.getProfile()
      .then(res => {
        if (res.data?.username) {
          updateAdminUsername(res.data.username)
        }
      })
      .catch(() => {})
  }, [navigate])

  // Automatically close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/admin/login')
  }

  const navItems = [
    {
      to: '/admin',
      label: 'Tableau de bord',
      exact: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      to: '/admin/produits',
      label: 'Gels & Packs',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      to: '/admin/collections',
      label: 'Collections',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2" />
        </svg>
      ),
    },
    {
      to: '/admin/stock',
      label: 'Gestion des Stocks',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      to: '/admin/commandes',
      label: 'Commandes Clients',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      to: '/admin/profil',
      label: 'Profil & Sécurité',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ]

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.to
    return location.pathname.startsWith(item.to)
  }

  return (
    <div className="min-h-screen bg-[#f4faf8] flex">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Responsive (Off-canvas on mobile/tablet, Fixed on desktop) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-[#d4e8e3] flex flex-col transition-all duration-300 shadow-2xl lg:shadow-xs ${
          sidebarOpen
            ? 'w-64 translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Logo Header */}
        <div className="h-16 sm:h-20 flex items-center justify-between border-b border-gray-100 px-4">
          <Link
            to="/admin"
            className="flex items-center gap-3 overflow-hidden"
            onClick={() => {
              if (window.innerWidth < 1024) setSidebarOpen(false)
            }}
          >
            <img
              src="/logo-aura.jpeg"
              alt="AURA COLLECTION"
              className="w-10 h-10 rounded-full object-contain p-0.5 bg-white border border-[#d4e8e3] shadow-2xs flex-shrink-0"
            />
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black tracking-widest text-[#0f3d38] uppercase font-serif truncate">
                  AURA COLLECTION
                </span>
                <span className="text-[10px] font-semibold text-[#2fb49c] uppercase tracking-wider">
                  Administration
                </span>
              </div>
            )}
          </Link>

          {/* Close button on mobile inside sidebar */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 lg:hidden cursor-pointer"
            aria-label="Fermer le menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false)
                }}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                  active
                    ? 'bg-[#0f3d38] text-white shadow-sm font-semibold'
                    : 'text-gray-600 hover:bg-[#f0fbf8] hover:text-[#0f3d38]'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                {sidebarOpen && <span className="text-xs tracking-wider uppercase">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-600 hover:bg-[#f0fbf8] hover:text-[#0f3d38] transition-all text-xs font-semibold uppercase tracking-wider"
            title="Voir la boutique"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {sidebarOpen && <span>Boutique en direct</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all w-full text-xs font-semibold uppercase tracking-wider cursor-pointer"
            title="Déconnexion"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area (Full width on mobile/tablet with ml-0, responsive margin on desktop) */}
      <main
        className={`flex-1 transition-all duration-300 min-h-screen flex flex-col w-full min-w-0 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        } ml-0`}
      >
        {/* Top Header Bar */}
        <div className="h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b border-[#d4e8e3] flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-[#0f3d38] hover:bg-[#f0fbf8] transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest text-[#0f3d38] truncate">
              Administration AURA
            </span>
          </div>

          {/* Right Header Area : Stats & User Profile Link */}
          <div className="flex items-center gap-2 sm:gap-3">
            {stats && (
              <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs">
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0fbf8] text-[#0f3d38] font-semibold border border-[#d4e8e3]">
                  <span className="text-gray-500">Produits:</span>
                  <span className="font-bold">{stats.total_parfums}</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px] sm:text-xs">
                  <span className="hidden xs:inline">En attente:</span>
                  <span className="xs:hidden">Att:</span>
                  <span className="font-bold">{stats.commandes_en_attente}</span>
                </div>
                {stats.rupture_stock > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-red-50 text-red-800 border border-red-200 font-semibold text-[11px] sm:text-xs">
                    <span className="hidden xs:inline">Rupture:</span>
                    <span className="xs:hidden">Rup:</span>
                    <span className="font-bold">{stats.rupture_stock}</span>
                  </div>
                )}
              </div>
            )}

            <Link
              to="/admin/profil"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#f0fbf8] hover:bg-[#d4e8e3] border border-[#d4e8e3] text-[#0f3d38] transition-all text-xs font-semibold"
              title={`Compte administrateur : ${adminUsername}`}
            >
              <div className="w-5 h-5 rounded-full bg-[#0f3d38] text-white flex items-center justify-center text-[10px] font-bold uppercase">
                {adminUsername ? adminUsername.charAt(0) : 'A'}
              </div>
              <span className="hidden sm:inline font-mono font-bold tracking-wide">{adminUsername}</span>
            </Link>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-3 sm:p-6 lg:p-8 flex-1 w-full min-w-0">
          <Outlet context={{ stats, refreshStats: () => adminAPI.getStats().then(res => setStats(res.data)), adminUsername, updateAdminUsername }} />
        </div>
      </main>
    </div>
  )
}
