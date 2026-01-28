import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ship, Package, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API } from '@/App';
import Footer from '@/components/Footer';

// Imágenes de barcos mercantes y puertos
const heroImages = [
  'https://images.unsplash.com/photo-1724597500306-a4cbb7d1324e', // Imagen original
  'https://images.unsplash.com/photo-1703977883249-d959f2b0c1ae', // Bulk Carrier at sunset
  'https://images.unsplash.com/photo-1637464019106-2789e949c28a', // Large cargo ship
  'https://images.unsplash.com/photo-1761910502116-9c1c0fb3620b', // Cargo ships at industrial port
  'https://images.unsplash.com/photo-1703226741497-6de4f67c6e11', // Vibrant port scene with cranes
  'https://images.unsplash.com/photo-1753483395880-46dc1c2ece54', // Cargo ship on calm water
];

export default function Landing() {
  const [formData, setFormData] = useState({
    boat_name: '',
    captain_name: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Carrusel automático de imágenes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Cambiar cada 5 segundos

    return () => clearInterval(interval);
  }, []);

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
      {/* Hero Section with Image Carousel */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Images Container */}
        {heroImages.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: index === currentImageIndex ? 1 : 0,
              zIndex: index === currentImageIndex ? 1 : 0,
            }}
          />
        ))}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/85 to-[#1E293B]/75 z-10"></div>
        
        {/* Content */}
        <div className="relative z-20 text-center px-4 max-w-5xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-in slide-in-from-bottom-4 duration-700" data-testid="hero-heading">
            Mar de Cortez
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-150" data-testid="hero-description">
            Sistema de pedidos marino basado en la nube. Gestiona todas tus actividades de compra de manera eficiente y simplificada.
          </p>
          <div className="flex gap-4 justify-center animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link to="/login">
              <Button size="lg" className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-8 py-6 text-lg font-semibold shadow-lg" data-testid="login-btn">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
          
          {/* Image Indicators */}
          <div className="flex gap-2 justify-center mt-12">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'bg-white w-8' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
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
            ¿Listo para transformar tu gestión de compras?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Completa el formulario y nuestro equipo se pondrá en contacto contigo.
          </p>
        </div>
      </div>

      {/* Registration Form Section */}
      <div className="py-24 px-4 bg-background">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl" data-testid="registration-form">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-2 text-center">Solicitud de Registro</h2>
              <p className="text-muted-foreground text-center mb-8">
                Completa tus datos y nos pondremos en contacto contigo
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="boat_name">Nombre del Barco</Label>
                  <Input
                    id="boat_name"
                    placeholder="Ej: Neptuno III"
                    value={formData.boat_name}
                    onChange={(e) => setFormData({ ...formData, boat_name: e.target.value })}
                    required
                    data-testid="boat-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="captain_name">Nombre del Capitán</Label>
                  <Input
                    id="captain_name"
                    placeholder="Ej: Juan Pérez"
                    value={formData.captain_name}
                    onChange={(e) => setFormData({ ...formData, captain_name: e.target.value })}
                    required
                    data-testid="captain-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ej: +52 123 456 7890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    data-testid="phone-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="email-input"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full" 
                  disabled={loading}
                  data-testid="submit-registration-btn"
                >
                  {loading ? 'Enviando...' : 'Enviar Solicitud'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}