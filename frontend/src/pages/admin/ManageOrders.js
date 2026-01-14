import { useState, useEffect } from 'react';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      toast.error('Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const map = { pendiente: 'Pendiente', recibido: 'Recibido', en_proceso: 'En Proceso', completado: 'Completado', cancelado: 'Cancelado' };
    return map[status] || status;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="manage-orders-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Todas las Órdenes</h1>
        <p className="text-muted-foreground text-lg">Vista general del sistema</p>
      </div>

      <Card data-testid="orders-list">
        <CardHeader>
          <CardTitle>Órdenes ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="card-hover" data-testid={`order-${order.order_number}`}>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Orden</p>
                      <p className="font-mono font-semibold">{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cliente</p>
                      <p className="font-medium">{order.client_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Proveedor</p>
                      <p className="font-medium">{order.supplier_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Badge className={`status-badge status-${order.status}`}>{getStatusText(order.status)}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}