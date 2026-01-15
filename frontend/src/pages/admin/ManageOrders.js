import { useState, useEffect } from 'react';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    assigned_to: '',
    cancellation_reason: ''
  });

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

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setStatusUpdate({
      status: order.status,
      assigned_to: order.assigned_to || '',
      cancellation_reason: order.cancellation_reason || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    if (statusUpdate.status === 'cancelado' && !statusUpdate.cancellation_reason) {
      toast.error('Debes proporcionar un motivo de cancelación');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = `${API}/admin/orders/${selectedOrder.id}/status${statusUpdate.status === 'cancelado' ? `?cancellation_reason=${encodeURIComponent(statusUpdate.cancellation_reason)}` : ''}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: statusUpdate.status,
          assigned_to: statusUpdate.assigned_to
        })
      });

      if (!response.ok) throw new Error('Error al actualizar orden');

      toast.success('Orden actualizada exitosamente');
      setEditDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteOrder = (order) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrder) return;

    if (selectedOrder.status !== 'cancelado') {
      toast.error('Solo se pueden eliminar órdenes canceladas');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/orders/${selectedOrder.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al eliminar orden');
      }

      toast.success('Orden eliminada exitosamente');
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStatusText = (status) => {
    const map = { 
      pendiente: 'Pendiente', 
      recibido: 'Recibido', 
      en_proceso: 'En Proceso', 
      completado: 'Completado', 
      cancelado: 'Cancelado' 
    };
    return map[status] || status;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="manage-orders-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Todas las Órdenes</h1>
        <p className="text-muted-foreground text-lg">Gestiona todas las órdenes del sistema</p>
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
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-mono font-bold text-lg">{order.order_number}</p>
                      <Badge className={`status-badge status-${order.status} mt-2`}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEditOrder(order)}
                        data-testid={`edit-order-${order.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeleteOrder(order)}
                        disabled={order.status !== 'cancelado'}
                        data-testid={`delete-order-${order.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Cliente</p>
                      <p className="font-medium">{order.client_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Proveedor</p>
                      <p className="font-medium">{order.supplier_name || 'Múltiples/Pendiente'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  {order.assigned_to && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground">Responsable</p>
                      <p className="text-sm font-medium">{order.assigned_to}</p>
                    </div>
                  )}

                  {order.cancellation_reason && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-red-800">Motivo de Cancelación:</p>
                          <p className="text-sm text-red-700">{order.cancellation_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Creado: {new Date(order.created_at).toLocaleString('es-MX')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="edit-order-dialog">
          <DialogHeader>
            <DialogTitle>Editar Orden</DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Estado</Label>
              <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate({ ...statusUpdate, status: value })}>
                <SelectTrigger data-testid="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="recibido">Recibido</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {statusUpdate.status === 'cancelado' && (
              <div>
                <Label>Motivo de Cancelación *</Label>
                <Textarea
                  placeholder="Describe el motivo de la cancelación..."
                  value={statusUpdate.cancellation_reason}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, cancellation_reason: e.target.value })}
                  rows={3}
                  data-testid="cancellation-reason"
                />
              </div>
            )}

            <div>
              <Label>Asignar a (Opcional)</Label>
              <Input
                placeholder="Nombre del responsable"
                value={statusUpdate.assigned_to}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, assigned_to: e.target.value })}
                data-testid="assigned-to"
              />
            </div>

            <Button onClick={handleUpdateStatus} className="w-full" data-testid="confirm-update">
              Actualizar Orden
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la orden <strong>{selectedOrder?.order_number}</strong>?
              {selectedOrder?.status !== 'cancelado' && (
                <p className="text-red-600 mt-2">
                  Solo se pueden eliminar órdenes canceladas. Esta orden está en estado: {getStatusText(selectedOrder?.status)}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={selectedOrder?.status !== 'cancelado'}
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
