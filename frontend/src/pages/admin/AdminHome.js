import { useState, useEffect } from 'react';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, FileText, UserPlus, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-8" data-testid="admin-home">
      <div>
        <h1 className="text-4xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-muted-foreground text-lg">Gestiona todo el sistema Mar de Cortez</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Card className="card-hover" data-testid="stat-pending-requests">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pending_requests || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="card-hover" data-testid="stat-total-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total_clients || 0} clientes, {stats?.total_suppliers || 0} proveedores
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-total-products">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_products || 0}</div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-total-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_orders || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Card */}
      <Card data-testid="revenue-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Ingresos Totales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-secondary">${(stats?.total_revenue || 0).toFixed(2)}</div>
          <p className="text-sm text-muted-foreground mt-2">De órdenes completadas</p>
        </CardContent>
      </Card>
    </div>
  );
}