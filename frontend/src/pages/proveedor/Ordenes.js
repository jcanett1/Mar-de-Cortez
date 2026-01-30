import { useState, useEffect, useContext } from 'react';
import { API, AuthContext } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileUp, User, HandMetal, DollarSign, AlertCircle } from 'lucide-react';

export default function Ordenes() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', assigned_to: '' });
  const [quotationFile, setQuotationFile] = useState(null);
  const [quotationAmount, setQuotationAmount] = useState('');
  const [quotationNotes, setQuotationNotes] = useState('');
  const [isTakeDialogOpen, setIsTakeDialogOpen] = useState(false);
  const [takeOrderData, setTakeOrderData] = useState({
    status: 'recibido',
    assigned_to: '',
    product_prices: {}
  });

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

  // Verificar si la orden ya tiene proveedor asignado (es el proveedor actual)
  const isMyOrder = (order) => {
    return order.supplier_id === user?.id;
  };

  // Verificar si la orden está disponible para tomar
  const canTakeOrder = (order) => {
    return !order.supplier_id || order.supplier_id === user?.id;
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

  // Función para tomar la orden y agregar precios
  const handleTakeOrder = async (orderId) => {
    // Validar que se haya seleccionado un estado
    if (!takeOrderData.status) {
      toast.error('Selecciona un estado');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/orders/${orderId}/take`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(takeOrderData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al tomar la orden');
      }

      toast.success('Orden tomada exitosamente. El cliente verá los precios.');
      fetchOrders();
      setIsTakeDialogOpen(false);
      setSelectedOrder(null);
      setTakeOrderData({ status: 'recibido', assigned_to: '', product_prices: {} });
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

  const openTakeDialog = (order) => {
    setSelectedOrder(order);
    // Inicializar precios de productos
    const initialPrices = {};
    order.products.forEach((product, idx) => {
      initialPrices[idx] = product.price || '';
    });
    setTakeOrderData({
      status: 'recibido',
      assigned_to: '',
      product_prices: initialPrices
    });
    setIsTakeDialogOpen(true);
  };

  const updateProductPrice = (idx, price) => {
    setTakeOrderData(prev => ({
      ...prev,
      product_prices: {
        ...prev.product_prices,
        [idx]: price
      }
    }));
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
                <Card key={order.id} className={`card-hover ${!order.supplier_id ? 'border-amber-300 border-2' : ''}`} data-testid={`order-card-${order.order_number}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-mono font-bold text-lg" data-testid={`order-number-${order.id}`}>{order.order_number}</p>
                        <p className="text-muted-foreground">Cliente: {order.client_name}</p>
                        {order.supplier_id && order.supplier_id === user?.id && (
                          <Badge variant="secondary" className="mt-1">Mi orden</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className={`status-badge status-${order.status}`} data-testid={`status-${order.id}`}>
                          {getStatusText(order.status)}
                        </Badge>
                        {!order.supplier_id && (
                          <div className="mt-2">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Sin asignar
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        {order.price_confirmed || order.total > 0 ? (
                          <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
                        ) : (
                          <p className="text-amber-600 text-sm">Por definir</p>
                        )}
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
                    <div className="flex gap-2 flex-wrap">
                      {/* Botón para tomar orden si no tiene proveedor asignado */}
                      {canTakeOrder(order) && !isMyOrder(order) && (
                        <Button 
                          onClick={() => openTakeDialog(order)} 
                          className="bg-green-600 hover:bg-green-700"
                          data-testid={`take-order-btn-${order.id}`}
                        >
                          <HandMetal className="mr-2 h-4 w-4" />
                          Tomar Orden
                        </Button>
                      )}

                      {/* Si ya es mi orden, mostrar botones normales */}
                      {isMyOrder(order) && (
                        <>
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

                          {/* Botón para actualizar precios */}
                          <Button 
                            variant="outline" 
                            onClick={() => openTakeDialog(order)}
                            data-testid={`update-prices-btn-${order.id}`}
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Actualizar Precios
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Tomar Orden / Actualizar Precios */}
      <Dialog open={isTakeDialogOpen} onOpenChange={setIsTakeDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="take-order-dialog">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder?.supplier_id === user?.id ? 'Actualizar Precios' : 'Tomar Orden y Agregar Precios'}
            </DialogTitle>
            <DialogDescription>
              Orden: {selectedOrder?.order_number} - Cliente: {selectedOrder?.client_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Estado */}
              <div>
                <Label>Estado de la Orden</Label>
                <Select 
                  value={takeOrderData.status} 
                  onValueChange={(value) => setTakeOrderData({ ...takeOrderData, status: value })}
                >
                  <SelectTrigger data-testid="take-order-status-select">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recibido">Recibido</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Responsable */}
              <div>
                <Label>Responsable (Opcional)</Label>
                <Input
                  placeholder="Nombre del responsable"
                  value={takeOrderData.assigned_to}
                  onChange={(e) => setTakeOrderData({ ...takeOrderData, assigned_to: e.target.value })}
                  data-testid="take-order-assigned-to"
                />
              </div>

              {/* Precios de Productos */}
              <div>
                <Label className="text-base font-semibold">Precios de Productos</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Agrega el precio unitario para cada producto. El cliente verá estos precios.
                </p>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedOrder.products.map((product, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {product.quantity}
                          {product.is_custom && <Badge variant="outline" className="ml-2 text-xs">Personalizado</Badge>}
                        </p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                        )}
                      </div>
                      <div className="w-32">
                        <Label className="text-xs">Precio Unitario</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-2 text-muted-foreground">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={takeOrderData.product_prices[idx] || ''}
                            onChange={(e) => updateProductPrice(idx, e.target.value)}
                            className="pl-6"
                            data-testid={`product-price-${idx}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculado */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Estimado:</span>
                  <span className="text-xl font-bold">
                    ${Object.entries(takeOrderData.product_prices).reduce((sum, [idx, price]) => {
                      const qty = selectedOrder.products[parseInt(idx)]?.quantity || 1;
                      return sum + (parseFloat(price) || 0) * qty;
                    }, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button 
                onClick={() => handleTakeOrder(selectedOrder.id)} 
                className="w-full"
                data-testid="confirm-take-order"
              >
                {selectedOrder.supplier_id === user?.id ? 'Guardar Cambios' : 'Tomar Orden y Enviar Cotización'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}