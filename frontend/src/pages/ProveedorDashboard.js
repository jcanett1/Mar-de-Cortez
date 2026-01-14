import { Routes, Route, Navigate } from 'react-router-dom';
import { Home, Package, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/Sidebar';
import ProveedorHome from '@/pages/proveedor/ProveedorHome';
import Ordenes from '@/pages/proveedor/Ordenes';
import Productos from '@/pages/proveedor/Productos';

const menuItems = [
  { path: '/proveedor', label: 'Inicio', icon: Home },
  { path: '/proveedor/ordenes', label: 'Órdenes', icon: FileText },
  { path: '/proveedor/productos', label: 'Productos', icon: Package }
];

export default function ProveedorDashboard() {
  return (
    <DashboardLayout items={menuItems}>
      <Routes>
        <Route path="/" element={<ProveedorHome />} />
        <Route path="/ordenes" element={<Ordenes />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="*" element={<Navigate to="/proveedor" />} />
      </Routes>
    </DashboardLayout>
  );
}