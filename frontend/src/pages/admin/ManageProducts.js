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
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    base_price: '',
    profit_type: 'percentage',
    profit_value: '',
    iva_percentage: '16',
    sku: '',
    supplier_id: '',
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const filterProducts = () => {
    let filtered = products;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [productsRes, suppliersRes, categoriesRes] = await Promise.all([
        fetch(`${API}/admin/products`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/admin/users?role=proveedor`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const productsData = await productsRes.json();
      const suppliersData = await suppliersRes.json();
      const categoriesData = await categoriesRes.json();
      
      setProducts(productsData);
      setFilteredProducts(productsData);
      setSuppliers(suppliersData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalPrice = () => {
    const base = parseFloat(formData.base_price) || 0;
    const profitVal = parseFloat(formData.profit_value) || 0;
    const iva = parseFloat(formData.iva_percentage) || 0;
    
    let priceWithProfit = base;
    if (formData.profit_type === 'percentage') {
      priceWithProfit = base + (base * profitVal / 100);
    } else {
      priceWithProfit = base + profitVal;
    }
    
    const finalPrice = priceWithProfit + (priceWithProfit * iva / 100);
    return finalPrice.toFixed(2);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar 5MB');
        return;
      }
      
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      let imageUrl = formData.image_url;
      
      if (imageFile) {
        imageUrl = imagePreview;
      }
      
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        base_price: parseFloat(formData.base_price),
        profit_type: formData.profit_type,
        profit_value: parseFloat(formData.profit_value),
        iva_percentage: parseFloat(formData.iva_percentage),
        sku: formData.sku,
        image_url: imageUrl
      };
      
      if (editingProduct) {
        const response = await fetch(`${API}/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });

        if (!response.ok) throw new Error('Error al actualizar producto');
        toast.success('Producto actualizado exitosamente');
      } else {
        const response = await fetch(`${API}/admin/products?supplier_id=${formData.supplier_id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });

        if (!response.ok) throw new Error('Error al crear producto');
        toast.success('Producto creado exitosamente');
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      base_price: product.base_price?.toString() || product.price.toString(),
      profit_type: product.profit_type || 'percentage',
      profit_value: product.profit_value?.toString() || '0',
      iva_percentage: product.iva_percentage?.toString() || '16',
      sku: product.sku,
      supplier_id: product.supplier_id,
      image_url: product.image_url || ''
    });
    setImagePreview(product.image_url);
    setIsDialogOpen(true);
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al eliminar producto');

      toast.success('Producto eliminado exitosamente');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      base_price: '',
      profit_type: 'percentage',
      profit_value: '',
      iva_percentage: '16',
      sku: '',
      supplier_id: '',
      image_url: ''
    });
  };

  const getCategoryLabel = (value) => {
    return categories.find(c => c.slug === value)?.name || value;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="manage-products-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Todos los Productos</h1>
          <p className="text-muted-foreground text-lg">Administra el catálogo completo</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="lg" data-testid="add-product-btn">
              <Plus className="mr-2 h-5 w-5" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="product-dialog">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Actualiza la información del producto' : 'Agrega un nuevo producto al catálogo'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingProduct && (
                <div>
                  <Label>Proveedor</Label>
                  <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })} required>
                    <SelectTrigger data-testid="product-supplier">
                      <SelectValue placeholder="Selecciona proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label>Nombre del Producto</Label>
                <Input
                  placeholder="Ej: Aceite de motor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="product-name"
                />
              </div>
              
              <div>
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Descripción del producto..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  data-testid="product-description"
                />
              </div>
              
              <div>
                <Label>Categoría</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                  <SelectTrigger data-testid="product-category">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing Section */}
              <div className="border p-4 rounded-lg space-y-4 bg-muted/50">
                <h3 className="font-semibold">Configuración de Precio</h3>
                <div>
                  <Label>Precio Base (Costo)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={formData.base_price} 
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} 
                    required 
                    data-testid="product-base-price"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Ganancia</Label>
                    <Select 
                      value={formData.profit_type} 
                      onValueChange={(value) => setFormData({ ...formData, profit_type: value })}
                    >
                      <SelectTrigger data-testid="product-profit-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentaje %</SelectItem>
                        <SelectItem value="fixed">Monto Fijo $</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ganancia ({formData.profit_type === 'percentage' ? '%' : '$'})</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={formData.profit_value} 
                      onChange={(e) => setFormData({ ...formData, profit_value: e.target.value })} 
                      required 
                      data-testid="product-profit-value"
                    />
                  </div>
                </div>
                <div>
                  <Label>IVA (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={formData.iva_percentage} 
                    onChange={(e) => setFormData({ ...formData, iva_percentage: e.target.value })} 
                    required 
                    data-testid="product-iva"
                  />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Precio Final:</span>
                    <span className="text-2xl font-bold text-secondary" data-testid="product-final-price">${calculateFinalPrice()}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>SKU</Label>
                <Input
                  placeholder="SKU-001"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                  data-testid="product-sku"
                />
              </div>
              
              <div>
                <Label>Imagen del Producto</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  data-testid="product-image"
                />
                <p className="text-xs text-muted-foreground mt-1">Máximo 5MB. Formatos: JPG, PNG, WebP</p>
                {imagePreview && (
                  <div className="mt-4">
                    <img src={imagePreview} alt="Vista previa" className="w-full h-48 object-cover rounded-lg border" />
                  </div>
                )}
              </div>
              
              <Button type="submit" className="w-full" data-testid="save-product">
                {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card data-testid="products-filters" className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, descripción o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-products"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[250px]" data-testid="category-filter">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="products-list">
        <CardHeader>
          <CardTitle>Productos ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {products.length === 0 ? 'No hay productos aún' : 'No se encontraron productos con los filtros aplicados'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="card-hover overflow-hidden" data-testid={`product-${product.sku}`}>
                  {product.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant="secondary">{getCategoryLabel(product.category)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                    
                    <div className="bg-muted/50 rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Precio Final:</span>
                        <span className="text-xl font-bold text-secondary">${product.price?.toFixed(2) || '0.00'}</span>
                      </div>
                      {product.base_price && (
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Base: ${product.base_price.toFixed(2)}</span>
                          <span>
                            + {product.profit_type === 'percentage' ? `${product.profit_value}%` : `$${product.profit_value}`} 
                            {' '}+ IVA {product.iva_percentage || 16}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs font-mono text-muted-foreground mb-1">SKU: {product.sku}</p>
                    <p className="text-xs text-muted-foreground mb-3">Proveedor: {product.supplier_name}</p>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(product)}
                        data-testid={`edit-product-${product.id}`}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDelete(product)}
                        data-testid={`delete-product-${product.id}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el producto <strong>{productToDelete?.name}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
