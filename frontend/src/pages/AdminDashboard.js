import { Routes, Route, Navigate } from 'react-router-dom';
import { Home, Users, Package, FileText, Layers, UserPlus } from 'lucide-react';
import { DashboardLayout } from '@/components/Sidebar';
import AdminHome from '@/pages/admin/AdminHome';
import RegistrationRequests from '@/pages/admin/RegistrationRequests';
import ManageUsers from '@/pages/admin/ManageUsers';
import ManageProducts from '@/pages/admin/ManageProducts';
import ManageOrders from '@/pages/admin/ManageOrders';
import ManageCategories from '@/pages/admin/ManageCategories';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: Home },
  { path: '/admin/requests', label: 'Solicitudes', icon: UserPlus },
  { path: '/admin/users', label: 'Usuarios', icon: Users },
  { path: '/admin/products', label: 'Productos', icon: Package },
  { path: '/admin/orders', label: 'Órdenes', icon: FileText },
  { path: '/admin/categories', label: 'Categorías', icon: Layers }
];

export default function AdminDashboard() {
  return (
    <DashboardLayout items={menuItems}>
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/requests" element={<RegistrationRequests />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/products" element={<ManageProducts />} />
        <Route path="/orders" element={<ManageOrders />} />
        <Route path="/categories" element={<ManageCategories />} />
        <Route path="*" element={<Navigate to="/admin" />} />
      </Routes>
    </DashboardLayout>
  );
}