import { Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import HomePage from './pages/HomePage'
import CataloguePage from './pages/CataloguePage'
import ContactPage from './pages/ContactPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminStock from './pages/admin/AdminStock'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCollections from './pages/admin/AdminCollections'

function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* 3 Main Pages matching Twins Fragrance */}
      <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/catalogue" element={<PublicLayout><CataloguePage /></PublicLayout>} />
      <Route path="/collections/all" element={<PublicLayout><CataloguePage /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
      <Route path="/pages/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

      {/* Product Detail & Cart / Checkout */}
      <Route path="/parfum/:id" element={<PublicLayout><ProductDetailPage /></PublicLayout>} />
      <Route path="/produit/:id" element={<PublicLayout><ProductDetailPage /></PublicLayout>} />
      <Route path="/products/:id" element={<PublicLayout><ProductDetailPage /></PublicLayout>} />
      <Route path="/cart" element={<PublicLayout><CartPage /></PublicLayout>} />
      <Route path="/panier" element={<PublicLayout><CartPage /></PublicLayout>} />
      <Route path="/checkout" element={<PublicLayout><CheckoutPage /></PublicLayout>} />
      <Route path="/commander" element={<PublicLayout><CheckoutPage /></PublicLayout>} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="produits" element={<AdminProducts />} />
        <Route path="collections" element={<AdminCollections />} />
        <Route path="stock" element={<AdminStock />} />
        <Route path="commandes" element={<AdminOrders />} />
      </Route>
    </Routes>
    </>
  )
}
