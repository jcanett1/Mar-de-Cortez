import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';

const CATEGORIES = [
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'electronica', label: 'Electrónica' },
  { value: 'ferreteria', label: 'Ferretería' },
  { value: 'otros', label: 'Otros' }
];

export default function CrearOrden() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (selectedSupplier && selectedCategory) {
      fetchProducts();
    }
  }, [selectedSupplier, selectedCategory]);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // For demo, we'll need to get all users with role proveedor
      // In production, you'd have a dedicated endpoint
      setSuppliers([]);
    } catch (error) {
      toast.error('Error al cargar proveedores');
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API}/products?supplier_id=${selectedSupplier}&category=${selectedCategory}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    }
  };

  const addProduct = (product) => {
    const existing = orderItems.find(item => item.product_id === product.id);
    if (existing) {
      setOrderItems(orderItems.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
    toast.success(`${product.name} agregado`);
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }
    setOrderItems(orderItems.map(item => 
      item.product_id === productId ? { ...item, quantity } : item
    ));
  };

  const removeProduct = (productId) => {
    setOrderItems(orderItems.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          supplier_id: selectedSupplier,
          products: orderItems,
          notes
        })
      });

      if (!response.ok) throw new Error('Error al crear orden');

      const data = await response.json();
      toast.success(`¡Orden ${data.order_number} creada exitosamente!`);
      navigate('/cliente/seguimiento');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="crear-orden-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Crear Orden de Compra</h1>
        <p className="text-muted-foreground text-lg">Selecciona productos y crea una nueva orden</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card data-testid="supplier-selection">
            <CardHeader>
              <CardTitle>Selección de Proveedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Proveedor</Label>
                <Input
                  placeholder="ID del Proveedor (temporal)"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  data-testid="supplier-input"
                />
                <p className="text-xs text-muted-foreground mt-1">Para demo: ingresa el ID de un usuario proveedor</p>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="category-select">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {products.length > 0 && (
            <Card data-testid="products-list">
              <CardHeader>
                <CardTitle>Productos Disponibles</CardTitle>
                <CardDescription>Haz clic para agregar a tu orden</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-lg p-4 hover:border-secondary transition-colors cursor-pointer"
                      onClick={() => addProduct(product)}
                      data-testid={`product-${product.sku}`}
                    >
                      <h4 className="font-semibold mb-1">{product.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-secondary">${product.price.toFixed(2)}</span>
                        <span className="text-xs font-mono text-muted-foreground">{product.sku}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-6" data-testid="order-summary">
            <CardHeader>
              <CardTitle>Resumen de Orden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay productos aún</p>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.product_id} className="flex items-center gap-2 p-2 border rounded" data-testid={`cart-item-${item.product_id}`}>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} c/u</p>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                        className="w-16"
                        data-testid={`quantity-${item.product_id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeProduct(item.product_id)}
                        data-testid={`remove-${item.product_id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>Total:</span>
                  <span data-testid="order-total">${calculateTotal().toFixed(2)}</span>
                </div>
                
                <div className="space-y-2">
                  <Label>Notas (Opcional)</Label>
                  <Textarea
                    placeholder="Instrucciones especiales..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    data-testid="order-notes"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={loading || orderItems.length === 0}
                data-testid="submit-order-btn"
              >
                {loading ? 'Creando...' : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Crear Orden
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}