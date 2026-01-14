import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext, API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, FileText, Package, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function ClienteHome() {
  const [stats, setStats] = useState({ total: 0, pendiente: 0, completado: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const orders = await response.json();
      
      setStats({
        total: orders.length,
        pendiente: orders.filter(o => o.status === 'pendiente').length,
        completado: orders.filter(o => o.status === 'completado').length
      });
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pendiente: 'Pendiente',
      recibido: 'Recibido',
      en_proceso: 'En Proceso',
      completado: 'Completado',
      cancelado: 'Cancelado'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-8" data-testid="cliente-home">
      <div>
        <h1 className="text-4xl font-bold mb-2">Bienvenido, {user?.name}</h1>
        <p className="text-muted-foreground text-lg">Administra tus órdenes de compra</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="card-hover" data-testid="stat-total-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Órdenes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="card-hover" data-testid="stat-pending-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendiente}</div>
          </CardContent>
        </Card>
        <Card className="card-hover" data-testid="stat-completed-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Completadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completado}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card data-testid="quick-actions">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Gestiona tus compras de manera eficiente</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link to="/cliente/crear-orden">
            <Button size="lg" data-testid="create-order-btn">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Crear Nueva Orden
            </Button>
          </Link>
          <Link to="/cliente/seguimiento">
            <Button size="lg" variant="outline" data-testid="view-tracking-btn">
              <FileText className="mr-2 h-5 w-5" />
              Ver Seguimiento
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card data-testid="recent-orders">
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
          <CardDescription>Tus últimas 5 órdenes</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No tienes órdenes aún. Crea tu primera orden!</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`order-${order.order_number}`}>
                  <div>
                    <p className="font-medium font-mono">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">{order.supplier_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('es-MX')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.total.toFixed(2)}</p>
                    <span className={`status-badge status-${order.status}`}>{getStatusText(order.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}