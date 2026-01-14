import { useState, useEffect } from 'react';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, UserPlus } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: '',
    company: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data.filter(u => u.role !== 'admin'));
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al crear usuario');

      toast.success('Usuario creado exitosamente');
      setIsDialogOpen(false);
      setFormData({ email: '', password: '', name: '', role: '', company: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="manage-users-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Gestionar Usuarios</h1>
          <p className="text-muted-foreground text-lg">Administra clientes y proveedores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" data-testid="add-user-btn">
              <Plus className="mr-2 h-5 w-5" />
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="user-dialog">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>Agrega un cliente o proveedor al sistema</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="user-name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required data-testid="user-email" />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required data-testid="user-password" />
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} required>
                  <SelectTrigger data-testid="user-role">
                    <SelectValue placeholder="Selecciona rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="proveedor">Proveedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Empresa (Opcional)</Label>
                <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} data-testid="user-company" />
              </div>
              <Button type="submit" className="w-full" data-testid="save-user">Crear Usuario</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card data-testid="users-list">
        <CardHeader>
          <CardTitle>Usuarios ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="card-hover" data-testid={`user-${user.id}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      <p className="text-muted-foreground">{user.email}</p>
                      {user.company && <p className="text-sm text-muted-foreground">{user.company}</p>}
                    </div>
                    <Badge className={user.role === 'cliente' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                      {user.role === 'cliente' ? 'Cliente' : 'Proveedor'}
                    </Badge>
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