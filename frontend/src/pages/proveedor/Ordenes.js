import { useState, useEffect } from 'react';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileUp, User } from 'lucide-react';

export default function Ordenes() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', assigned_to: '' });
  const [quotationFile, setQuotationFile] = useState(null);
  const [quotationAmount, setQuotationAmount] = useState('');
  const [quotationNotes, setQuotationNotes] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/orders`, {
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

  const handleStatusUpdate = async (orderId) => {
    if (!statusUpdate.status) {
      toast.error('Selecciona un estado');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusUpdate)
      });

      if (!response.ok) throw new Error('Error al actualizar estado');

      toast.success('Estado actualizado exitosamente');
      fetchOrders();
      setSelectedOrder(null);
      setStatusUpdate({ status: '', assigned_to: '' });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleQuotationUpload = async (orderId) => {
    if (!quotationFile) {
      toast.error('Selecciona un archivo PDF');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', quotationFile);
      if (quotationAmount) formData.append('amount', quotationAmount);
      if (quotationNotes) formData.append('notes', quotationNotes);

      const response = await fetch(`${API}/orders/${orderId}/quotation`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Error al subir cotización');

      toast.success('Cotización subida exitosamente');
      setQuotationFile(null);
      setQuotationAmount('');
      setQuotationNotes('');
    } catch (error) {
      toast.error(error.message);
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
    <div className="space-y-6" data-testid="ordenes-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Gestionar Órdenes</h1>
        <p className="text-muted-foreground text-lg">Visualiza y actualiza el estado de las órdenes</p>
      </div>

      <Card data-testid="orders-list">
        <CardHeader>
          <CardTitle>Órdenes Recibidas ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay órdenes aún</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="card-hover" data-testid={`order-card-${order.order_number}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-mono font-bold text-lg" data-testid={`order-number-${order.id}`}>{order.order_number}</p>
                        <p className="text-muted-foreground">Cliente: {order.client_name}</p>
                      </div>
                      <Badge className={`status-badge status-${order.status}`} data-testid={`status-${order.id}`}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Productos</p>
                        <p className="font-medium">{order.products.length} items</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha</p>
                        <p className="font-medium">{new Date(order.created_at).toLocaleDateString('es-MX')}</p>
                      </div>
                    </div>

                    {order.assigned_to && (
                      <div className="flex items-center gap-2 mb-4 text-sm" data-testid={`assigned-${order.id}`}>
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Responsable:</span>
                        <span className="font-medium">{order.assigned_to}</span>
                      </div>
                    )}

                    {/* Products */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Productos:</p>
                      <div className="space-y-1">
                        {order.products.map((product, idx) => (
                          <div key={idx} className="text-sm flex justify-between bg-muted p-2 rounded">
                            <span>
                              {product.product_name} x{product.quantity}
                              {product.is_custom && <Badge variant="outline" className="ml-2 text-xs">Personalizado</Badge>}
                            </span>
                            <span className="font-medium">
                              {product.price ? `$${(product.price * product.quantity).toFixed(2)}` : 'Por cotizar'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm"><strong>Notas del cliente:</strong> {order.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button onClick={() => setSelectedOrder(order)} data-testid={`update-status-btn-${order.id}`}>
                            Actualizar Estado
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid="status-update-dialog">
                          <DialogHeader>
                            <DialogTitle>Actualizar Estado de Orden</DialogTitle>
                            <DialogDescription>
                              Orden: {order.order_number}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Nuevo Estado</Label>
                              <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate({ ...statusUpdate, status: value })}>
                                <SelectTrigger data-testid="status-select">
                                  <SelectValue placeholder="Selecciona estado" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="recibido">Recibido</SelectItem>
                                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                                  <SelectItem value="completado">Completado</SelectItem>
                                  <SelectItem value="cancelado">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Asignar a (Opcional)</Label>
                              <Input
                                placeholder="Nombre del responsable"
                                value={statusUpdate.assigned_to}
                                onChange={(e) => setStatusUpdate({ ...statusUpdate, assigned_to: e.target.value })}
                                data-testid="assigned-to-input"
                              />
                            </div>
                            <Button onClick={() => handleStatusUpdate(order.id)} className="w-full" data-testid="confirm-status-update">
                              Actualizar
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" data-testid={`upload-quotation-btn-${order.id}`}>
                            <FileUp className="mr-2 h-4 w-4" />
                            Subir Cotización
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid="quotation-upload-dialog">
                          <DialogHeader>
                            <DialogTitle>Subir Cotización</DialogTitle>
                            <DialogDescription>
                              Orden: {order.order_number}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Archivo PDF</Label>
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setQuotationFile(e.target.files[0])}
                                data-testid="quotation-file-input"
                              />
                            </div>
                            <div>
                              <Label>Monto (Opcional)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={quotationAmount}
                                onChange={(e) => setQuotationAmount(e.target.value)}
                                data-testid="quotation-amount-input"
                              />
                            </div>
                            <div>
                              <Label>Notas (Opcional)</Label>
                              <Textarea
                                placeholder="Detalles adicionales..."
                                value={quotationNotes}
                                onChange={(e) => setQuotationNotes(e.target.value)}
                                data-testid="quotation-notes-input"
                              />
                            </div>
                            <Button onClick={() => handleQuotationUpload(order.id)} className="w-full" data-testid="confirm-quotation-upload">
                              Subir Cotización
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
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