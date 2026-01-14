import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext, API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, FileText, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function ProveedorHome() {
  const [stats, setStats] = useState({ orders: 0, products: 0, pending: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`${API}/orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/products?supplier_id=${user.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const orders = await ordersRes.json();
      const products = await productsRes.json();
      
      const revenue = orders
        .filter(o => o.status === 'completado')
        .reduce((sum, o) => sum + o.total, 0);
      
      setStats({
        orders: orders.length,
        products: products.length,
        pending: orders.filter(o => o.status === 'pendiente' || o.status === 'recibido').length,
        revenue
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
    <div className="space-y-8" data-testid="proveedor-home">
      <div>
        <h1 className="text-4xl font-bold mb-2">Bienvenido, {user?.name}</h1>
        <p className="text-muted-foreground text-lg">Gestiona tus órdenes y productos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="card-hover" data-testid="stat-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Totales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.orders}</div>
          </CardContent>
        </Card>
        <Card className="card-hover" data-testid="stat-pending">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="card-hover" data-testid="stat-products">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.products}</div>
          </CardContent>
        </Card>
        <Card className="card-hover" data-testid="stat-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card data-testid="quick-actions">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Gestiona tu catálogo y órdenes</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link to="/proveedor/ordenes">
            <Button size="lg" data-testid="view-orders-btn">
              <FileText className="mr-2 h-5 w-5" />
              Ver Órdenes
            </Button>
          </Link>
          <Link to="/proveedor/productos">
            <Button size="lg" variant="outline" data-testid="manage-products-btn">
              <Package className="mr-2 h-5 w-5" />
              Gestionar Productos
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card data-testid="recent-orders">
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
          <CardDescription>Tus últimas 5 órdenes recibidas</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay órdenes aún</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`order-${order.order_number}`}>
                  <div>
                    <p className="font-medium font-mono">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">{order.client_name}</p>
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