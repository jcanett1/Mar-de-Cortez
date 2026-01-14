import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ClienteDashboard from '@/pages/ClienteDashboard';
import ProveedorDashboard from '@/pages/ProveedorDashboard';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const AuthContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.id) setUser(data);
          else localStorage.removeItem('token');
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={user ? <Navigate to={user.role === 'cliente' ? '/cliente' : '/proveedor'} /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to={user.role === 'cliente' ? '/cliente' : '/proveedor'} /> : <Register />} />
          <Route path="/cliente/*" element={user?.role === 'cliente' ? <ClienteDashboard /> : <Navigate to="/login" />} />
          <Route path="/proveedor/*" element={user?.role === 'proveedor' ? <ProveedorDashboard /> : <Navigate to="/login" />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;