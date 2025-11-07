// ========== VARIABLES GLOBALES ==========
let map;
let directionsRenderer;
let directionsService;
let origenActual = null;
let pasos = [];
let indiceActual = 0;
let watchId = null;
let rutaActiva = false;
let LIMITES_NARIÑO = null;
let markerUbicacion = null;
let puntos = []; // Puntos personalizados guardados
let modoAgregarPunto = false; // Estado del modo
let puntoSeleccionado = null; // Punto que abrió el modal

const CENTRO_PASTO = { lat: 1.213, lng: -77.278 };

// ========== TRANSICIÓN DE CARGA (3 SEGUNDOS) ==========
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    const contenedor = document.getElementById('contenedor');
    
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      contenedor.style.opacity = '1';
      contenedor.style.pointerEvents = 'auto';
      
      if (map && typeof google !== 'undefined') {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(CENTRO_PASTO);
      }
    }, 500);
  }, 3000);
});

// ========== GUARDAR Y CARGAR PUNTOS DESDE LOCALSTORAGE ==========
function guardarPuntosEnStorage() {
  localStorage.setItem('puntosNariño', JSON.stringify(puntos));
}

function cargarPuntosDesdeStorage() {
  const puntosGuardados = localStorage.getItem('puntosNariño');
  if (puntosGuardados) {
    puntos = JSON.parse(puntosGuardados);
    // Crear marcadores para los puntos guardados
    puntos.forEach(punto => {
      crearMarcadorPunto(punto);
    });
  }
}

function crearMarcadorPunto(punto) {
  const marcador = new google.maps.Marker({
    position: { lat: punto.lat, lng: punto.lng },
    map: map,
    title: punto.nombre,
    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    label: {
      text: punto.nombre,
      color: "#0066cc",
      fontSize: "12px",
      fontWeight: "bold",
      className: "punto-label"
    }
  });
  
  marcador.addListener("dblclick", () => {
    abrirModalPunto(punto);
  });
  
  punto.marcador = marcador;
  return marcador;
}

// ========== INICIALIZACIÓN DEL MAPA ==========
function initMap() {
  LIMITES_NARIÑO = new google.maps.LatLngBounds(
    { lat: 0.7, lng: -78.5 },
    { lat: 1.8, lng: -76.8 }
  );

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: CENTRO_PASTO,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    restriction: {
      latLngBounds: LIMITES_NARIÑO,
      strictBounds: false
    }
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: false });
  directionsRenderer.setMap(map);

  const opcionesNariño = {
    types: ["geocode"],
    componentRestrictions: { country: "co" },
    bounds: LIMITES_NARIÑO,
    strictBounds: true
  };

  const autoOrigen = new google.maps.places.Autocomplete(document.getElementById("origen"), opcionesNariño);
  const autoDestino = new google.maps.places.Autocomplete(document.getElementById("destino"), opcionesNariño);

  autoOrigen.addListener('place_changed', () => {
    const lugar = autoOrigen.getPlace();
    validarYLimpiar(lugar, 'origen', 'error-origen');
  });

  autoDestino.addListener('place_changed', () => {
    const lugar = autoDestino.getPlace();
    validarYLimpiar(lugar, 'destino', 'error-destino');
  });

  // Botón de "Mi ubicación"
  const miUbicBtn = document.createElement("button");
  miUbicBtn.textContent = "📍 Mi ubicación";
  miUbicBtn.style.marginTop = "4px";
  miUbicBtn.onclick = ponerMiUbicacion;
  document.getElementById("panel").appendChild(miUbicBtn);

  // Botón para agregar puntos (TEMPORAL)
  const btnAgregarPunto = document.getElementById("btnAgregarPunto");
  btnAgregarPunto.addEventListener('click', toggleModoAgregarPunto);

  // Evento clic en el mapa
  map.addListener("click", (e) => {
    if (modoAgregarPunto) {
      agregarPuntoPersonalizado(e.latLng);
    }
  });

  // Doble clic para origen/destino
  map.addListener("dblclick", (e) => {
    if (rutaActiva || modoAgregarPunto) return;
    
    if (!LIMITES_NARIÑO.contains(e.latLng)) {
      alert("⚠️ Por favor, seleccioná una ubicación dentro del departamento de Nariño, Colombia.");
      return;
    }
    
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    if (!origenActual) {
      origenActual = pos;
      colocarOrigenClic(pos);
    } else {
      document.getElementById("destino").value = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
      map.setCenter(pos);
      map.setZoom(16);
    }
  });

  // CARGAR PUNTOS GUARDADOS AL INICIAR
  cargarPuntosDesdeStorage();

  ponerMiUbicacion();
}

// ========== MODO AGREGAR PUNTO (TEMPORAL) ==========
function toggleModoAgregarPunto() {
  modoAgregarPunto = !modoAgregarPunto;
  const btn = document.getElementById("btnAgregarPunto");
  
  if (modoAgregarPunto) {
    btn.textContent = "❌ Cancelar";
    btn.classList.add("activo");
    map.setOptions({ draggableCursor: 'crosshair' });
  } else {
    btn.textContent = "📍 Agregar Punto";
    btn.classList.remove("activo");
    map.setOptions({ draggableCursor: null });
  }
}

// ========== AGREGAR PUNTO PERSONALIZADO ==========
function agregarPuntoPersonalizado(latLng) {
  if (!LIMITES_NARIÑO.contains(latLng)) {
    alert("⚠️ Solo se pueden agregar puntos dentro de Nariño, Colombia.");
    toggleModoAgregarPunto(); // Salir del modo
    return;
  }

  const nombre = prompt("Nombre del punto:");
  if (!nombre || nombre.trim() === "") {
    toggleModoAgregarPunto(); // Salir del modo si cancela
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

  puntos.push(punto);
  
  // GUARDAR EN LOCALSTORAGE
  guardarPuntosEnStorage();

  // Crear marcador
  crearMarcadorPunto(punto);

  // Volver al modo normal
  toggleModoAgregarPunto();
  
  alert(`✅ Punto "${punto.nombre}" agregado correctamente`);
}

// ========== MODAL PARA MENÚ DE PUNTO ==========
function abrirModalPunto(punto) {
  puntoSeleccionado = punto;
  const modal = document.getElementById("modalPunto");
  const titulo = document.getElementById("modalTitulo");
  
  titulo.textContent = punto.nombre;
  
  // Cargar datos si existen
  document.getElementById("fotoPunto").value = "";
  document.getElementById("preguntaPunto").value = punto.pregunta || "";
  
  modal.style.display = "block";
}

// Cerrar modal
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById("modalPunto");
  const cerrar = document.querySelector(".modal-cerrar");
  
  if (cerrar) {
    cerrar.onclick = () => {
      modal.style.display = "none";
    };
  }
  
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
});

// ========== FUNCIONES DEL MODAL ==========
function verCategoria(categoria) {
  // Aquí iría la lógica para mostrar hoteles, restaurantes o eventos
  alert(`Mostrando ${categoria} para: ${puntoSeleccionado.nombre}`);
}

function guardarInfoPunto() {
  if (!puntoSeleccionado) return;
  
  const pregunta = document.getElementById("preguntaPunto").value;
  const fotoInput = document.getElementById("fotoPunto");
  
  puntoSeleccionado.pregunta = pregunta;
  
  // Manejar foto (guardar referencia)
  if (fotoInput.files && fotoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      puntoSeleccionado.foto = e.target.result;
      guardarPuntosEnStorage(); // GUARDAR CAMBIOS
      alert("✅ Información guardada correctamente");
      document.getElementById("modalPunto").style.display = "none";
    };
    reader.readAsDataURL(fotoInput.files[0]);
  } else {
    guardarPuntosEnStorage(); // GUARDAR CAMBIOS
    alert("✅ Información guardada correctamente");
    document.getElementById("modalPunto").style.display = "none";
  }
}

// ========== ELIMINAR PUNTO ACTUAL ==========
function eliminarPuntoActual() {
  if (!puntoSeleccionado) {
    alert("❌ No hay punto seleccionado");
    return;
  }
  
  // Confirmación de eliminación
  const confirmar = confirm(`¿Estás seguro que querés eliminar el punto "${puntoSeleccionado.nombre}"?`);
  if (!confirmar) return;
  
  // Eliminar marcador del mapa
  if (puntoSeleccionado.marcador) {
    puntoSeleccionado.marcador.setMap(null);
  }
  
  // Eliminar del array de puntos
  puntos = puntos.filter(p => p.id !== puntoSeleccionado.id);
  
  // Guardar cambios en localStorage
  guardarPuntosEnStorage();
  
  // Cerrar modal
  document.getElementById("modalPunto").style.display = "none";
  
  alert(`✅ Punto "${puntoSeleccionado.nombre}" eliminado correctamente`);
}

// ========== RESTO DE FUNCIONES ==========
function validarYLimpiar(lugar, campo, errorId) {
  const errorDiv = document.getElementById(errorId);
  errorDiv.style.display = 'none';
  
  if (!lugar.geometry) {
    errorDiv.textContent = "No se pudo obtener la ubicación";
    errorDiv.style.display = 'block';
    document.getElementById(campo).value = '';
    return;
  }

  const lat = lugar.geometry.location.lat();
  const lng = lugar.geometry.location.lng();
  const latLng = new google.maps.LatLng(lat, lng);

  if (!LIMITES_NARIÑO.contains(latLng)) {
    errorDiv.textContent = "⚠️ Solo se permiten ubicaciones en el departamento de Nariño, Colombia";
    errorDiv.style.display = 'block';
    document.getElementById(campo).value = '';
    return;
  }

  let esNariño = false;
  if (lugar.address_components) {
    for (let component of lugar.address_components) {
      if (component.types.includes("administrative_area_level_1") && 
          component.long_name.toLowerCase().includes("nariño")) {
        esNariño = true;
        break;
      }
    }
  }

  if (!esNariño) {
    errorDiv.textContent = "⚠️ Solo ubicaciones en Nariño permitidas";
    errorDiv.style.display = 'block';
    document.getElementById(campo).value = '';
  }
}

function colocarOrigenClic(pos) {
  document.getElementById("origen").value = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
  new google.maps.Marker({
    position: pos,
    map: map,
    title: "Origen doble clic",
    icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
  });
  map.setCenter(pos);
  map.setZoom(16);
}

function ponerMiUbicacion() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const pos = { lat, lng };
        const userLatLng = new google.maps.LatLng(lat, lng);
        
        if (!LIMITES_NARIÑO || !LIMITES_NARIÑO.contains(userLatLng)) {
          alert("⚠️ Tu ubicación actual no está en el departamento de Nariño. Por favor, ingresá una ubicación manualmente.");
          return;
        }
        
        if (markerUbicacion) {
          markerUbicacion.setMap(null);
        }
        
        markerUbicacion = new google.maps.Marker({
          position: pos,
          map: map,
          title: "Tu ubicación",
          icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        });
        
        new google.maps.Geocoder().geocode({ location: pos }, (results, status) => {
          if (status === "OK" && results[0]) {
            const direccion = results[0].formatted_address;
            document.getElementById("origen").value = `${direccion} (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
          } else {
            document.getElementById("origen").value = `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          }
        });
        
        map.setCenter(pos);
        map.setZoom(18);
      },
      (error) => {
        let mensaje = "No se pudo obtener tu ubicación";
        if (error.code === error.PERMISSION_DENIED) {
          mensaje = "⚠️ Permiso de geolocalización denegado.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          mensaje = "⚠️ Información de ubicación no disponible.";
        } else if (error.code === error.TIMEOUT) {
          mensaje = "⚠️ La solicitud de ubicación expiró.";
        }
        alert(mensaje);
      },
      { 
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  } else {
    alert("Tu navegador no soporta geolocalización");
  }
}

function buscarRuta() {
  const origenTexto = document.getElementById("origen").value.trim();
  const destinoTexto = document.getElementById("destino").value.trim();
  const modo = document.getElementById("modo").value;

  if (!origenTexto || !destinoTexto) {
    alert("Completá origen y destino");
    return;
  }

  directionsService.route(
    {
      origin: origenTexto,
      destination: destinoTexto,
      travelMode: google.maps.TravelMode[modo],
      unitSystem: google.maps.UnitSystem.METRIC,
      language: "es-419",
    },
    (result, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(result);
        const leg = result.routes[0].legs[0];
        const tiempo = leg.duration.text;
        const distancia = leg.distance.text;
        document.getElementById("resultado").innerHTML =
          `<b>Llegás en ${tiempo}</b><br>Distancia: ${distancia}`;
        iniciarSeguimientoDePasos(result.routes[0].legs);
        rutaActiva = true;
      } else {
        document.getElementById("resultado").innerHTML = "No se encontró la ruta.";
        detenerSeguimiento();
        rutaActiva = false;
      }
    }
  );
}

function borrarRuta() {
  directionsRenderer.setDirections({ routes: [] });
  detenerSeguimiento();
  rutaActiva = false;
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("destino").value = "";
  document.getElementById("error-origen").style.display = 'none';
  document.getElementById("error-destino").style.display = 'none';
  
  if (markerUbicacion) {
    markerUbicacion.setMap(null);
    markerUbicacion = null;
  }
}

function iniciarSeguimientoDePasos(legs) {
  pasos = [];
  legs.forEach((leg) => {
    leg.steps.forEach((step) => {
      pasos.push({
        lat: step.end_location.lat(),
        lng: step.end_location.lng(),
        instruccion: step.instructions,
        distancia: step.distance.text,
      });
    });
  });
  indiceActual = 0;
  mostrarPasoActual();

  if (watchId) navigator.geolocation.clearWatch(watchId);
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;
      verificarSiguientePaso(userLat, userLng);
    },
    () => {},
    { enableHighAccuracy: true, timeout: 3000, maximumAge: 1000 }
  );
}

function mostrarPasoActual() {
  if (pasos.length === 0) return;
  const paso = pasos[indiceActual];
  const icono = iconoDeInstruccion(paso.instruccion);
  document.getElementById("pasoActual").innerHTML =
    `${icono} ${paso.instruccion} <span style="color:#666">(${paso.distancia})</span>`;
  document.getElementById("pasoActual").style.display = "block";
}

function verificarSiguientePaso(lat, lng) {
  if (indiceActual >= pasos.length - 1) return;
  const siguiente = pasos[indiceActual + 1];
  const dist = google.maps.geometry.spherical.computeDistanceBetween(
    new google.maps.LatLng(lat, lng),
    new google.maps.LatLng(siguiente.lat, siguiente.lng)
  );
  if (dist < 50) {
    indiceActual++;
    mostrarPasoActual();
  }
}

function iconoDeInstruccion(text) {
  const lower = text.toLowerCase();
  if (lower.includes("izquierda")) return "⬅";
  if (lower.includes("derecha")) return "➡";
  if (lower.includes("continúe") || lower.includes("siga")) return "⬆";
  if (lower.includes("recto")) return "⬆";
  if (lower.includes("u")) return "🔄";
  if (lower.includes("salida")) return "↗";
  return "➡";
}

function detenerSeguimiento() {
  if (watchId) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  document.getElementById("pasoActual").style.display = "none";
}

// ========== INSTRUCCIONES PARA DESACTIVAR AL FINAL ==========
/*
Para desactivar la opción de agregar puntos cuando termines:
1. En CSS, oculta el botón:
   #btnAgregarPunto { display: none !important; }

2. En app.js, comenta estas líneas:
   - map.addListener("click", (e) => { ... });
   - btnAgregarPunto.addEventListener('click', toggleModoAgregarPunto);
   
Los puntos guardados en localStorage permanecerán visibles siempre.
*/