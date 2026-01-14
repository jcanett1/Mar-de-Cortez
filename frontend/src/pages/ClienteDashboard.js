import { Routes, Route, Navigate } from 'react-router-dom';
import { Home, ShoppingCart, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/Sidebar';
import ClienteHome from '@/pages/cliente/ClienteHome';
import CrearOrden from '@/pages/cliente/CrearOrden';
import Seguimiento from '@/pages/cliente/Seguimiento';

const menuItems = [
  { path: '/cliente', label: 'Inicio', icon: Home },
  { path: '/cliente/crear-orden', label: 'Crear Orden', icon: ShoppingCart },
  { path: '/cliente/seguimiento', label: 'Seguimiento', icon: FileText }
];

export default function ClienteDashboard() {
  return (
    <DashboardLayout items={menuItems}>
      <Routes>
        <Route path="/" element={<ClienteHome />} />
        <Route path="/crear-orden" element={<CrearOrden />} />
        <Route path="/seguimiento" element={<Seguimiento />} />
        <Route path="*" element={<Navigate to="/cliente" />} />
      </Routes>
    </DashboardLayout>
  );
}