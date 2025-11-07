// ========== CONFIGURACIÓN Y CONSTANTES ==========
const CONFIG = {
  CENTRO_PASTO: { lat: 1.2136, lng: -77.2811 },
  LIMITES_NARINO: {
    southwest: { lat: 0.5, lng: -78.9 },
    northeast: { lat: 2.0, lng: -76.5 }
  },
  DISTANCIA_PASO: 50,
  ZOOM_UBICACION: 18,
  ZOOM_INICIAL: 14,
  ZOOM_MUNICIPIO: 15,
  MODO_DEBUG: false
};

// ========== ESTADO DE LA APLICACIÓN ==========
const Estado = {
  map: null,
  directionsRenderer: null,
  directionsService: null,
  origenActual: null,
  pasos: [],
  indiceActual: 0,
  watchId: null,
  rutaActiva: false,
  LIMITES_NARINO: null,
  markerUbicacion: null,
  municipios: [],
  reconocimiento: null,
  reconocimientoActivo: false,
  municipioSeleccionado: null
};

const MUNICIPIOS_TURISTICOS = [
  {
    id: 'pasto',
    nombre: 'San Juan de Pasto',
    lat: 1.2136,
    lng: -77.2811,
    fotos: [
      './imagenes/foto.jpg',  // ✅ ASÍ
      './imagenes/foto.jpg',
      './imagenes/foto.jpg',
      './imagenes/foto.jpg',
      './imagenes/foto.jpg',
      './imagenes/foto.jpg',
      './imagenes/foto.jpg',
    ],
    curiosidad: '¿Sabías que en Pasto se celebra el Carnaval de Negros y Blancos, Patrimonio Cultural Inmaterial de la Humanidad?',
    info: {
      comer: [
        { nombre: 'La Catedral Café', direccion: 'Calle 18 #25-34', desc: 'Cafetería gourmet con productos locales', lat: 1.2128, lng: -77.2819 },
        { nombre: 'El Fritadero de la 30', direccion: 'Carrera 27 #17-50', desc: 'Comida rápida típica pastusa', lat: 1.2150, lng: -77.2825 },
        { nombre: 'El Fogón de mi Tierra', direccion: 'Centro histórico', desc: 'Cocina tradicional nariñense', lat: 1.2130, lng: -77.2800 },
        { nombre: 'Tipicos de Nariño', direccion: 'Cerca de la catedral', desc: 'Especializado en cuy, tamales y envueltos', lat: 1.2145, lng: -77.2830 }
      ],
      hospedarse: [
        { nombre: 'Hotel Fernando Plaza', direccion: 'Centro histórico', desc: '4 estrellas, $180.000/noche', lat: 1.2120, lng: -77.2805 },
        { nombre: 'Hotel Pasteur', direccion: 'Cerca de la catedral', desc: '3 estrellas, $120.000/noche', lat: 1.2138, lng: -77.2815 },
        { nombre: 'Hostal La Casona', direccion: 'Barrio San Juan', desc: 'Económico, $40.000/noche', lat: 1.2140, lng: -77.2835 },
        { nombre: 'Hotel San Sebastián Plaza', direccion: 'Zona norte', desc: 'Moderno, $150.000/noche', lat: 1.2115, lng: -77.2790 }
      ],
      hacer: [
        { nombre: 'Museo del Carnaval', fecha: '6-7 de enero', desc: 'Conoce la historia del carnaval pastuso' },
        { nombre: 'Laguna de la Cocha', fecha: 'Todo el año', desc: 'Paseos en bote, 30 min desde Pasto' },
        { nombre: 'Volcán Galeras', fecha: 'Sábados y domingos', desc: 'Tour guiado al cráter activo' },
        { nombre: 'Centro Histórico', fecha: 'Diariamente 9:00-17:00', desc: 'Catedral, Iglesia de San Juan, Teatro Imperial' },
        { nombre: 'Parque Biodiversidad', fecha: 'Lunes a viernes', desc: 'Fauna y flora de la región andina' }
      ]
    }
  },
  {
    id: 'ipiales',
    nombre: 'Ipiales',
    lat: 0.8260,
    lng: -77.6461,
    fotos: [
      'https://via.placeholder.com/400x250/008000/ffffff?text=Ipiales+1',
      'https://via.placeholder.com/400x250/008000/ffffff?text=Ipiales+2',
      'https://via.placeholder.com/400x250/008000/ffffff?text=Ipiales+3'
    ],
    curiosidad: '¿Sabías que en Ipiales está la famosa Basílica de Nuestra Señora de las Lajas, una de las maravillas arquitectónicas de Colombia?',
    info: {
      comer: [
        { nombre: 'La Casa del Cuy', direccion: 'Calle principal', desc: 'Especialidad en cuy en variedad de preparaciones', lat: 0.8250, lng: -77.6450 },
        { nombre: 'Restaurante El Puente', direccion: 'Vista a la Basílica', desc: 'Comida internacional', lat: 0.8270, lng: -77.6465 },
        { nombre: 'El Rincón Nariñense', direccion: 'Centro', desc: 'Comida típica de la frontera', lat: 0.8265, lng: -77.6455 },
        { nombre: 'Café de la Plaza', direccion: 'Plaza central', desc: 'Desayunos y tapas con café de la región', lat: 0.8255, lng: -77.6470 }
      ],
      hospedarse: [
        { nombre: 'Hotel Boutique La Basílica', direccion: 'Vista panorámica', desc: 'Vista a la Basílica, $200.000/noche', lat: 0.8280, lng: -77.6475 },
        { nombre: 'Hotel Imperial Ipiales', direccion: 'Centro ciudad', desc: '2 estrellas, $90.000/noche', lat: 0.8260, lng: -77.6460 },
        { nombre: 'Hostal Frontera', direccion: 'Cerca terminal', desc: 'Económico, $35.000/noche', lat: 0.8240, lng: -77.6450 },
        { nombre: 'Hotel San Luis', direccion: 'Zona comercial', desc: '3 estrellas, desayuno incluido', lat: 0.8275, lng: -77.6468 }
      ],
      hacer: [
        { nombre: 'Basílica de Las Lajas', fecha: '7 de septiembre', desc: 'Santuario gótico entre dos puentes' },
        { nombre: 'Parque Natural Rumichaca', fecha: 'Todo el año', desc: 'Puente de la frontera con Ecuador' },
        { nombre: 'Cascada de la Novia', fecha: 'Fines de semana', desc: '40 metros de altura, 20 min de Ipiales' },
        { nombre: 'Museo de la Ciudad', fecha: 'Diariamente 8:00-16:00', desc: 'Historia y cultura de la frontera' },
        { nombre: 'Merapi Tour', fecha: 'Sábados', desc: 'Excursión al volcán activo (observatorio)' }
      ]
    }
  }
];

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', iniciarApp);

function iniciarApp() {
  mostrarPantallaCarga();
  configurarEventListeners();
}

function mostrarPantallaCarga() {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    const contenedor = document.getElementById('contenedor');
    
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      contenedor.style.opacity = '1';
      contenedor.style.pointerEvents = 'auto';
      
      if (Estado.map && typeof google !== 'undefined') {
        google.maps.event.trigger(Estado.map, 'resize');
        Estado.map.setCenter(CONFIG.CENTRO_PASTO);
      }
    }, 500);
  }, 2000);
}

function configurarEventListeners() {
  document.getElementById('btnUbicar')?.addEventListener('click', actualizarMiUbicacion);
  document.getElementById('btnVoz')?.addEventListener('click', manejarBotonVoz);
  document.getElementById('btnBuscar')?.addEventListener('click', buscarRuta);
  document.getElementById('btnBorrar')?.addEventListener('click', borrarRuta);
}

// ========== INICIALIZACIÓN DEL MAPA ==========
function initMap() {
  Estado.LIMITES_NARINO = new google.maps.LatLngBounds(
    CONFIG.LIMITES_NARINO.southwest,
    CONFIG.LIMITES_NARINO.northeast
  );

  Estado.map = new google.maps.Map(document.getElementById("map"), {
    zoom: CONFIG.ZOOM_INICIAL,
    center: CONFIG.CENTRO_PASTO,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    restriction: {
      latLngBounds: Estado.LIMITES_NARINO,
      strictBounds: false
    }
  });

  Estado.directionsService = new google.maps.DirectionsService();
  Estado.directionsRenderer = new google.maps.DirectionsRenderer({ 
    suppressMarkers: false 
  });
  Estado.directionsRenderer.setMap(Estado.map);

  configurarAutocomplete();
  cargarMunicipiosTuristicos();
  inicializarReconocimientoVoz();
  obtenerUbicacionInicial();
}

function configurarAutocomplete() {
  const opcionesNarino = {
    types: ["geocode"],
    componentRestrictions: { country: "co" },
    bounds: Estado.LIMITES_NARINO,
    strictBounds: true
  };

  const autoOrigen = new google.maps.places.Autocomplete(
    document.getElementById("origen"), 
    opcionesNarino
  );
  const autoDestino = new google.maps.places.Autocomplete(
    document.getElementById("destino"), 
    opcionesNarino
  );

  autoOrigen.addListener('place_changed', () => {
    validarLugar(autoOrigen.getPlace(), 'origen', 'error-origen');
  });

  autoDestino.addListener('place_changed', () => {
    validarLugar(autoDestino.getPlace(), 'destino', 'error-destino');
  });
}

// ========== CARGAR MUNICIPIOS TURÍSTICOS ==========
function cargarMunicipiosTuristicos() {
  MUNICIPIOS_TURISTICOS.forEach(municipio => {
    const marcador = new google.maps.Marker({
      position: { lat: municipio.lat, lng: municipio.lng },
      map: Estado.map,
      title: municipio.nombre,
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      label: {
        text: municipio.nombre,
        color: "#0066cc",
        fontSize: "11px",
        fontWeight: "bold"
      }
    });

    marcador.addListener("click", () => {
      acercarAMunicipio(municipio);
    });

    Estado.municipios.push({
      ...municipio,
      marcador: marcador
    });
  });
}

function acercarAMunicipio(municipio) {
  Estado.map.setCenter({ lat: municipio.lat, lng: municipio.lng });
  Estado.map.setZoom(CONFIG.ZOOM_MUNICIPIO);
  mostrarPanelMunicipio(municipio);
}

// ========== MOSTRAR PANEL VERTICAL DESLIZABLE ==========
function mostrarPanelMunicipio(municipio) {
  Estado.municipioSeleccionado = municipio;
  const panel = document.getElementById("panelMunicipio");
  
  // Título
  document.getElementById("municipioNombre").textContent = municipio.nombre;
  
  // 3 Fotos
  document.getElementById("municipioFoto1").src = municipio.fotos[0];
  document.getElementById("municipioFoto2").src = municipio.fotos[1];
  document.getElementById("municipioFoto3").src = municipio.fotos[2];
  document.getElementById("municipioFoto4").src = municipio.fotos[3];
  document.getElementById("municipioFoto5").src = municipio.fotos[4];
  document.getElementById("municipioFoto6").src = municipio.fotos[5];
  document.getElementById("municipioFoto7").src = municipio.fotos[6];
  
  // Curiosidad
  document.getElementById("municipioCuriosidad").textContent = municipio.curiosidad;
  
  // Renderizar secciones
  renderizarLugares('comer', municipio.info.comer);
  renderizarLugares('hospedarse', municipio.info.hospedarse);
  renderizarEventos('hacer', municipio.info.hacer);
  
  panel.style.display = "grid"; /* Cambiado a grid */
}

function cerrarPanelMunicipio() {
  document.getElementById("panelMunicipio").style.display = "none";
}

// ========== RENDERIZAR LUGARES (COMER/HOSPEDARSE) ==========
function renderizarLugares(tipo, lugares) {
  const container = document.getElementById(`${tipo}Lugares`);
  container.innerHTML = '';
  
  lugares.forEach(lugar => {
    const item = document.createElement('div');
    item.className = 'lugar-item';
    item.innerHTML = `
      <strong>${lugar.nombre}</strong>
      <p>${lugar.desc}</p>
      <small>📍 ${lugar.direccion}</small>
    `;
    
    // Agregar evento clic para establecer destino
    item.addEventListener('click', () => {
      establecerDestinoYBuscarRuta(lugar.nombre, lugar.lat, lugar.lng);
    });
    
    container.appendChild(item);
  });
}

// ========== RENDERIZAR EVENTOS (HACER) ==========
function renderizarEventos(tipo, eventos) {
  const container = document.getElementById(`${tipo}Lugares`);
  container.innerHTML = '';
  
  eventos.forEach(evento => {
    const item = document.createElement('div');
    item.className = 'lugar-item';
    item.style.cursor = 'default';
    item.innerHTML = `
      <strong>${evento.nombre}</strong>
      <p>${evento.desc}</p>
      <small style="color: #F57C00; font-weight: 600;">📅 ${evento.fecha}</small>
    `;
    
    container.appendChild(item);
  });
}

// ========== ESTABLECER DESTINO Y CALCULAR RUTA ==========
async function establecerDestinoYBuscarRuta(nombre, lat, lng) {
  // Cerrar panel lateral
  cerrarPanelMunicipio();
  
  // Establecer destino en el input
  document.getElementById("destino").value = nombre;
  
  // Validar límites
  const destinoLatLng = new google.maps.LatLng(lat, lng);
  if (!Estado.LIMITES_NARINO.contains(destinoLatLng)) {
    mostrarError("El destino no está dentro de Nariño");
    return;
  }
  
  // Si no hay origen, obtener ubicación actual
  if (!Estado.origenActual) {
    mostrarEstadoVoz('📍 Obteniendo tu ubicación...', 'info');
    
    try {
      const position = await obtenerUbicacionPromise();
      Estado.origenActual = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // Actualizar input de origen
      document.getElementById("origen").value = 
        `${Estado.origenActual.lat.toFixed(6)}, ${Estado.origenActual.lng.toFixed(6)}`;
      
      // Crear marcador de origen
      if (Estado.markerUbicacion) Estado.markerUbicacion.setMap(null);
      Estado.markerUbicacion = new google.maps.Marker({
        position: Estado.origenActual,
        map: Estado.map,
        title: "Tu ubicación",
        icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
      });
      
      // Buscar ruta
      setTimeout(() => {
        mostrarEstadoVoz(`🚀 Calculando ruta a ${nombre}...`, 'info');
        buscarRuta();
      }, 500);
      
    } catch (error) {
      mostrarError("No se pudo obtener tu ubicación");
    }
  } else {
    // Ya hay origen, buscar ruta directamente
    mostrarEstadoVoz(`🚀 Calculando ruta a ${nombre}...`, 'info');
    setTimeout(() => buscarRuta(), 300);
  }
  
  // Centrar mapa en el destino
  Estado.map.setCenter(destinoLatLng);
  Estado.map.setZoom(16);
}

// Helper para obtener ubicación como Promise
function obtenerUbicacionPromise() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
  });
}

// ========== GESTIÓN DE UBICACIÓN ==========
function obtenerUbicacionInicial() {
  if (!navigator.geolocation) {
    mostrarError("Tu navegador no soporta geolocalización");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      const userLatLng = new google.maps.LatLng(pos.lat, pos.lng);
      
      if (!Estado.LIMITES_NARINO.contains(userLatLng)) {
        const distanciaPasto = google.maps.geometry.spherical.computeDistanceBetween(
          userLatLng,
          new google.maps.LatLng(CONFIG.CENTRO_PASTO.lat, CONFIG.CENTRO_PASTO.lng)
        );
        
        if (distanciaPasto < 100000) {
          establecerUbicacionActual(pos);
          return;
        }
        
        mostrarError("Tu ubicación no está en Nariño. Ingresa un origen manualmente.");
      } else {
        establecerUbicacionActual(pos);
      }
    },
    (error) => manejarErrorGeolocalizacion(error),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function establecerUbicacionActual(pos) {
  if (Estado.markerUbicacion) {
    Estado.markerUbicacion.setMap(null);
  }
  
  Estado.markerUbicacion = new google.maps.Marker({
    position: pos,
    map: Estado.map,
    title: "Tu ubicación",
    icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
  });
  
  Estado.origenActual = pos;
  
  new google.maps.Geocoder().geocode({ location: pos }, (results, status) => {
    if (status === "OK" && results[0]) {
      document.getElementById("origen").value = results[0].formatted_address;
    } else {
      document.getElementById("origen").value = 
        `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
    }
  });
  
  Estado.map.setCenter(pos);
  Estado.map.setZoom(CONFIG.ZOOM_UBICACION);
}

function manejarErrorGeolocalizacion(error) {
  const mensajes = {
    [error.PERMISSION_DENIED]: "Permiso de geolocalización denegado.",
    [error.POSITION_UNAVAILABLE]: "Información de ubicación no disponible.",
    [error.TIMEOUT]: "La solicitud de ubicación expiró."
  };
  
  mostrarError(mensajes[error.code] || "No se pudo obtener tu ubicación");
}

function actualizarMiUbicacion() {
  if (!navigator.geolocation) {
    mostrarError("Tu navegador no soporta geolocalización");
    return;
  }

  const btn = document.getElementById('btnUbicar');
  const textoOriginal = btn.textContent;
  btn.textContent = '🔄 Obteniendo...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      const userLatLng = new google.maps.LatLng(pos.lat, pos.lng);
      
      if (!Estado.LIMITES_NARINO.contains(userLatLng)) {
        const distanciaPasto = google.maps.geometry.spherical.computeDistanceBetween(
          userLatLng,
          new google.maps.LatLng(CONFIG.CENTRO_PASTO.lat, CONFIG.CENTRO_PASTO.lng)
        );
        
        if (distanciaPasto < 100000) {
          establecerUbicacionActual(pos);
          btn.textContent = textoOriginal;
          return;
        }
        
        mostrarError("Tu ubicación no está en Nariño. Ingresa un origen manualmente.");
        btn.textContent = textoOriginal;
      } else {
        establecerUbicacionActual(pos);
        btn.textContent = textoOriginal;
      }
    },
    (error) => {
      manejarErrorGeolocalizacion(error);
      btn.textContent = textoOriginal;
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// ========== VALIDACIÓN ==========
function validarLugar(lugar, campo, errorId) {
  const errorDiv = document.getElementById(errorId);
  errorDiv.style.display = 'none';
  
  if (!lugar.geometry) {
    mostrarErrorCampo(errorId, "No se pudo obtener la ubicación");
    document.getElementById(campo).value = '';
    return false;
  }

  const latLng = new google.maps.LatLng(
    lugar.geometry.location.lat(),
    lugar.geometry.location.lng()
  );

  if (!Estado.LIMITES_NARINO.contains(latLng)) {
    mostrarErrorCampo(errorId, "Solo ubicaciones en Nariño, Colombia");
    document.getElementById(campo).value = '';
    return false;
  }

  const esNarino = lugar.address_components?.some(component =>
    component.types.includes("administrative_area_level_1") && 
    component.long_name.toLowerCase().includes("nariño")
  );

  if (!esNarino) {
    mostrarErrorCampo(errorId, "Solo ubicaciones en Nariño permitidas");
    document.getElementById(campo).value = '';
    return false;
  }
  
  return true;
}

function mostrarErrorCampo(errorId, mensaje) {
  const errorDiv = document.getElementById(errorId);
  errorDiv.textContent = "⚠️ " + mensaje;
  errorDiv.style.display = 'block';
}

function mostrarError(mensaje) {
  alert("⚠️ " + mensaje);
}

// ========== BÚSQUEDA DE RUTAS ==========
function buscarRuta() {
  const origenTexto = document.getElementById("origen").value.trim();
  const destinoTexto = document.getElementById("destino").value.trim();
  const modo = document.getElementById("modo").value;

  if (!origenTexto || !destinoTexto) {
    mostrarError("Completa origen y destino");
    return;
  }

  Estado.directionsService.route(
    {
      origin: origenTexto,
      destination: destinoTexto,
      travelMode: google.maps.TravelMode[modo],
      unitSystem: google.maps.UnitSystem.METRIC,
      language: "es-419",
    },
    (result, status) => {
      if (status === "OK") {
        mostrarRuta(result);
      } else {
        document.getElementById("resultado").innerHTML = 
          "❌ No se encontró la ruta.";
        detenerSeguimiento();
        Estado.rutaActiva = false;
      }
    }
  );
}

function mostrarRuta(result) {
  Estado.directionsRenderer.setDirections(result);
  
  const leg = result.routes[0].legs[0];
  const tiempoTexto = `✅ Llegas en ${leg.duration.text}`;
  const distanciaTexto = `📏 Distancia: ${leg.distance.text}`;
  
  document.getElementById("resultado").innerHTML =
    `<b>${tiempoTexto}</b><br>${distanciaTexto}`;
  
  mostrarEstadoVoz(`✅ Ruta encontrada: ${leg.duration.text}`, 'exito');
  
  iniciarSeguimientoDePasos(result.routes[0].legs);
  Estado.rutaActiva = true;
}

function borrarRuta() {
  Estado.directionsRenderer.setDirections({ routes: [] });
  detenerSeguimiento();
  
  Estado.rutaActiva = false;
  
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("destino").value = "";
  document.getElementById("error-origen").style.display = 'none';
  document.getElementById("error-destino").style.display = 'none';
  
  if (Estado.markerUbicacion) {
    Estado.markerUbicacion.setMap(null);
    Estado.markerUbicacion = null;
  }
  
  Estado.origenActual = null;
}

// ========== SEGUIMIENTO DE PASOS ==========
function iniciarSeguimientoDePasos(legs) {
  Estado.pasos = [];
  
  legs.forEach((leg) => {
    leg.steps.forEach((step) => {
      Estado.pasos.push({
        lat: step.end_location.lat(),
        lng: step.end_location.lng(),
        instruccion: step.instructions,
        distancia: step.distance.text,
      });
    });
  });
  
  Estado.indiceActual = 0;
  mostrarPasoActual();

  if (Estado.watchId) {
    navigator.geolocation.clearWatch(Estado.watchId);
  }
  
  Estado.watchId = navigator.geolocation.watchPosition(
    (pos) => {
      verificarSiguientePaso(pos.coords.latitude, pos.coords.longitude);
    },
    () => {},
    { enableHighAccuracy: true, timeout: 3000, maximumAge: 1000 }
  );
}

function mostrarPasoActual() {
  if (Estado.pasos.length === 0) return;
  
  const paso = Estado.pasos[Estado.indiceActual];
  const icono = obtenerIconoInstruccion(paso.instruccion);
  
  document.getElementById("pasoActual").innerHTML =
    `${icono} ${paso.instruccion} <span style="color:#666">(${paso.distancia})</span>`;
  document.getElementById("pasoActual").style.display = "block";
}

function verificarSiguientePaso(lat, lng) {
  if (Estado.indiceActual >= Estado.pasos.length - 1) return;
  
  const siguiente = Estado.pasos[Estado.indiceActual + 1];
  const distancia = google.maps.geometry.spherical.computeDistanceBetween(
    new google.maps.LatLng(lat, lng),
    new google.maps.LatLng(siguiente.lat, siguiente.lng)
  );
  
  if (distancia < CONFIG.DISTANCIA_PASO) {
    Estado.indiceActual++;
    mostrarPasoActual();
  }
}

function obtenerIconoInstruccion(texto) {
  const lower = texto.toLowerCase();
  if (lower.includes("izquierda")) return "⬅";
  if (lower.includes("derecha")) return "➡";
  if (lower.includes("continúe") || lower.includes("siga")) return "⬆";
  if (lower.includes("recto")) return "⬆";
  if (lower.includes("u")) return "🔄";
  if (lower.includes("salida")) return "↗";
  return "➡";
}

function detenerSeguimiento() {
  if (Estado.watchId) {
    navigator.geolocation.clearWatch(Estado.watchId);
    Estado.watchId = null;
  }
  document.getElementById("pasoActual").style.display = "none";
}

// ========== RECONOCIMIENTO DE VOZ ==========
function inicializarReconocimientoVoz() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('Reconocimiento de voz no soportado');
    const btnVoz = document.getElementById('btnVoz');
    if (btnVoz) btnVoz.style.display = 'none';
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  Estado.reconocimiento = new SpeechRecognition();
  
  Estado.reconocimiento.continuous = false;
  Estado.reconocimiento.interimResults = false;
  Estado.reconocimiento.lang = 'es-CO';
  Estado.reconocimiento.maxAlternatives = 1;

  Estado.reconocimiento.onstart = () => {
    Estado.reconocimientoActivo = true;
    actualizarEstadoBotonVoz(true);
    mostrarEstadoVoz('Escuchando...', 'info');
  };

  Estado.reconocimiento.onresult = (event) => {
    const comando = event.results[0][0].transcript.toLowerCase().trim();
    procesarComandoVoz(comando);
  };

  Estado.reconocimiento.onerror = (event) => {
    const mensajes = {
      'no-speech': 'No se detectó voz',
      'network': 'Error de conexión',
      'not-allowed': 'Permiso denegado'
    };
    mostrarEstadoVoz(mensajes[event.error] || 'Error: ' + event.error, 'error');
  };

  Estado.reconocimiento.onend = () => {
    Estado.reconocimientoActivo = false;
    actualizarEstadoBotonVoz(false);
    setTimeout(() => {
      document.getElementById('estadoVoz').style.display = 'none';
    }, 2000);
  };
}

function manejarBotonVoz() {
  if (!Estado.reconocimiento) {
    inicializarReconocimientoVoz();
  }
  
  if (!Estado.reconocimientoActivo) {
    Estado.reconocimiento.start();
  } else {
    Estado.reconocimiento.stop();
  }
}

function actualizarEstadoBotonVoz(escuchando) {
  const btn = document.getElementById('btnVoz');
  const icono = document.getElementById('iconoVoz');
  
  if (escuchando) {
    btn.classList.add('escuchando');
    icono.textContent = '🔴';
  } else {
    btn.classList.remove('escuchando');
    icono.textContent = '🎤';
  }
}

function procesarComandoVoz(texto) {
  mostrarEstadoVoz(`Procesando: "${texto}"`, 'procesando');
  
  const patrones = [
    /(?:quiero ir|ir|ruta|como llegar) a (.+?)(?: en | a | por | usando )?(bici|bicicleta|caminar|caminando|pie|auto|carro|moto)?$/i,
    /(?:quiero ir|ir|ruta|como llegar) a (.+)$/i
  ];
  
  let destino = null;
  let modoTexto = null;
  
  for (const patron2 of patrones) {
    const match = texto.match(patron2);
    if (match) {
      destino = match[1].trim();
      modoTexto = match[2] ? match[2].trim() : null;
      break;
    }
  }
  
  if (!destino) {
    mostrarEstadoVoz('No entendí el destino. Intenta: "Ir a Pasto en bici"', 'error');
    return;
  }
  
  const modo = obtenerModoTransporte(modoTexto);
  prepararRutaVoz(destino, modo);
}

function obtenerModoTransporte(modoTexto) {
  if (!modoTexto) return 'DRIVING';
  
  const modosMap = {
    'bici': 'BICYCLING',
    'bicicleta': 'BICYCLING',
    'caminar': 'WALKING',
    'caminando': 'WALKING',
    'pie': 'WALKING',
    'auto': 'DRIVING',
    'carro': 'DRIVING',
    'moto': 'DRIVING'
  };
  
  for (const [clave, valor] of Object.entries(modosMap)) {
    if (modoTexto.includes(clave)) {
      return valor;
    }
  }
  
  return 'DRIVING';
}

function prepararRutaVoz(destinoTexto, modo) {
  const geocoder = new google.maps.Geocoder();
  
  geocoder.geocode({ 
    address: destinoTexto + ', Nariño, Colombia',
    bounds: Estado.LIMITES_NARINO,
    componentRestrictions: { country: 'co' }
  }, (results, status) => {
    if (status === 'OK' && results.length > 0) {
      const lugar = results[0];
      const latLng = new google.maps.LatLng(
        lugar.geometry.location.lat(),
        lugar.geometry.location.lng()
      );
      
      if (Estado.LIMITES_NARINO.contains(latLng)) {
        document.getElementById('destino').value = lugar.formatted_address;
        document.getElementById('modo').value = modo;
        
        if (!Estado.origenActual) {
          mostrarEstadoVoz('🔍 Obteniendo tu ubicación...', 'info');
          obtenerUbicacionInicial();
          setTimeout(() => buscarRuta(), 1000);
        } else {
          mostrarEstadoVoz(`🚀 Buscando ruta a ${destinoTexto}...`, 'info');
          setTimeout(() => buscarRuta(), 500);
        }
      } else {
        mostrarEstadoVoz('❌ El destino no está en Nariño', 'error');
      }
    } else {
      mostrarEstadoVoz(`❌ No se encontró "${destinoTexto}"`, 'error');
    }
  });
}

function mostrarEstadoVoz(mensaje, tipo) {
  const estado = document.getElementById('estadoVoz');
  estado.textContent = mensaje;
  estado.style.display = 'block';
  
  const colores = {
    'error': '#d32f2f',
    'exito': '#388E3C',
    'info': '#1976D2',
    'procesando': '#F57C00'
  };
  
  estado.style.color = colores[tipo] || '#1976D2';
  
  if (tipo !== 'procesando' || !mensaje.includes('Buscando')) {
    setTimeout(() => {
      if (estado.textContent === mensaje) {
        estado.style.display = 'none';
      }
    }, tipo === 'error' ? 4000 : 3000);
  }
}