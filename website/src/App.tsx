import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/layout/SiteLayout'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { HomePage } from './pages/HomePage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route element={<SiteLayout />}>
          <Route path="/imovel/:id" element={<PropertyDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
