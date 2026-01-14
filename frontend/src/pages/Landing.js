import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ship, Package, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API } from '@/App';

export default function Landing() {
  const [formData, setFormData] = useState({
    boat_name: '',
    captain_name: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API}/registration-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al enviar solicitud');
      }

      toast.success('¡Solicitud enviada! Nos pondremos en contacto contigo pronto.');
      setFormData({ boat_name: '', captain_name: '', phone: '', email: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1724597500306-a4cbb7d1324e)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/90 to-[#1E293B]/80"></div>
        <div className="relative z-10 text-center px-4 max-w-5xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-in slide-in-from-bottom-4 duration-700" data-testid="hero-heading">
            Mar de Cortez
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-150" data-testid="hero-description">
            Sistema de e-procurement marino basado en la nube. Gestiona todas tus actividades de compra de manera eficiente y simplificada.
          </p>
          <div className="flex gap-4 justify-center animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link to="/register">
              <Button size="lg" className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-8 py-6 text-lg font-semibold shadow-lg" data-testid="get-started-btn">
                Comenzar Ahora
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 px-8 py-6 text-lg font-semibold" data-testid="login-btn">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground" data-testid="features-heading">
            Características Principales
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="card-hover" data-testid="feature-cloud">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Ship className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">En la Nube</h3>
                <p className="text-muted-foreground">
                  Accede a tu información desde cualquier dispositivo con internet.
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover" data-testid="feature-management">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Gestión Completa</h3>
                <p className="text-muted-foreground">
                  Administra órdenes, productos y proveedores desde un solo lugar.
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover" data-testid="feature-tracking">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Seguimiento en Tiempo Real</h3>
                <p className="text-muted-foreground">
                  Rastrea el estado de tus órdenes en cada etapa del proceso.
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover" data-testid="feature-suppliers">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Red de Proveedores</h3>
                <p className="text-muted-foreground">
                  Conecta con múltiples proveedores y gestiona relaciones comerciales.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-4 ocean-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" data-testid="cta-heading">
            Listo para transformar tu gestión de compras?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a Mar de Cortez y optimiza tus procesos de procurement marino.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-8 py-6 text-lg font-semibold shadow-lg" data-testid="cta-register-btn">
              Registrarse Gratis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}