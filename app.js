// ========== CONFIGURACIÓN Y CONSTANTES ==========
const CONFIG = {
  CENTRO_PASTO: { lat: 1.2136, lng: -77.2811 },
  LIMITES_NARINO: {
    southwest: { lat: 0.5, lng: -78.9 },  // Más amplio
    northeast: { lat: 2.0, lng: -76.5 }   // Más amplio
  },
  DISTANCIA_PASO: 50, // metros para cambiar instrucción
  ZOOM_UBICACION: 18,
  ZOOM_INICIAL: 14,
  MODO_DEBUG: true // Para ver coordenadas en consola
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
  rutaPreparada: false, // Nueva bandera para saber si hay ruta lista
  LIMITES_NARINO: null,
  markerUbicacion: null,
  puntos: [], // Almacenamiento en memoria
  modoAgregarPunto: false,
  puntoSeleccionado: null,
  reconocimiento: null,
  reconocimientoActivo: false
};

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
  }, 3000);
}

function configurarEventListeners() {
  document.getElementById('btnAgregarPunto')?.addEventListener('click', toggleModoAgregarPunto);
  document.getElementById('btnVoz')?.addEventListener('click', manejarBotonVoz);
  document.getElementById('btnMiUbicacion')?.addEventListener('click', actualizarMiUbicacion);
  document.querySelector('.modal-cerrar')?.addEventListener('click', cerrarModal);
  
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('modalPunto');
    if (e.target === modal) cerrarModal();
  });
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
  configurarEventosMapa();
  inicializarReconocimientoVoz();
  cargarPuntosGuardados();
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

function configurarEventosMapa() {
  // Clic simple para agregar puntos
  Estado.map.addListener("click", (e) => {
    if (Estado.modoAgregarPunto) {
      agregarPuntoPersonalizado(e.latLng);
    }
  });

  // Doble clic para establecer origen/destino
  Estado.map.addListener("dblclick", (e) => {
    if (Estado.rutaActiva || Estado.modoAgregarPunto) return;
    
    if (!Estado.LIMITES_NARINO.contains(e.latLng)) {
      mostrarError("Selecciona una ubicación dentro de Nariño, Colombia.");
      return;
    }
    
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    
    if (!Estado.origenActual) {
      establecerOrigen(pos);
    } else {
      establecerDestino(pos);
    }
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
      
      // Debug: mostrar coordenadas en consola
      if (CONFIG.MODO_DEBUG) {
        console.log('📍 Tu ubicación:', pos);
        console.log('📏 Límites Nariño:', CONFIG.LIMITES_NARINO);
      }
      
      const userLatLng = new google.maps.LatLng(pos.lat, pos.lng);
      
      if (!Estado.LIMITES_NARINO.contains(userLatLng)) {
        console.warn('⚠️ Ubicación fuera de límites:', pos);
        // Permitir de todos modos si estás cerca
        const distanciaPasto = google.maps.geometry.spherical.computeDistanceBetween(
          userLatLng,
          new google.maps.LatLng(CONFIG.CENTRO_PASTO.lat, CONFIG.CENTRO_PASTO.lng)
        );
        
        if (distanciaPasto < 100000) { // 100km de Pasto
          console.log('✅ Dentro de radio de 100km de Pasto');
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
  
  // Geocodificar para mostrar dirección legible
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

function establecerOrigen(pos) {
  Estado.origenActual = pos;
  document.getElementById("origen").value = 
    `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
  
  new google.maps.Marker({
    position: pos,
    map: Estado.map,
    title: "Origen",
    icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
  });
  
  Estado.map.setCenter(pos);
  Estado.map.setZoom(16);
}

function establecerDestino(pos) {
  document.getElementById("destino").value = 
    `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
  Estado.map.setCenter(pos);
  Estado.map.setZoom(16);
}

function manejarErrorGeolocalizacion(error) {
  const mensajes = {
    [error.PERMISSION_DENIED]: "Permiso de geolocalización denegado.",
    [error.POSITION_UNAVAILABLE]: "Información de ubicación no disponible.",
    [error.TIMEOUT]: "La solicitud de ubicación expiró."
  };
  
  mostrarError(mensajes[error.code] || "No se pudo obtener tu ubicación");
}

// Función para actualizar ubicación manualmente (botón "Mi ubicación")
function actualizarMiUbicacion() {
  if (!navigator.geolocation) {
    mostrarError("Tu navegador no soporta geolocalización");
    return;
  }

  // Mostrar feedback visual
  const btn = document.getElementById('btnMiUbicacion');
  const textoOriginal = btn ? btn.textContent : '';
  if (btn) btn.textContent = '🔄 Obteniendo...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // Debug
      if (CONFIG.MODO_DEBUG) {
        console.log('📍 Ubicación actualizada:', pos);
      }
      
      const userLatLng = new google.maps.LatLng(pos.lat, pos.lng);
      
      // Validación más flexible
      if (!Estado.LIMITES_NARINO.contains(userLatLng)) {
        const distanciaPasto = google.maps.geometry.spherical.computeDistanceBetween(
          userLatLng,
          new google.maps.LatLng(CONFIG.CENTRO_PASTO.lat, CONFIG.CENTRO_PASTO.lng)
        );
        
        if (distanciaPasto < 100000) { // 100km de Pasto
          console.log('✅ Ubicación aceptada (cerca de Pasto)');
          establecerUbicacionActual(pos);
          if (btn) btn.textContent = textoOriginal;
          return;
        }
        
        mostrarError("Tu ubicación no está en Nariño. Ingresa un origen manualmente.");
        if (btn) btn.textContent = textoOriginal;
        return;
      }
      
      establecerUbicacionActual(pos);
      if (btn) btn.textContent = textoOriginal;
    },
    (error) => {
      manejarErrorGeolocalizacion(error);
      if (btn) btn.textContent = textoOriginal;
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

  // Validar componente administrativo
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
        Estado.rutaPreparada = false;
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
  
  // Mostrar mensaje de éxito en el estado de voz
  mostrarEstadoVoz(`✅ Ruta encontrada: ${leg.duration.text}`, 'exito');
  
  iniciarSeguimientoDePasos(result.routes[0].legs);
  Estado.rutaActiva = true;
  Estado.rutaPreparada = false;
}

function borrarRuta() {
  Estado.directionsRenderer.setDirections({ routes: [] });
  detenerSeguimiento();
  
  Estado.rutaActiva = false;
  Estado.rutaPreparada = false;
  
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
  
  for (const patron of patrones) {
    const match = texto.match(patron);
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
        // Establecer destino y modo
        document.getElementById('destino').value = lugar.formatted_address;
        document.getElementById('modo').value = modo;
        
        // Si no hay origen, establecerlo primero
        if (!Estado.origenActual) {
          mostrarEstadoVoz('🔍 Obteniendo tu ubicación...', 'info');
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              establecerUbicacionActual(pos);
              
              // Esperar un momento y buscar la ruta automáticamente
              setTimeout(() => {
                mostrarEstadoVoz(`🚀 Buscando ruta a ${destinoTexto}...`, 'info');
                buscarRuta();
              }, 500);
            },
            () => {
              mostrarEstadoVoz('❌ No se pudo obtener tu ubicación', 'error');
            }
          );
        } else {
          // Si ya hay origen, buscar ruta directamente
          mostrarEstadoVoz(`🚀 Buscando ruta a ${destinoTexto}...`, 'info');
          setTimeout(() => {
            buscarRuta();
          }, 500);
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
  
  // Tiempo de espera según el tipo
  const tiempos = {
    'error': 4000,
    'exito': 3000,
    'info': 2000,
    'procesando': 10000 // Más tiempo para procesos largos
  };
  
  // Auto-ocultar después del tiempo correspondiente
  // No ocultar si es 'info' de búsqueda (se ocultará cuando termine)
  if (tipo !== 'procesando' || !mensaje.includes('Buscando')) {
    setTimeout(() => {
      // Solo ocultar si el mensaje no ha cambiado
      if (estado.textContent === mensaje) {
        estado.style.display = 'none';
      }
    }, tiempos[tipo] || 3000);
  }
}

// ========== GESTIÓN DE PUNTOS PERSONALIZADOS ==========
function toggleModoAgregarPunto() {
  Estado.modoAgregarPunto = !Estado.modoAgregarPunto;
  const btn = document.getElementById("btnAgregarPunto");
  
  if (Estado.modoAgregarPunto) {
    btn.textContent = "❌ Cancelar";
    btn.classList.add("activo");
    Estado.map.setOptions({ draggableCursor: 'crosshair' });
  } else {
    btn.textContent = "📍 Agregar Punto";
    btn.classList.remove("activo");
    Estado.map.setOptions({ draggableCursor: null });
  }
}

function agregarPuntoPersonalizado(latLng) {
  if (!Estado.LIMITES_NARINO.contains(latLng)) {
    mostrarError("Solo se pueden agregar puntos dentro de Nariño, Colombia.");
    toggleModoAgregarPunto();
    return;
  }

  const nombre = prompt("Nombre del punto:");
  if (!nombre || nombre.trim() === "") {
    toggleModoAgregarPunto();
    return;
  }

  const punto = {
    id: Date.now(),
    nombre: nombre.trim(),
    lat: latLng.lat(),
    lng: latLng.lng(),
    foto: null,
    pregunta: null
  };

  Estado.puntos.push(punto);
  crearMarcadorPunto(punto);
  toggleModoAgregarPunto();
  
  mostrarError(`Punto "${punto.nombre}" agregado correctamente`);
}

function crearMarcadorPunto(punto) {
  const marcador = new google.maps.Marker({
    position: { lat: punto.lat, lng: punto.lng },
    map: Estado.map,
    title: punto.nombre,
    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    label: {
      text: punto.nombre,
      color: "#0066cc",
      fontSize: "12px",
      fontWeight: "bold"
    }
  });
  
  marcador.addListener("dblclick", () => {
    abrirModalPunto(punto);
  });
  
  punto.marcador = marcador;
  return marcador;
}

function cargarPuntosGuardados() {
  // En memoria - los puntos ya están en Estado.puntos
  Estado.puntos.forEach(punto => {
    crearMarcadorPunto(punto);
  });
}

// ========== MODAL DE PUNTOS ==========
function abrirModalPunto(punto) {
  Estado.puntoSeleccionado = punto;
  const modal = document.getElementById("modalPunto");
  const titulo = document.getElementById("modalTitulo");
  
  titulo.textContent = punto.nombre;
  document.getElementById("fotoPunto").value = "";
  document.getElementById("preguntaPunto").value = punto.pregunta || "";
  
  modal.style.display = "block";
}

function cerrarModal() {
  document.getElementById("modalPunto").style.display = "none";
}

function verCategoria(categoria) {
  alert(`Mostrando ${categoria} para: ${Estado.puntoSeleccionado.nombre}`);
}

function guardarInfoPunto() {
  if (!Estado.puntoSeleccionado) return;
  
  const pregunta = document.getElementById("preguntaPunto").value;
  const fotoInput = document.getElementById("fotoPunto");
  
  Estado.puntoSeleccionado.pregunta = pregunta;
  
  if (fotoInput.files && fotoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      Estado.puntoSeleccionado.foto = e.target.result;
      alert("✅ Información guardada correctamente");
      cerrarModal();
    };
    reader.readAsDataURL(fotoInput.files[0]);
  } else {
    alert("✅ Información guardada correctamente");
    cerrarModal();
  }
}

function eliminarPuntoActual() {
  if (!Estado.puntoSeleccionado) {
    mostrarError("No hay punto seleccionado");
    return;
  }
  
  const confirmar = confirm(
    `¿Estás seguro que querés eliminar el punto "${Estado.puntoSeleccionado.nombre}"?`
  );
  
  if (!confirmar) return;
  
  if (Estado.puntoSeleccionado.marcador) {
    Estado.puntoSeleccionado.marcador.setMap(null);
  }
  
  Estado.puntos = Estado.puntos.filter(p => p.id !== Estado.puntoSeleccionado.id);
  cerrarModal();
  
  alert(`✅ Punto "${Estado.puntoSeleccionado.nombre}" eliminado correctamente`);
}