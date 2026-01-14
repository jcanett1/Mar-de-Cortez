import { useState, useEffect } from 'react';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, User, Clock } from 'lucide-react';

export default function Seguimiento() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredOrders(
        orders.filter(order => 
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      toast.error('Error al cargar órdenes');
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

  const getStatusVariant = (status) => {
    const variantMap = {
      pendiente: 'warning',
      recibido: 'info',
      en_proceso: 'default',
      completado: 'success',
      cancelado: 'destructive'
    };
    return variantMap[status] || 'default';
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="seguimiento-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Seguimiento de Órdenes</h1>
        <p className="text-muted-foreground text-lg">Monitorea el estado de tus compras</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de orden o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-orders-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card data-testid="orders-table">
        <CardHeader>
          <CardTitle>Tus Órdenes ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? 'No se encontraron órdenes' : 'No tienes órdenes aún'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="card-hover" data-testid={`order-card-${order.order_number}`}>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Número de Orden</p>
                        <p className="font-mono font-semibold" data-testid={`order-number-${order.id}`}>{order.order_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Proveedor</p>
                        <p className="font-medium">{order.supplier_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total</p>
                        <p className="font-semibold text-lg">${order.total.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Estado</p>
                        <Badge className={`status-badge status-${order.status}`} data-testid={`status-${order.id}`}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Creado:</span>
                        <span>{new Date(order.created_at).toLocaleString('es-MX')}</span>
                      </div>
                      {order.assigned_to && (
                        <div className="flex items-center gap-2 text-sm" data-testid={`assigned-${order.id}`}>
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Responsable:</span>
                          <span className="font-medium">{order.assigned_to}</span>
                        </div>
                      )}
                    </div>
                    
                    {order.notes && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Notas: {order.notes}</p>
                      </div>
                    )}

                    {/* Products List */}
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Productos ({order.products.length})</p>
                      <div className="space-y-1">
                        {order.products.map((product, idx) => (
                          <div key={idx} className="text-sm flex justify-between" data-testid={`product-${idx}`}>
                            <span>{product.product_name} x{product.quantity}</span>
                            <span className="font-medium">${(product.price * product.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}