/* BarberKing · Configuración por defecto
   ------------------------------------------------------------------
   Todos estos datos son editables desde el panel admin (#/admin).
   Edita aquí si quieres cambiar los valores iniciales del repo.
------------------------------------------------------------------ */
window.BK_DEFAULTS = {
  business: {
    name: 'BarberKing',
    tagline: 'Barbería & Grooming Premium',
    claim: 'Cortes clásicos de alto estándar en un ambiente pensado para ti.',
    phoneDisplay: '+56 9 1234 5678',
    waNumber: '56912345678',
    address: 'Av. Siempre Viva 1234, Santiago, Chile',
    addressShort: 'Santiago Centro',
    mapsQuery: 'Santiago, Región Metropolitana, Chile',
    instagram: '@barberking.cl',
    instagramUrl: 'https://www.instagram.com/barberking.cl',
    email: 'hola@barberking.cl',
  },

  /* Horario por defecto (apertura/cierre en minutos desde las 00:00)
     days: 0 = domingo … 6 = sábado */
  hours: {
    open: 600,   // 10:00
    close: 1200, // 20:00
    slot: 60,    // duración de cada bloque de agenda (minutos)
    days: [1, 2, 3, 4, 5, 6],
  },

  services: [
    {
      id: 'svc-corte',
      name: 'Corte clásico / fade',
      desc: 'Asesoría de estilo, corte y terminación precisa según tu tipo de rostro.',
      price: 12000,
      duration: 45,
      featured: true,
    },
    {
      id: 'svc-barba',
      name: 'Perfilado de barba',
      desc: 'Definición de líneas, rebaje y acabado limpio para un look impecable.',
      price: 8000,
      duration: 30,
    },
    {
      id: 'svc-combo',
      name: 'Corte + barba',
      desc: 'El servicio completo para renovar tu imagen en una sola visita.',
      price: 18000,
      duration: 75,
    },
    {
      id: 'svc-kids',
      name: 'Corte kids (hasta 12 años)',
      desc: 'Paciencia, entretención y un buen corte para los más pequeños.',
      price: 9000,
      duration: 40,
    },
    {
      id: 'svc-rey',
      name: 'Experiencia Rey',
      desc: 'Corte + barba + ritual de toalla caliente, hidratación y peinado final.',
      price: 24000,
      duration: 90,
    },
    {
      id: 'svc-color',
      name: 'Color / decoloración',
      desc: 'Procesos de color con productos de alta gama y asesoría personalizada.',
      price: 15000,
      duration: 60,
    },
  ],

  barbers: [
    {
      id: 'bar-matias',
      name: 'Matías González',
      specialty: 'Barbero senior · Fades & cortes clásicos',
      bio: 'Más de 10 años afinando fades y cortes a navaja. Amante del detalle y las líneas perfectas.',
      services: ['svc-corte', 'svc-combo', 'svc-rey'],
    },
    {
      id: 'bar-joaquin',
      name: 'Joaquín Reyes',
      specialty: 'Barba & acabados',
      bio: 'Especialista en perfilado de barba y rituales de toalla caliente.',
      services: ['svc-barba', 'svc-combo', 'svc-rey'],
    },
    {
      id: 'bar-sebastian',
      name: 'Sebastián Torres',
      specialty: 'Cortes de cabello & kids',
      bio: 'Paciencia infinita con los más chicos y técnica fina en cabellos difíciles.',
      services: ['svc-corte', 'svc-kids'],
    },
    {
      id: 'bar-daniel',
      name: 'Daniel Fuentes',
      specialty: 'Diseño & razor work',
      bio: 'Líneas marcadas, diseños gravados y trabajo a navaja con precisión quirúrgica.',
      services: ['svc-corte', 'svc-color', 'svc-rey'],
    },
  ],

  testimonials: [
    {
      name: 'Cristóbal Vega',
      service: 'Corte + barba',
      text: 'Llevo años buscando un lugar que entienda lo que pido. El fade queda impecable todas las veces.',
    },
    {
      name: 'Rodrigo Salas',
      service: 'Perfilado de barba',
      text: 'La atención es de otro nivel: te asesoran, te relajan y sales renovado. 100% recomendado.',
    },
    {
      name: 'Ignacio Herrera',
      service: 'Experiencia Rey',
      text: 'El ritual de toalla caliente es lo mejor que existe. Se nota el cariño por el oficio.',
    },
  ],

  stats: [
    { value: 8, suffix: '+', label: 'Años de oficio' },
    { value: 40, suffix: 'K+', label: 'Cortes realizados' },
    { value: 4, suffix: '', label: 'Barberos expertos' },
    { value: 4.9, suffix: '★', label: 'Calificación clientes' },
  ],

  gallery: [
    {
      src: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=900&q=75',
      alt: 'Barbero trabajando con precisión un corte en la silla',
    },
    {
      src: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=75',
      alt: 'Cliente recibiendo un perfilado de barba',
    },
    {
      src: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=900&q=75',
      alt: 'Sillón clásico de barbería en el local',
    },
    {
      src: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=75',
      alt: 'Herramientas e instrumentos de una barbería',
    },
  ],

  /* Acceso al panel admin */
  admin: {
    user: 'admin',
    passcode: 'barberking',
  },
};