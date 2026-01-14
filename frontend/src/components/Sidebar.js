import { Link, useLocation } from 'react-router-dom';
import { Ship, Home, Package, FileText, LogOut, Bell } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';

export function Sidebar({ items }) {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-primary text-primary-foreground hidden md:flex flex-col" data-testid="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3">
          <Ship className="w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold">Mar de Cortez</h1>
            <p className="text-xs text-white/60">{user?.role === 'cliente' ? 'Portal Cliente' : 'Portal Proveedor'}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              data-testid={`sidebar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/10">
        <div className="mb-3">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="text-xs text-white/60">{user?.email}</p>
          {user?.company && <p className="text-xs text-white/60">{user.company}</p>}
        </div>
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}

export function DashboardLayout({ children, items }) {
  return (
    <div className="min-h-screen">
      <Sidebar items={items} />
      <div className="md:ml-64 min-h-screen bg-background">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}