import { useState, useEffect } from 'react';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="manage-products-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Todos los Productos</h1>
        <p className="text-muted-foreground text-lg">Vista general del catálogo</p>
      </div>

      <Card data-testid="products-list">
        <CardHeader>
          <CardTitle>Productos ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="card-hover" data-testid={`product-${product.sku}`}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-secondary">${product.price.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">{product.supplier_name}</span>
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