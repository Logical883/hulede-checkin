import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import CheckIn   from './pages/CheckIn'
import Staff     from './pages/Staff'
import Admin     from './pages/Admin'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<CheckIn />} />
        <Route path="/staff"   element={<Staff />} />
        <Route path="/admin"   element={<Admin />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
