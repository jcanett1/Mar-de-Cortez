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
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function RegistrationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalData, setApprovalData] = useState({
    email: '',
    password: '',
    name: '',
    role: '',
    company: ''
  });
  const [filter, setFilter] = useState('pendiente');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filter ? `${API}/admin/registration-requests?status=${filter}` : `${API}/admin/registration-requests`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!approvalData.role || !approvalData.password) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/registration-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(approvalData)
      });

      if (!response.ok) throw new Error('Error al aprobar solicitud');

      toast.success('Solicitud aprobada y usuario creado');
      setSelectedRequest(null);
      setApprovalData({ email: '', password: '', name: '', role: '', company: '' });
      fetchRequests();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleReject = async (requestId) => {
    if (!confirm('¿Estás seguro de rechazar esta solicitud?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/registration-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al rechazar solicitud');

      toast.success('Solicitud rechazada');
      fetchRequests();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openApprovalDialog = (request) => {
    setSelectedRequest(request);
    setApprovalData({
      email: request.email,
      password: '',
      name: request.captain_name,
      role: '',
      company: request.boat_name
    });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="registration-requests-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Solicitudes de Registro</h1>
        <p className="text-muted-foreground text-lg">Gestiona las solicitudes de nuevos usuarios</p>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'pendiente' ? 'default' : 'outline'}
              onClick={() => setFilter('pendiente')}
              data-testid="filter-pending"
            >
              Pendientes
            </Button>
            <Button
              variant={filter === 'aprobado' ? 'default' : 'outline'}
              onClick={() => setFilter('aprobado')}
              data-testid="filter-approved"
            >
              Aprobadas
            </Button>
            <Button
              variant={filter === 'rechazado' ? 'default' : 'outline'}
              onClick={() => setFilter('rechazado')}
              data-testid="filter-rejected"
            >
              Rechazadas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card data-testid="requests-list">
        <CardHeader>
          <CardTitle>Solicitudes ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay solicitudes con este estado</p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="card-hover" data-testid={`request-${request.id}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{request.captain_name}</h3>
                        <p className="text-muted-foreground">Barco: {request.boat_name}</p>
                      </div>
                      <Badge 
                        className={`status-badge ${
                          request.status === 'pendiente' ? 'status-pendiente' :
                          request.status === 'aprobado' ? 'status-completado' :
                          'status-cancelado'
                        }`}
                      >
                        {request.status === 'pendiente' ? 'Pendiente' :
                         request.status === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{request.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Teléfono</p>
                        <p className="font-medium">{request.phone}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Solicitado: {new Date(request.created_at).toLocaleString('es-MX')}
                    </p>
                    {request.status === 'pendiente' && (
                      <div className="flex gap-2 mt-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button onClick={() => openApprovalDialog(request)} data-testid={`approve-btn-${request.id}`}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Aprobar
                            </Button>
                          </DialogTrigger>
                          <DialogContent data-testid="approval-dialog">
                            <DialogHeader>
                              <DialogTitle>Aprobar Solicitud</DialogTitle>
                              <DialogDescription>
                                Crea las credenciales para {request.captain_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Email</Label>
                                <Input
                                  value={approvalData.email}
                                  onChange={(e) => setApprovalData({ ...approvalData, email: e.target.value })}
                                  data-testid="approval-email"
                                />
                              </div>
                              <div>
                                <Label>Nombre</Label>
                                <Input
                                  value={approvalData.name}
                                  onChange={(e) => setApprovalData({ ...approvalData, name: e.target.value })}
                                  data-testid="approval-name"
                                />
                              </div>
                              <div>
                                <Label>Contraseña</Label>
                                <Input
                                  type="password"
                                  value={approvalData.password}
                                  onChange={(e) => setApprovalData({ ...approvalData, password: e.target.value })}
                                  placeholder="Generar contraseña"
                                  data-testid="approval-password"
                                />
                              </div>
                              <div>
                                <Label>Rol</Label>
                                <Select value={approvalData.role} onValueChange={(value) => setApprovalData({ ...approvalData, role: value })}>
                                  <SelectTrigger data-testid="approval-role">
                                    <SelectValue placeholder="Selecciona rol" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cliente">Cliente</SelectItem>
                                    <SelectItem value="proveedor">Proveedor</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Empresa/Barco</Label>
                                <Input
                                  value={approvalData.company}
                                  onChange={(e) => setApprovalData({ ...approvalData, company: e.target.value })}
                                  data-testid="approval-company"
                                />
                              </div>
                              <Button onClick={() => handleApprove(request.id)} className="w-full" data-testid="confirm-approval">
                                Crear Usuario
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="destructive" onClick={() => handleReject(request.id)} data-testid={`reject-btn-${request.id}`}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Rechazar
                        </Button>
                      </div>
                    )}
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