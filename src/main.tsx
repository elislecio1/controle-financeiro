import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import AuthCallback from './pages/AuthCallback'
import UserManagement from './pages/UserManagement'
import AdminUserManagement from './pages/AdminUserManagement'
import Pricing from './pages/Pricing'
import { EmpresasPage } from './pages/EmpresasPage'
import { EmpresaProvider } from './contexts/EmpresaContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <EmpresaProvider>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/user-management" element={<AdminUserManagement />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/empresas" element={<EmpresasPage />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </EmpresaProvider>
    </BrowserRouter>
  </React.StrictMode>,
) 