import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/layout/SiteLayout'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { HomePage } from './pages/HomePage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/imovel/:id" element={<PropertyDetailPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
