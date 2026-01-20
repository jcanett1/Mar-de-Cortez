// Footer Component for Mar de Cortez Landing Page
// JavaScript Vanilla Version

function createFooter() {
  const currentYear = new Date().getFullYear();
  
  const footerHTML = `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-grid">
          <!-- Brand Section -->
          <div class="footer-brand">
            <div class="brand-logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.9 5.8 2.2 8"/>
                <path d="M10 10 12 3l2 7"/>
                <path d="M5 10v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1"/>
              </svg>
              <span class="brand-name">Mar de Cortez</span>
            </div>
            <p class="brand-description">
              Sistema de pedidos marino basado en la nube. Gestiona todas tus actividades de compra de manera eficiente y simplificada.
            </p>
            <div class="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Quick Links -->
          <div class="footer-section">
            <h3 class="footer-title">Enlaces Rápidos</h3>
            <nav class="footer-links">
              <a href="/" class="footer-link">Inicio</a>
              <a href="/features" class="footer-link">Características</a>
              <a href="/about" class="footer-link">Acerca de Nosotros</a>
              <a href="/contact" class="footer-link">Contacto</a>
              <a href="/login" class="footer-link">Iniciar Sesión</a>
            </nav>
          </div>

          <!-- Services -->
          <div class="footer-section">
            <h3 class="footer-title">Servicios</h3>
            <nav class="footer-links">
              <a href="#" class="footer-link">Gestión de Órdenes</a>
              <a href="#" class="footer-link">Seguimiento en Tiempo Real</a>
              <a href="#" class="footer-link">Red de Proveedores</a>
              <a href="#" class="footer-link">Análisis y Reportes</a>
              <a href="#" class="footer-link">Soporte Técnico 24/7</a>
            </nav>
          </div>

          <!-- Contact Info -->
          <div class="footer-section">
            <h3 class="footer-title">Contáctanos</h3>
            <div class="contact-info">
              <div class="contact-item">
                <svg class="contact-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>Puerto Vallarta, Jalisco<br>México</span>
              </div>
              <div class="contact-item">
                <svg class="contact-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <a href="tel:+523222000000">+52 (322) 200-0000</a>
              </div>
              <div class="contact-item">
                <svg class="contact-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <a href="mailto:info@mardecortez.com">info@mardecortez.com</a>
              </div>
            </div>
            <div class="newsletter">
              <h4 class="newsletter-title">Suscríbete a nuestro boletín</h4>
              <form class="newsletter-form" onsubmit="handleNewsletterSubmit(event)">
                <input 
                  type="email" 
                  placeholder="Tu correo" 
                  class="newsletter-input"
                  required
                >
                <button type="submit" class="newsletter-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom">
        <div class="footer-bottom-container">
          <p class="copyright">© ${currentYear} Mar de Cortez. Todos los derechos reservados.</p>
          <div class="legal-links">
            <a href="#" class="legal-link">Política de Privacidad</a>
            <a href="#" class="legal-link">Términos y Condiciones</a>
            <a href="#" class="legal-link">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  `;

  return footerHTML;
}

// Function to initialize the footer
function initFooter(containerId = 'footer-container') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = createFooter();
    addFooterStyles();
  } else {
    console.error(`Element with id "${containerId}" not found`);
  }
}

// Newsletter handler
function handleNewsletterSubmit(event) {
  event.preventDefault();
  const email = event.target.querySelector('input[type="email"]').value;
  alert(`¡Gracias por suscribirte! Te enviaremos noticias a: ${email}`);
  event.target.reset();
}

// Add CSS styles dynamically
function addFooterStyles() {
  const styles = `
    .footer {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }

    .footer-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 60px 20px 40px;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 40px;
    }

    @media (min-width: 768px) {
      .footer-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .footer-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    /* Brand Section */
    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo svg {
      color: #3B82F6;
    }

    .brand-name {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .brand-description {
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
      font-size: 0.95rem;
    }

    .social-links {
      display: flex;
      gap: 12px;
      padding-top: 8px;
    }

    .social-link {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.8);
      transition: all 0.3s ease;
    }

    .social-link:hover {
      background: #3B82F6;
      color: #fff;
      transform: translateY(-2px);
    }

    /* Footer Sections */
    .footer-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .footer-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .footer-links {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .footer-link {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-size: 0.95rem;
      transition: all 0.3s ease;
      display: inline-block;
    }

    .footer-link:hover {
      color: #fff;
      transform: translateX(5px);
    }

    /* Contact Info */
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      color: rgba(255, 255, 255, 0.7);
    }

    .contact-item a {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .contact-item a:hover {
      color: #3B82F6;
    }

    .contact-icon {
      color: #3B82F6;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* Newsletter */
    .newsletter {
      padding-top: 16px;
    }

    .newsletter-title {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .newsletter-form {
      display: flex;
      gap: 8px;
    }

    .newsletter-input {
      flex: 1;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #fff;
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }

    .newsletter-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .newsletter-input:focus {
      outline: none;
      border-color: #3B82F6;
    }

    .newsletter-btn {
      width: 48px;
      height: 48px;
      background: #3B82F6;
      border: none;
      border-radius: 8px;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .newsletter-btn:hover {
      background: #2563EB;
      transform: scale(1.05);
    }

    /* Bottom Bar */
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.2);
    }

    .footer-bottom-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }

    @media (min-width: 768px) {
      .footer-bottom-container {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .copyright {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.875rem;
    }

    .legal-links {
      display: flex;
      gap: 24px;
      justify-content: center;
    }

    .legal-link {
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.3s ease;
    }

    .legal-link:hover {
      color: #fff;
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .footer {
      animation: fadeInUp 0.6s ease-out;
    }
  `;

  // Create style element
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  styleSheet.id = 'footer-styles';
  
  // Remove existing styles if any
  const existingStyle = document.getElementById('footer-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  document.head.appendChild(styleSheet);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createFooter, initFooter, handleNewsletterSubmit };
}
