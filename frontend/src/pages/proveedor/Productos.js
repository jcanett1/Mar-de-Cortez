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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Package, Layers } from 'lucide-react';

export default function Productos() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [deleteProductDialog, setDeleteProductDialog] = useState({ open: false, product: null });
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState({ open: false, category: null });
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    base_price: '',
    profit_type: 'percentage',
    profit_value: '',
    iva_percentage: '16',
    sku: '',
    image_url: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${API}/products`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalPrice = () => {
    const base = parseFloat(productForm.base_price) || 0;
    const profitVal = parseFloat(productForm.profit_value) || 0;
    const iva = parseFloat(productForm.iva_percentage) || 0;
    
    let priceWithProfit = base;
    if (productForm.profit_type === 'percentage') {
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

  const handleProductSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      let imageUrl = productForm.image_url;
      if (imageFile) {
        imageUrl = imagePreview;
      }
      
      const productData = {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        base_price: parseFloat(productForm.base_price),
        profit_type: productForm.profit_type,
        profit_value: parseFloat(productForm.profit_value),
        iva_percentage: parseFloat(productForm.iva_percentage),
        sku: productForm.sku,
        image_url: imageUrl
      };
      
      if (editingProduct) {
        const response = await fetch(`${API}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });

        if (!response.ok) throw new Error('Error al actualizar producto');
        toast.success('Producto actualizado');
      } else {
        const response = await fetch(`${API}/products`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });

        if (!response.ok) throw new Error('Error al crear producto');
        toast.success('Producto creado');
      }
      
      setIsProductDialogOpen(false);
      resetProductForm();
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al crear categoría');
      }

      toast.success('Categoría creada');
      setIsCategoryDialogOpen(false);
      setCategoryForm({ name: '', slug: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      base_price: product.base_price?.toString() || product.price.toString(),
      profit_type: product.profit_type || 'percentage',
      profit_value: product.profit_value?.toString() || '0',
      iva_percentage: product.iva_percentage?.toString() || '16',
      sku: product.sku,
      image_url: product.image_url || ''
    });
    setImagePreview(product.image_url);
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    setDeleteProductDialog({ open: true, product: { id: productId } });
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductDialog.product) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/products/${deleteProductDialog.product.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Producto eliminado');
      setDeleteProductDialog({ open: false, product: null });
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    setDeleteCategoryDialog({ open: true, category: { id: categoryId, name: categoryName } });
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryDialog.category) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/categories/${deleteCategoryDialog.category.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Categoría eliminada');
      setDeleteCategoryDialog({ open: false, category: null });
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setProductForm({
      name: '',
      description: '',
      category: '',
      base_price: '',
      profit_type: 'percentage',
      profit_value: '',
      iva_percentage: '16',
      sku: '',
      image_url: ''
    });
  };

  const filteredProducts = filterCategory && filterCategory !== 'all'
    ? products.filter(p => p.category === filterCategory)
    : products;

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="productos-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Gestionar Productos</h1>
          <p className="text-muted-foreground text-lg">Administra tu catálogo</p>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Layers className="mr-2 h-4 w-4" />
            Categorías
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* Product Actions */}
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
              setIsProductDialogOpen(open);
              if (!open) resetProductForm();
            }}>
              <DialogTrigger asChild>
                <Button data-testid="add-product-btn">
                  <Plus className="mr-2 h-5 w-5" />
                  Agregar Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Select value={productForm.category} onValueChange={(value) => setProductForm({ ...productForm, category: value })} required>
                      <SelectTrigger>
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
                      <Input type="number" step="0.01" value={productForm.base_price} onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de Ganancia</Label>
                        <Select value={productForm.profit_type} onValueChange={(value) => setProductForm({ ...productForm, profit_type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Porcentaje %</SelectItem>
                            <SelectItem value="fixed">Monto Fijo $</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Ganancia ({productForm.profit_type === 'percentage' ? '%' : '$'})</Label>
                        <Input type="number" step="0.01" value={productForm.profit_value} onChange={(e) => setProductForm({ ...productForm, profit_value: e.target.value })} required />
                      </div>
                    </div>
                    <div>
                      <Label>IVA (%)</Label>
                      <Input type="number" step="0.01" value={productForm.iva_percentage} onChange={(e) => setProductForm({ ...productForm, iva_percentage: e.target.value })} required />
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Precio Final:</span>
                        <span className="text-2xl font-bold text-secondary">${calculateFinalPrice()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>SKU</Label>
                    <Input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Imagen</Label>
                    <Input type="file" accept="image/*" onChange={handleImageChange} />
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="mt-2 w-full h-48 object-cover rounded" />
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    {editingProduct ? 'Actualizar' : 'Crear'} Producto
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No hay productos</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <Card key={product.id} className="card-hover">
                  {product.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant="secondary">{categories.find(c => c.slug === product.category)?.name || product.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                    <div className="space-y-1 text-sm mb-3">
                      {product.base_price && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base:</span>
                          <span>${product.base_price.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold">
                        <span>Final:</span>
                        <span className="text-lg text-secondary">${product.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mb-3">SKU: {product.sku}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditProduct(product)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-5 w-5" />
                  Nueva Categoría
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Categoría</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Slug (identificador único)</Label>
                    <Input value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="ej: herramientas-electricas" required />
                  </div>
                  <div>
                    <Label>Descripción (Opcional)</Label>
                    <Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full">Crear Categoría</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Card key={cat.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground">{cat.slug}</p>
                      {cat.description && <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteCategory(cat.id, cat.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Product Dialog */}
      <Dialog open={deleteProductDialog.open} onOpenChange={(open) => setDeleteProductDialog({ open, product: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteProductDialog({ open: false, product: null })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={deleteCategoryDialog.open} onOpenChange={(open) => setDeleteCategoryDialog({ open, category: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la categoría <strong>{deleteCategoryDialog.category?.name}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteCategoryDialog({ open: false, category: null })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCategory}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
