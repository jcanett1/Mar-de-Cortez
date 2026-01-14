import { useState, useEffect } from 'react';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al crear categoría');

      toast.success('Categoría creada');
      setIsDialogOpen(false);
      setFormData({ name: '', slug: '', description: '' });
      fetchCategories();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!confirm('¿Eliminar esta categoría?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Categoría eliminada');
      fetchCategories();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="manage-categories-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Categorías</h1>
          <p className="text-muted-foreground text-lg">Gestiona las categorías de productos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" data-testid="add-category-btn">
              <Plus className="mr-2 h-5 w-5" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="category-dialog">
            <DialogHeader>
              <DialogTitle>Crear Categoría</DialogTitle>
              <DialogDescription>Agrega una nueva categoría de productos</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="category-name" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="ej: electronica" required data-testid="category-slug" />
              </div>
              <div>
                <Label>Descripción (Opcional)</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} data-testid="category-description" />
              </div>
              <Button type="submit" className="w-full" data-testid="save-category">Crear</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card data-testid="categories-list">
        <CardHeader>
          <CardTitle>Categorías ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <Card key={cat.id} className="card-hover" data-testid={`category-${cat.slug}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground">{cat.slug}</p>
                      {cat.description && <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(cat.id)} data-testid={`delete-${cat.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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