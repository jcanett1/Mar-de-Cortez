import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, ShoppingCart, Package, Search } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'electronica', label: 'Electrónica' },
  { value: 'ferreteria', label: 'Ferretería' },
  { value: 'otros', label: 'Otros' }
];

export default function CrearOrden() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customProduct, setCustomProduct] = useState({
    name: '',
    description: '',
    quantity: 1,
    image: null,
    imagePreview: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchTerm]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    }
  };

  const filterProducts = () => {
    let filtered = products;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  };

  const addProductToOrder = (product) => {
    const existing = orderItems.find(item => item.product_id === product.id);
    if (existing) {
      setOrderItems(orderItems.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success('Cantidad actualizada');
    } else {
      setOrderItems([...orderItems, {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        is_custom: false
      }]);
      toast.success(`${product.name} agregado`);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomProduct({
          ...customProduct,
          image: file,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addCustomProduct = () => {
    if (!customProduct.name || !customProduct.quantity) {
      toast.error('Completa nombre y cantidad');
      return;
    }

    const newItem = {
      product_id: null,
      product_name: customProduct.name,
      description: customProduct.description,
      image_url: customProduct.imagePreview,
      quantity: parseInt(customProduct.quantity),
      price: null,
      is_custom: true
    };

    setOrderItems([...orderItems, newItem]);
    toast.success('Producto personalizado agregado');
    setIsCustomDialogOpen(false);
    setCustomProduct({
      name: '',
      description: '',
      quantity: 1,
      image: null,
      imagePreview: null
    });
  };

  const updateQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeProduct(index);
      return;
    }
    setOrderItems(orderItems.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  const removeProduct = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      if (item.is_custom) return sum;
      return sum + (item.price * item.quantity);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        <p className="text-muted-foreground text-lg">Selecciona productos o solicita productos personalizados</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-products"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="category-filter">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="whitespace-nowrap" data-testid="add-custom-product-btn">
                      <Plus className="mr-2 h-4 w-4" />
                      Producto Nuevo
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="custom-product-dialog">
                    <DialogHeader>
                      <DialogTitle>Solicitar Producto Personalizado</DialogTitle>
                      <DialogDescription>
                        Agrega un producto que no está en la lista
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nombre del Producto</Label>
                        <Input
                          placeholder="Ej: Aceite especial"
                          value={customProduct.name}
                          onChange={(e) => setCustomProduct({ ...customProduct, name: e.target.value })}
                          data-testid="custom-product-name"
                        />
                      </div>
                      <div>
                        <Label>Descripción</Label>
                        <Textarea
                          placeholder="Especificaciones del producto..."
                          value={customProduct.description}
                          onChange={(e) => setCustomProduct({ ...customProduct, description: e.target.value })}
                          rows={3}
                          data-testid="custom-product-description"
                        />
                      </div>
                      <div>
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          value={customProduct.quantity}
                          onChange={(e) => setCustomProduct({ ...customProduct, quantity: e.target.value })}
                          data-testid="custom-product-quantity"
                        />
                      </div>
                      <div>
                        <Label>Imagen (Opcional)</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          data-testid="custom-product-image"
                        />
                        {customProduct.imagePreview && (
                          <img src={customProduct.imagePreview} alt="Preview" className="mt-2 w-full h-32 object-cover rounded" />
                        )}
                      </div>
                      <Button onClick={addCustomProduct} className="w-full" data-testid="save-custom-product">
                        Agregar a la Orden
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <Card data-testid="products-list">
              <CardHeader>
                <CardTitle>Productos Disponibles ({filteredProducts.length})</CardTitle>
                <CardDescription>Haz clic para agregar a tu orden</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-lg p-4 hover:border-secondary transition-colors cursor-pointer"
                      onClick={() => addProductToOrder(product)}
                      data-testid={`product-${product.sku}`}
                    >
                      {product.image_url && (
                        <img src={product.image_url} alt={product.name} className="w-full h-32 object-cover rounded mb-3" />
                      )}
                      <h4 className="font-semibold mb-1">{product.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-muted-foreground">{product.sku}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Proveedor: {product.supplier_name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No se encontraron productos</p>
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
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">Solicitado por:</p>
                <p className="font-medium" data-testid="requested-by">{user?.name}</p>
                {user?.company && <p className="text-sm text-muted-foreground">{user.company}</p>}
              </div>

              <div className="border-t pt-4">
                {orderItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No hay productos aún</p>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 border rounded" data-testid={`cart-item-${index}`}>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.product_name}</p>
                          {item.is_custom && (
                            <div>
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Personalizado</span>
                              {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                            </div>
                          )}
                          {!item.is_custom && (
                            <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} c/u</p>
                          )}
                        </div>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                          className="w-16"
                          data-testid={`quantity-${index}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeProduct(index)}
                          data-testid={`remove-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>Total:</span>
                  <span data-testid="order-total">${calculateTotal().toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  * Los productos personalizados serán cotizados por el proveedor
                </p>
                
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
