/* =====================================================
   TRANSPORTES CHATITA
   Archivo: js/main.js
   Autor: Milton Ariel Luna Morales
   Curso: Programación 3

   Implementación manual de:
     - Grafo ponderado con lista de adyacencia
     - BFS (Breadth First Search)
     - DFS (Depth First Search)
     - Dijkstra (Ruta más corta)
     - Visualización en Canvas HTML5
   ===================================================== */

/* =========================================================================
   CLASE NODO — Representa una ciudad del grafo
   ========================================================================= */
class NodoCiudad {
  constructor(codigo, nombre, dpto, poblacion) {
    this.codigo    = codigo.toUpperCase();
    this.nombre    = nombre;
    this.dpto      = dpto;
    this.poblacion = Number(poblacion) || 0;

    // Lista de adyacencia: vecinos con su distancia y tipo de vía
    // Cada vecino es un objeto: { codigo, distancia, tipo }
    this.vecinos = [];

    // Posición en el canvas para visualización
    this.x = 0;
    this.y = 0;
  }
}

/* =========================================================================
   CLASE GRAFO — Lista de Adyacencia implementada manualmente
   ========================================================================= */
class GrafoCiudades {

  constructor() {
    // Usamos un Map para guardar nodos con su código como llave
    // Map es una estructura clave-valor eficiente para búsquedas O(1)
    this.nodos = new Map();
  }

  /* ------------------------------------------------------------------
     MÉTODOS CRUD — CIUDADES
     ------------------------------------------------------------------ */

  // Agrega una nueva ciudad al grafo
  agregarCiudad(codigo, nombre, dpto, poblacion) {
    let cod = codigo.toUpperCase();

    // Verificar si ya existe una ciudad con ese código
    if (this.nodos.has(cod)) return false;

    let nodoNuevo = new NodoCiudad(cod, nombre, dpto, poblacion);

    // Asignar posición aleatoria inicial en el área del canvas
    nodoNuevo.x = 80 + Math.random() * 750;
    nodoNuevo.y = 60 + Math.random() * 440;

    this.nodos.set(cod, nodoNuevo);
    return true;
  }

  // Elimina una ciudad y todas sus conexiones del grafo
  eliminarCiudad(codigo) {
    let cod = codigo.toUpperCase();
    if (!this.nodos.has(cod)) return false;

    // Primero eliminamos el nodo del mapa
    this.nodos.delete(cod);

    // Luego recorremos todos los nodos restantes y eliminamos
    // las aristas que apuntaban a la ciudad eliminada
    for (let [, nodo] of this.nodos) {
      nodo.vecinos = nodo.vecinos.filter(v => v.codigo !== cod);
    }

    return true;
  }

  // Modifica la información de una ciudad existente
  modificarCiudad(codigo, nuevoNombre, nuevoDpto, nuevaPob) {
    let cod = codigo.toUpperCase();
    if (!this.nodos.has(cod)) return false;

    let nodo = this.nodos.get(cod);
    if (nuevoNombre && nuevoNombre.trim() !== '') nodo.nombre    = nuevoNombre.trim();
    if (nuevoDpto   && nuevoDpto.trim()   !== '') nodo.dpto      = nuevoDpto.trim();
    if (nuevaPob    && Number(nuevaPob)   >  0)   nodo.poblacion = Number(nuevaPob);

    return true;
  }

  /* ------------------------------------------------------------------
     MÉTODOS CRUD — CONEXIONES (ARISTAS)
     ------------------------------------------------------------------ */

  // Crea una conexión bidireccional entre dos ciudades con un peso (distancia)
  agregarConexion(codOrigen, codDestino, distancia, tipo) {
    let o = codOrigen.toUpperCase();
    let d = codDestino.toUpperCase();

    // Validaciones básicas
    if (!this.nodos.has(o) || !this.nodos.has(d)) return false;
    if (o === d) return false;
    if (Number(distancia) <= 0) return false;

    let nodoO = this.nodos.get(o);
    let nodoD = this.nodos.get(d);

    // Verificar si la conexión ya existe en cualquier dirección
    let existeOD = nodoO.vecinos.find(v => v.codigo === d);
    let existeDO = nodoD.vecinos.find(v => v.codigo === o);

    // Solo agregar si no existe ya
    if (!existeOD) nodoO.vecinos.push({ codigo: d, distancia: Number(distancia), tipo: tipo || 'pavimentada' });
    if (!existeDO) nodoD.vecinos.push({ codigo: o, distancia: Number(distancia), tipo: tipo || 'pavimentada' });

    return true;
  }

  // Elimina la conexión entre dos ciudades en ambas direcciones
  eliminarConexion(codOrigen, codDestino) {
    let o = codOrigen.toUpperCase();
    let d = codDestino.toUpperCase();

    if (!this.nodos.has(o) || !this.nodos.has(d)) return false;

    // Filtrar el vecino en ambas listas de adyacencia
    this.nodos.get(o).vecinos = this.nodos.get(o).vecinos.filter(v => v.codigo !== d);
    this.nodos.get(d).vecinos = this.nodos.get(d).vecinos.filter(v => v.codigo !== o);

    return true;
  }

  // Modifica la distancia de una conexión existente
  modificarConexion(codOrigen, codDestino, nuevaDist, nuevoTipo) {
    let o = codOrigen.toUpperCase();
    let d = codDestino.toUpperCase();

    if (!this.nodos.has(o) || !this.nodos.has(d)) return false;

    // Actualizar en la lista del nodo origen
    let vecO = this.nodos.get(o).vecinos.find(v => v.codigo === d);
    if (vecO) {
      vecO.distancia = Number(nuevaDist);
      if (nuevoTipo) vecO.tipo = nuevoTipo;
    }

    // Actualizar en la lista del nodo destino (grafo no dirigido)
    let vecD = this.nodos.get(d).vecinos.find(v => v.codigo === o);
    if (vecD) {
      vecD.distancia = Number(nuevaDist);
      if (nuevoTipo) vecD.tipo = nuevoTipo;
    }

    return !!(vecO || vecD);
  }

  // Retorna todas las conexiones únicas (sin duplicados) del grafo
  obtenerConexiones() {
    let conexiones = [];
    let vistas = new Set(); // Para evitar contar A-B y B-A como dos conexiones

    for (let [cod, nodo] of this.nodos) {
      for (let vec of nodo.vecinos) {
        // Ordenar los códigos para crear una llave única
        let llave = [cod, vec.codigo].sort().join('-');
        if (!vistas.has(llave)) {
          vistas.add(llave);
          conexiones.push({
            origen:    cod,
            destino:   vec.codigo,
            distancia: vec.distancia,
            tipo:      vec.tipo || 'pavimentada'
          });
        }
      }
    }

    return conexiones;
  }

  /* ------------------------------------------------------------------
     ALGORITMO BFS — Búsqueda en Anchura (Breadth First Search)
     Estructura utilizada: COLA (Queue - FIFO)
     Orden de visita: por niveles
     ------------------------------------------------------------------ */
  bfs(codigoInicio) {
    let inicio = codigoInicio.toUpperCase();
    if (!this.nodos.has(inicio)) return null;

    let orden     = []; // Orden en que se visitan los nodos
    let visitados = new Set();
    let cola      = []; // Cola FIFO: usamos push() para encolar y shift() para desencolar
    let pasos     = []; // Registro de pasos para mostrar en pantalla

    // Paso inicial: encolar el nodo de inicio
    visitados.add(inicio);
    cola.push(inicio);
    pasos.push(`[INICIO] Cola inicial: [${inicio}]`);

    // Mientras haya elementos en la cola seguimos recorriendo
    while (cola.length > 0) {

      // Desencolar el primer elemento (FIFO)
      let actual = cola.shift();
      orden.push(actual);

      let nodoActual = this.nodos.get(actual);
      pasos.push(`[VISITAR] ${nodoActual.nombre} (${actual})`);

      // Ordenar vecinos por código para tener un recorrido determinista
      let vecinosOrdenados = [...nodoActual.vecinos].sort((a, b) =>
        a.codigo.localeCompare(b.codigo)
      );

      // Revisar cada vecino del nodo actual
      for (let vec of vecinosOrdenados) {
        if (!visitados.has(vec.codigo)) {
          visitados.add(vec.codigo);
          cola.push(vec.codigo);
          let vecNodo = this.nodos.get(vec.codigo);
          pasos.push(`  → Encolar: ${vecNodo.nombre} (${vec.codigo}) | dist: ${vec.distancia} km`);
        }
      }

      if (cola.length > 0) {
        pasos.push(`  Cola ahora: [${cola.join(' , ')}]`);
      }
    }

    return { orden, pasos, visitados: [...visitados] };
  }

  /* ------------------------------------------------------------------
     ALGORITMO DFS — Búsqueda en Profundidad (Depth First Search)
     Estructura utilizada: PILA (Stack - LIFO)
     Orden de visita: por ramas completas
     ------------------------------------------------------------------ */
  dfs(codigoInicio) {
    let inicio = codigoInicio.toUpperCase();
    if (!this.nodos.has(inicio)) return null;

    let orden     = [];
    let visitados = new Set();
    let pila      = []; // Pila LIFO: usamos push() para apilar y pop() para desapilar
    let pasos     = [];

    pila.push(inicio);
    pasos.push(`[INICIO] Pila inicial: [${inicio}]`);

    while (pila.length > 0) {

      // Desapilar el último elemento (LIFO)
      let actual = pila.pop();

      // Si ya fue visitado, lo saltamos
      if (visitados.has(actual)) {
        pasos.push(`  (${actual} ya visitado, se omite)`);
        continue;
      }

      visitados.add(actual);
      orden.push(actual);

      let nodoActual = this.nodos.get(actual);
      pasos.push(`[VISITAR] ${nodoActual.nombre} (${actual})`);

      // Apilar vecinos en orden inverso para que el primero alfabéticamente
      // sea el último en apilarse y el primero en desapilarse (LIFO)
      let vecinosOrdenados = [...nodoActual.vecinos].sort((a, b) =>
        b.codigo.localeCompare(a.codigo)
      );

      for (let vec of vecinosOrdenados) {
        if (!visitados.has(vec.codigo)) {
          pila.push(vec.codigo);
          let vecNodo = this.nodos.get(vec.codigo);
          pasos.push(`  → Apilar: ${vecNodo.nombre} (${vec.codigo}) | dist: ${vec.distancia} km`);
        }
      }

      if (pila.length > 0) {
        pasos.push(`  Pila ahora: [${pila.join(' , ')}]`);
      }
    }

    return { orden, pasos, visitados: [...visitados] };
  }

  /* ------------------------------------------------------------------
     ALGORITMO DIJKSTRA — Ruta más corta
     Implementación manual con arreglo de distancias y extracción lineal del mínimo
     Complejidad: O(V²) — sin cola de prioridad
     ------------------------------------------------------------------ */
  dijkstra(codigoOrigen, codigoDestino) {
    let origen  = codigoOrigen.toUpperCase();
    let destino = codigoDestino.toUpperCase();

    if (!this.nodos.has(origen) || !this.nodos.has(destino)) return null;

    let codigos      = [...this.nodos.keys()];
    let distancias   = {}; // Distancia acumulada desde el origen a cada nodo
    let predecesores = {}; // Predecesor de cada nodo en la ruta óptima
    let visitados    = new Set();
    let pasos        = [];

    // Paso 1: Inicializar todas las distancias en Infinito
    for (let cod of codigos) {
      distancias[cod]   = Infinity;
      predecesores[cod] = null;
    }
    distancias[origen] = 0; // La distancia al origen es 0
    pasos.push(`[INIT] dist[${origen}] = 0 km | resto de ciudades = ∞`);

    // Repetir hasta que todos los nodos estén visitados
    while (true) {

      // Paso 2: Extraer el nodo no visitado con la menor distancia acumulada
      let actual    = null;
      let menorDist = Infinity;

      for (let cod of codigos) {
        if (!visitados.has(cod) && distancias[cod] < menorDist) {
          menorDist = distancias[cod];
          actual    = cod;
        }
      }

      // Si no hay nodo accesible o llegamos al destino, terminamos
      if (actual === null || actual === destino) break;

      visitados.add(actual);
      let nodoActual = this.nodos.get(actual);
      pasos.push(`[PROCESAR] ${nodoActual.nombre} (dist acumulada: ${distancias[actual]} km)`);

      // Paso 3: Relajar aristas — revisar si podemos mejorar la distancia de los vecinos
      for (let vec of nodoActual.vecinos) {
        if (visitados.has(vec.codigo)) continue;

        let nuevaDist = distancias[actual] + vec.distancia;

        // Si encontramos una ruta más corta, actualizamos
        if (nuevaDist < distancias[vec.codigo]) {
          distancias[vec.codigo]   = nuevaDist;
          predecesores[vec.codigo] = actual;

          let vecNodo = this.nodos.get(vec.codigo);
          pasos.push(`  ✔ Actualizar dist[${vecNodo.nombre}] = ${nuevaDist} km (pasando por ${actual})`);
        }
      }
    }

    // Verificar si el destino es alcanzable
    if (distancias[destino] === Infinity) {
      pasos.push(`[RESULTADO] No existe camino entre ${origen} y ${destino}`);
      return { encontrado: false, pasos };
    }

    // Paso 4: Reconstruir la ruta siguiendo los predecesores desde el destino al origen
    let ruta   = [];
    let actual = destino;

    while (actual !== null) {
      ruta.unshift(actual); // Insertar al inicio para obtener la ruta en orden correcto
      actual = predecesores[actual];
    }

    pasos.push(`[RESULTADO] Ruta óptima encontrada con ${distancias[destino]} km`);

    return {
      encontrado: true,
      ruta,
      distancia:  distancias[destino],
      pasos,
      distancias
    };
  }
}

/* =========================================================================
   INSTANCIA GLOBAL DEL GRAFO
   ========================================================================= */
let grafo = new GrafoCiudades();

/* =========================================================================
   VARIABLES DEL CANVAS — Para visualización del grafo
   ========================================================================= */
let canvas, ctx;
let escala          = 1;
let offsetX         = 0;
let offsetY         = 0;
let arrastrandoNodo = null;  // Código del nodo que se está arrastrando
let arrastrandoCanvas = false;
let ultimoMouse     = { x: 0, y: 0 };

// Variables para resaltar nodos y aristas en animaciones
let nodosResaltados = new Set();  // Nodos visitados por BFS/DFS
let aristasRuta     = [];         // Aristas de la ruta Dijkstra
let nodosRuta       = new Set();  // Nodos de la ruta Dijkstra

/* =========================================================================
   INICIALIZACIÓN AL CARGAR LA PÁGINA
   ========================================================================= */
window.addEventListener('load', () => {
  canvas = document.getElementById('canvasGrafo');
  ctx    = canvas.getContext('2d');

  ajustarTamanioCanvas();
  window.addEventListener('resize', ajustarTamanioCanvas);

  // Registrar eventos del canvas
  canvas.addEventListener('mousedown',  onMouseDown);
  canvas.addEventListener('mousemove',  onMouseMove);
  canvas.addEventListener('mouseup',    onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);
  canvas.addEventListener('wheel',      onRueda, { passive: false });

  // Touch para móviles
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
  canvas.addEventListener('touchend',   onMouseUp);

  dibujarGrafo();
  actualizarEstadisticas();
});

/* =========================================================================
   FUNCIONES DEL CANVAS
   ========================================================================= */

// Ajusta el tamaño del canvas al contenedor
function ajustarTamanioCanvas() {
  if (!canvas) return;
  let contenedor = canvas.parentElement;
  canvas.width   = contenedor.clientWidth;
  canvas.height  = 580;
  dibujarGrafo();
}

// Convierte coordenadas del mouse a coordenadas del canvas
function mouseEnCanvas(e) {
  let rect = canvas.getBoundingClientRect();
  return {
    mx: e.clientX - rect.left,
    my: e.clientY - rect.top
  };
}

/* --- Eventos de Mouse --- */

function onMouseDown(e) {
  let { mx, my } = mouseEnCanvas(e);

  // Revisar si el clic fue sobre algún nodo
  for (let [cod, nodo] of grafo.nodos) {
    let px = nodo.x * escala + offsetX;
    let py = nodo.y * escala + offsetY;
    let dx = px - mx;
    let dy = py - my;
    let distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < 22) {
      arrastrandoNodo = cod; // Guardar el código del nodo que se arrastra
      return;
    }
  }

  // Si no hizo clic en un nodo, iniciar arrastre del canvas
  arrastrandoCanvas = true;
  ultimoMouse = { x: e.clientX, y: e.clientY };
}

function onMouseMove(e) {
  let { mx, my } = mouseEnCanvas(e);

  // Mostrar tooltip al pasar sobre un nodo
  let tooltip   = document.getElementById('tooltip');
  let sobreNodo = false;

  for (let [cod, nodo] of grafo.nodos) {
    let px = nodo.x * escala + offsetX;
    let py = nodo.y * escala + offsetY;
    let dx = px - mx;
    let dy = py - my;

    if (Math.sqrt(dx * dx + dy * dy) < 22) {
      tooltip.style.display = 'block';
      tooltip.style.left    = (e.clientX + 14) + 'px';
      tooltip.style.top     = (e.clientY - 32) + 'px';
      tooltip.textContent   = `${nodo.nombre} | ${nodo.dpto} | ${nodo.vecinos.length} conexiones`;
      sobreNodo = true;
      break;
    }
  }
  if (!sobreNodo) tooltip.style.display = 'none';

  // Mover nodo si se está arrastrando uno
  if (arrastrandoNodo) {
    let nodo = grafo.nodos.get(arrastrandoNodo);
    nodo.x   = (mx - offsetX) / escala;
    nodo.y   = (my - offsetY) / escala;
    dibujarGrafo();
    return;
  }

  // Mover el canvas completo
  if (arrastrandoCanvas) {
    offsetX += e.clientX - ultimoMouse.x;
    offsetY += e.clientY - ultimoMouse.y;
    ultimoMouse = { x: e.clientX, y: e.clientY };
    dibujarGrafo();
  }
}

function onMouseUp() {
  arrastrandoNodo   = null;
  arrastrandoCanvas = false;
}

function onRueda(e) {
  e.preventDefault();
  let factor = e.deltaY < 0 ? 1.12 : 0.88;
  zoom(factor, e.offsetX, e.offsetY);
}

/* --- Eventos Touch (móviles) --- */
let ultimoToque = null;

function onTouchStart(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    let toque = e.touches[0];
    ultimoToque = { x: toque.clientX, y: toque.clientY };
    // Simular mousedown
    let eventoSimulado = { clientX: toque.clientX, clientY: toque.clientY };
    onMouseDown(eventoSimulado);
  }
}

function onTouchMove(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    let toque = e.touches[0];
    let eventoSimulado = { clientX: toque.clientX, clientY: toque.clientY };
    onMouseMove(eventoSimulado);
  }
}

/* --- Zoom y vista --- */

function zoom(factor, cx, cy) {
  if (!canvas) return;
  cx = (cx !== undefined) ? cx : canvas.width  / 2;
  cy = (cy !== undefined) ? cy : canvas.height / 2;

  offsetX = cx - factor * (cx - offsetX);
  offsetY = cy - factor * (cy - offsetY);
  escala  *= factor;

  dibujarGrafo();
}

function resetVista() {
  escala  = 1;
  offsetX = 0;
  offsetY = 0;
  dibujarGrafo();
}

// Redistribuir nodos en forma circular para que se vean bien
function redistribuirNodos() {
  let nodos = [...grafo.nodos.values()];
  let n     = nodos.length;
  if (n === 0) return;

  let cx    = (canvas ? canvas.width  : 900) / 2;
  let cy    = (canvas ? canvas.height : 580) / 2;
  let radio = Math.min(cx, cy) * 0.74;

  nodos.forEach((nodo, i) => {
    let angulo = (2 * Math.PI * i) / n - Math.PI / 2;
    nodo.x = cx + radio * Math.cos(angulo);
    nodo.y = cy + radio * Math.sin(angulo);
  });

  resetVista();
}

/* =========================================================================
   DIBUJAR EL GRAFO EN EL CANVAS
   ========================================================================= */
function dibujarGrafo() {
  if (!ctx) return;

  let ancho = canvas.width;
  let alto  = canvas.height;

  ctx.clearRect(0, 0, ancho, alto);

  /* --- Fondo degradado oscuro --- */
  let fondoGrad = ctx.createLinearGradient(0, 0, ancho, alto);
  fondoGrad.addColorStop(0, '#0a1628');
  fondoGrad.addColorStop(1, '#0d2137');
  ctx.fillStyle = fondoGrad;
  ctx.fillRect(0, 0, ancho, alto);

  /* --- Cuadrícula decorativa sutil --- */
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth   = 1;
  let paso = 45;

  for (let x = ((offsetX % paso) + paso) % paso; x < ancho; x += paso) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, alto); ctx.stroke();
  }
  for (let y = ((offsetY % paso) + paso) % paso; y < alto; y += paso) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ancho, y); ctx.stroke();
  }

  /* --- Dibujar ARISTAS (conexiones entre ciudades) --- */
  let conexionesVistas = new Set();

  for (let [cod, nodo] of grafo.nodos) {
    for (let vec of nodo.vecinos) {
      let llave = [cod, vec.codigo].sort().join('-');
      if (conexionesVistas.has(llave)) continue;
      conexionesVistas.add(llave);

      let vecNodo = grafo.nodos.get(vec.codigo);
      if (!vecNodo) continue;

      // Coordenadas transformadas (escala + desplazamiento)
      let x1 = nodo.x    * escala + offsetX;
      let y1 = nodo.y    * escala + offsetY;
      let x2 = vecNodo.x * escala + offsetX;
      let y2 = vecNodo.y * escala + offsetY;

      // Verificar si esta arista forma parte de la ruta Dijkstra
      let enRutaDijkstra = aristasRuta.some(a =>
        (a[0] === cod && a[1] === vec.codigo) ||
        (a[0] === vec.codigo && a[1] === cod)
      );

      /* Estilo de la arista según su estado */
      if (enRutaDijkstra) {
        // Ruta encontrada por Dijkstra — destacada en rojo/naranja
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth   = 4;
        ctx.setLineDash([]);

        // Efecto de brillo en la ruta
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur  = 10;
      } else {
        // Color según tipo de vía
        switch (vec.tipo) {
          case 'autopista':
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth   = 2.2;
            break;
          case 'terraceria':
            ctx.strokeStyle = '#e67e22';
            ctx.lineWidth   = 1.5;
            ctx.setLineDash([6, 4]);
            break;
          default: // pavimentada
            ctx.strokeStyle = 'rgba(100, 160, 210, 0.65)';
            ctx.lineWidth   = 1.8;
        }
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      /* Etiqueta de distancia en el centro de la arista */
      if (escala > 0.35) {
        let mx = (x1 + x2) / 2;
        let my = (y1 + y2) / 2;

        // Fondo oscuro detrás del texto para legibilidad
        let tamFuente = Math.max(9, Math.round(11 * escala));
        ctx.font = `${tamFuente}px Segoe UI`;

        let textoKm   = `${vec.distancia} km`;
        let anchoTxt  = ctx.measureText(textoKm).width;

        ctx.fillStyle = 'rgba(10, 22, 40, 0.7)';
        ctx.fillRect(mx - anchoTxt / 2 - 3, my - tamFuente - 1, anchoTxt + 6, tamFuente + 4);

        ctx.fillStyle = enRutaDijkstra ? '#f1c40f' : 'rgba(180, 210, 240, 0.85)';
        ctx.textAlign = 'center';
        ctx.fillText(textoKm, mx, my - 2);
      }
    }
  }

  /* --- Dibujar NODOS (ciudades) --- */
  for (let [cod, nodo] of grafo.nodos) {
    let nx = nodo.x * escala + offsetX;
    let ny = nodo.y * escala + offsetY;
    let r  = Math.max(16, 20 * Math.min(escala, 1.2)); // radio del nodo

    // Determinar estado del nodo
    let enRutaDijk = nodosRuta.has(cod);
    let enBfsDfs   = nodosResaltados.has(cod);

    let colorRelleno, colorBorde;

    if (enRutaDijk) {
      colorRelleno = '#c0392b'; // Rojo — en ruta Dijkstra
      colorBorde   = '#f39c12';
    } else if (enBfsDfs) {
      colorRelleno = '#7d3c98'; // Morado — visitado por BFS/DFS
      colorBorde   = '#a855f7';
    } else {
      colorRelleno = '#1e8449'; // Verde — estado normal
      colorBorde   = '#2ecc71';
    }

    /* Sombra / brillo del nodo */
    ctx.shadowColor = colorRelleno;
    ctx.shadowBlur  = enRutaDijk || enBfsDfs ? 18 : 10;

    /* Círculo del nodo */
    ctx.beginPath();
    ctx.arc(nx, ny, r, 0, Math.PI * 2);
    ctx.fillStyle = colorRelleno;
    ctx.fill();

    /* Borde del nodo */
    ctx.strokeStyle = colorBorde;
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    /* Código de la ciudad dentro del nodo */
    let tamCodigo = Math.max(8, Math.round(10 * Math.min(escala, 1.2)));
    ctx.font         = `bold ${tamCodigo}px Segoe UI`;
    ctx.fillStyle    = '#ffffff';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cod.substring(0, 3), nx, ny);

    /* Nombre debajo del nodo (solo si hay espacio) */
    if (escala > 0.4) {
      let tamNombre = Math.max(8, Math.round(9.5 * Math.min(escala, 1)));
      ctx.font      = `${tamNombre}px Segoe UI`;
      ctx.fillStyle = 'rgba(220, 235, 250, 0.88)';
      ctx.textBaseline = 'top';

      // Mostrar solo el primer token del nombre para que no quede muy largo
      let nombreCorto = nodo.nombre.length > 14 ? nodo.nombre.substring(0, 13) + '…' : nodo.nombre;
      ctx.fillText(nombreCorto, nx, ny + r + 5);
    }

    ctx.textBaseline = 'alphabetic';
  }

  /* --- Mensaje si el grafo está vacío --- */
  if (grafo.nodos.size === 0) {
    ctx.font      = 'bold 18px Segoe UI';
    ctx.fillStyle = 'rgba(100, 160, 210, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('No hay ciudades en el grafo.', ancho / 2, alto / 2 - 12);
    ctx.font      = '14px Segoe UI';
    ctx.fillStyle = 'rgba(100, 160, 210, 0.35)';
    ctx.fillText('Cargue datos de ejemplo o registre ciudades manualmente.', ancho / 2, alto / 2 + 16);
  }
}

// Limpia los colores de resaltado del canvas
function limpiarResaltado() {
  nodosResaltados.clear();
  aristasRuta = [];
  nodosRuta.clear();
  dibujarGrafo();
}

/* =========================================================================
   FUNCIONES DEL SISTEMA — CRUD CIUDADES
   ========================================================================= */

function agregarCiudad() {
  let cod = document.getElementById('cod-ciudad').value.trim().toUpperCase();
  let nom = document.getElementById('nom-ciudad').value.trim();
  let dep = document.getElementById('dep-ciudad').value.trim();
  let pob = document.getElementById('pob-ciudad').value.trim();

  if (!cod || !nom || !dep) {
    mostrarAlerta('alerta-ciudad', 'error', '⚠️ Complete los campos: Código, Nombre y Departamento.');
    return;
  }
  if (cod.length < 2 || cod.length > 5) {
    mostrarAlerta('alerta-ciudad', 'error', '⚠️ El código debe tener entre 2 y 5 caracteres.');
    return;
  }

  if (grafo.agregarCiudad(cod, nom, dep, pob)) {
    mostrarAlerta('alerta-ciudad', 'exito', `✅ Ciudad "${nom}" (${cod}) agregada exitosamente.`);
    limpiarFormCiudad();
    actualizarTodo();
  } else {
    mostrarAlerta('alerta-ciudad', 'error', `❌ Ya existe una ciudad con el código "${cod}".`);
  }
}

function eliminarCiudad() {
  let cod  = document.getElementById('sel-mod-ciudad').value;
  if (!cod) { mostrarAlerta('alerta-mod-ciudad', 'error', '⚠️ Seleccione una ciudad.'); return; }

  let nodo = grafo.nodos.get(cod);
  let nombre = nodo ? nodo.nombre : cod;

  if (grafo.eliminarCiudad(cod)) {
    mostrarAlerta('alerta-mod-ciudad', 'exito', `✅ Ciudad "${nombre}" eliminada correctamente.`);
    actualizarTodo();
  }
}

function modificarCiudad() {
  let cod = document.getElementById('sel-mod-ciudad').value;
  let nom = document.getElementById('mod-nom-ciudad').value.trim();
  let dep = document.getElementById('mod-dep-ciudad').value.trim();
  let pob = document.getElementById('mod-pob-ciudad').value.trim();

  if (!cod) { mostrarAlerta('alerta-mod-ciudad', 'error', '⚠️ Seleccione una ciudad.'); return; }

  if (grafo.modificarCiudad(cod, nom, dep, pob)) {
    mostrarAlerta('alerta-mod-ciudad', 'exito', `✅ Ciudad "${cod}" modificada exitosamente.`);
    actualizarTodo();
  }
}

function cargarDatosModificar() {
  let cod = document.getElementById('sel-mod-ciudad').value;
  if (!cod) return;
  let nodo = grafo.nodos.get(cod);
  if (!nodo) return;
  document.getElementById('mod-nom-ciudad').value = nodo.nombre;
  document.getElementById('mod-dep-ciudad').value = nodo.dpto;
  document.getElementById('mod-pob-ciudad').value = nodo.poblacion;
}

function limpiarFormCiudad() {
  ['cod-ciudad', 'nom-ciudad', 'dep-ciudad', 'pob-ciudad'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

/* =========================================================================
   FUNCIONES DEL SISTEMA — CRUD CONEXIONES
   ========================================================================= */

function crearConexion() {
  let origen  = document.getElementById('conn-origen').value;
  let destino = document.getElementById('conn-destino').value;
  let dist    = document.getElementById('conn-dist').value;
  let tipo    = document.getElementById('conn-tipo').value;

  if (!origen || !destino) {
    mostrarAlerta('alerta-conexion', 'error', '⚠️ Seleccione ciudad origen y destino.'); return;
  }
  if (origen === destino) {
    mostrarAlerta('alerta-conexion', 'error', '⚠️ Origen y destino no pueden ser la misma ciudad.'); return;
  }
  if (!dist || Number(dist) <= 0) {
    mostrarAlerta('alerta-conexion', 'error', '⚠️ Ingrese una distancia válida mayor a 0.'); return;
  }

  if (grafo.agregarConexion(origen, destino, dist, tipo)) {
    let no = grafo.nodos.get(origen).nombre;
    let nd = grafo.nodos.get(destino).nombre;
    mostrarAlerta('alerta-conexion', 'exito', `✅ Conectado: ${no} ↔ ${nd} | ${dist} km (${tipo})`);
    limpiarFormConexion();
    actualizarTodo();
  } else {
    mostrarAlerta('alerta-conexion', 'error', '❌ No se pudo crear. ¿La conexión ya existe?');
  }
}

function eliminarConexion() {
  let val = document.getElementById('sel-mod-conn').value;
  if (!val) { mostrarAlerta('alerta-mod-conn', 'error', '⚠️ Seleccione una conexión.'); return; }
  let [o, d] = val.split('|');
  if (grafo.eliminarConexion(o, d)) {
    mostrarAlerta('alerta-mod-conn', 'exito', `✅ Conexión ${o} ↔ ${d} eliminada.`);
    actualizarTodo();
  }
}

function modificarConexion() {
  let val  = document.getElementById('sel-mod-conn').value;
  let dist = document.getElementById('mod-conn-dist').value;
  let tipo = document.getElementById('mod-conn-tipo').value;

  if (!val) { mostrarAlerta('alerta-mod-conn', 'error', '⚠️ Seleccione una conexión.'); return; }
  if (!dist || Number(dist) <= 0) { mostrarAlerta('alerta-mod-conn', 'error', '⚠️ Distancia inválida.'); return; }

  let [o, d] = val.split('|');
  if (grafo.modificarConexion(o, d, dist, tipo)) {
    mostrarAlerta('alerta-mod-conn', 'exito', `✅ Conexión ${o} ↔ ${d} actualizada a ${dist} km.`);
    actualizarTodo();
  }
}

function cargarDatosModConn() {
  let val = document.getElementById('sel-mod-conn').value;
  if (!val) return;
  let [o, d] = val.split('|');
  let nodo = grafo.nodos.get(o);
  if (!nodo) return;
  let vec = nodo.vecinos.find(v => v.codigo === d);
  if (vec) {
    document.getElementById('mod-conn-dist').value = vec.distancia;
    document.getElementById('mod-conn-tipo').value = vec.tipo || 'pavimentada';
  }
}

function limpiarFormConexion() {
  document.getElementById('conn-origen').value  = '';
  document.getElementById('conn-destino').value = '';
  document.getElementById('conn-dist').value    = '';
}

/* =========================================================================
   FUNCIONES DE ALGORITMOS — BFS, DFS, DIJKSTRA (interfaz)
   ========================================================================= */

function ejecutarBFS() {
  let inicio = document.getElementById('bfs-inicio').value;
  let panel  = document.getElementById('resultado-bfs');

  if (!inicio) {
    panel.innerHTML = '<span class="linea-error">⚠️ Seleccione una ciudad de inicio</span>';
    return;
  }

  let resultado = grafo.bfs(inicio);
  if (!resultado) {
    panel.innerHTML = '<span class="linea-error">Error al ejecutar BFS</span>';
    return;
  }

  // Resaltar nodos visitados en el canvas
  limpiarResaltado();
  resultado.visitados.forEach(cod => nodosResaltados.add(cod));
  dibujarGrafo();

  // Construir HTML del resultado
  let html = '';
  html += `<span class="linea-ok">▶ BFS desde: ${grafo.nodos.get(inicio).nombre} (${inicio})</span>\n`;
  html += `<span class="linea-info">──────────────────────────────────────</span>\n`;

let contadorPaso = 1;

resultado.pasos.forEach(paso => {

  // VISITA DE CIUDAD
  if (paso.startsWith('[VISITAR]')) {

    let limpio = paso
      .replace('[VISITAR]', '')
      .trim();

    html += `
      <div class="bloque-bfs">
        <div class="bfs-titulo">
          ${contadorPaso}️⃣ Se visita:
        </div>

        <div class="bfs-ciudad">
          ${limpio}
        </div>

        </div>
    `;

    contadorPaso++;
  }

  // CONEXIONES
  else if (paso.includes('→ Encolar:')) {

    let limpio = paso
      .replace('→ Encolar:', '•')
      .replace('| dist:', '—');

    html += `
      <div class="bfs-conexion">
        ${limpio}
      </div>

    `;
  }

  // COLA E INFO
  else if (
    paso.includes('Cola ahora') ||
    paso.startsWith('[INICIO]')
  ) {

    // NO MOSTRAR
  }

  // OTROS
  else {

    html += `
      <div class="bfs-extra">
        ${paso}
      </div>
    `;
  }

 }); 


html += `
  <div class="bfs-final">

    <div class="bfs-final-titulo">
      📌 ORDEN FINAL
    </div>

    <div class="bfs-orden">
      ${resultado.orden.join(' → ')}
    </div>

    <div class="bfs-total">
      ✅ Total ciudades visitadas:
      ${resultado.orden.length}
    </div>

  </div>
`;

panel.innerHTML = html;
panel.scrollTop = 0;

}

function ejecutarDFS() {
  let inicio = document.getElementById('dfs-inicio').value;
  let panel  = document.getElementById('resultado-dfs');

  if (!inicio) {
    panel.innerHTML = '<span class="linea-error">⚠️ Seleccione una ciudad de inicio</span>';
    return;
  }

  let resultado = grafo.dfs(inicio);
  if (!resultado) {
    panel.innerHTML = '<span class="linea-error">Error al ejecutar DFS</span>';
    return;
  }

  limpiarResaltado();
  resultado.visitados.forEach(cod => nodosResaltados.add(cod));
  dibujarGrafo();

let html = '';

html += `
<div class="bfs-final">
  <div class="bfs-final-titulo">
    🧭 DFS desde:
  </div>

  <div class="bfs-orden">
    ${grafo.nodos.get(inicio).nombre} (${inicio})
  </div>
</div>
`;

let contadorPaso = 1;

resultado.pasos.forEach(paso => {

  // VISITA
  if (paso.startsWith('[VISITAR]')) {

    let limpio = paso
      .replace('[VISITAR]', '')
      .trim();

    html += `
      <div class="bloque-bfs">

        <div class="bfs-titulo">
          ${contadorPaso}️⃣ Se visita:
        </div>

        <div class="bfs-ciudad">
          ${limpio}
        </div>

        </div>
    `;

    contadorPaso++;
  }

  // RECORRIDOS
  else if (paso.includes('→')) {

    html += `
      <div class="bfs-conexion">
        ${paso}
      </div>
    `;
  }

  // IGNORAR DEBUG
  else if (
    paso.includes('Pila') ||
    paso.startsWith('[INICIO]')
  ) {

    // nada
  }

  // OTROS
  else {

    html += `
      <div class="bfs-extra">
        ${paso}
      </div>
    `;
  }

});

html += `
  <div class="bfs-final">

    <div class="bfs-final-titulo">
      📌 ORDEN FINAL
    </div>

    <div class="bfs-orden">
      ${resultado.orden.join(' → ')}
    </div>

    <div class="bfs-total">
      ✅ Total ciudades visitadas:
      ${resultado.orden.length}
    </div>

  </div>
`;

panel.innerHTML = html;
panel.scrollTop = 0;
}

function ejecutarDijkstra() {
  let origen  = document.getElementById('dijk-origen').value;
  let destino = document.getElementById('dijk-destino').value;
  let panel   = document.getElementById('resultado-dijkstra');
  let detalle = document.getElementById('detalle-ruta');

  if (!origen || !destino) {
    panel.innerHTML = '<span class="linea-error">⚠️ Seleccione origen y destino</span>';
    return;
  }
  if (origen === destino) {
    panel.innerHTML = '<span class="linea-warn">⚠️ Origen y destino son la misma ciudad</span>';
    return;
  }

  let resultado = grafo.dijkstra(origen, destino);
  if (!resultado) {
    panel.innerHTML = '<span class="linea-error">Error al ejecutar Dijkstra</span>';
    return;
  }

  limpiarResaltado();

  let html = '';

html += `
<div class="dijkstra-header">
    🏆 Ruta más corta encontrada
</div>
`;

resultado.ruta.forEach((ciudad, index) => {

    html += `
    <div class="bloque-dijkstra">

        <div class="dijkstra-paso">
            ${index + 1}️⃣ ${ciudad}
        </div>
    `;

    // SI NO ES LA ÚLTIMA CIUDAD
    if(index < resultado.ruta.length - 1){

        html += `
        <div class="dijkstra-flecha">
            ↓
        </div>
        `;
    }

    html += `
    </div>
    `;
});

html += `
<div class="dijkstra-final">

    <div class="dijkstra-total">
        📏 Distancia Total:
        ${resultado.distancia} km
    </div>

    <div class="dijkstra-tiempo">
        ⏱️ Tiempo Aproximado:
        ${Math.round(resultado.distancia / 60 * 60)} min
    </div>

</div>
`;

panel.innerHTML = html;
  panel.scrollTop = panel.scrollHeight;

  // Resaltar la ruta en el canvas
  resultado.ruta.forEach(cod => nodosRuta.add(cod));
  for (let i = 0; i < resultado.ruta.length - 1; i++) {
    aristasRuta.push([resultado.ruta[i], resultado.ruta[i + 1]]);
  }
  dibujarGrafo();

  // Panel de detalle de la ruta (paso a paso)
  let rutaHtml = `
    <div style="text-align:center; margin-bottom:14px; padding:12px; background:#eafaf1; border-radius:8px;">
      <div style="font-size:1.8rem; font-weight:800; color:var(--verde);">${resultado.distancia} km</div>
      <div style="font-size:0.8rem; color:#aaa; margin-top:2px;">Distancia total de la ruta óptima</div>
    </div>
    <div style="display:flex; flex-direction:column; gap:4px;">
  `;

  for (let i = 0; i < resultado.ruta.length; i++) {
    let cod   = resultado.ruta[i];
    let nodo  = grafo.nodos.get(cod);
    let esOrigen  = i === 0;
    let esDestino = i === resultado.ruta.length - 1;

    let color = esOrigen ? '#27ae60' : esDestino ? '#e74c3c' : '#3498db';

    rutaHtml += `
      <div class="paso-ruta-item">
        <span class="punto-ruta" style="background:${color};"></span>
        <span style="font-weight:600;">${nodo.nombre}</span>
        <span class="badge badge-azul">${cod}</span>
        <span style="font-size:0.78rem; color:#aaa;">${nodo.dpto}</span>
      </div>
    `;

    if (!esDestino) {
      let vecEnRuta = nodo.vecinos.find(v => v.codigo === resultado.ruta[i + 1]);
      if (vecEnRuta) {
        rutaHtml += `<div class="km-entre">⬇ ${vecEnRuta.distancia} km</div>`;
      }
    }
  }

  rutaHtml += `</div>`;
  detalle.innerHTML = rutaHtml;
}

/* =========================================================================
   ACTUALIZAR TODA LA INTERFAZ DE USUARIO
   ========================================================================= */

function actualizarTodo() {
  actualizarTablaCiudades();
  actualizarTablaConexiones();
  actualizarSelectores();
  actualizarEstadisticas();
  dibujarGrafo();
  logInicio(`Grafo actualizado: ${grafo.nodos.size} ciudades | ${grafo.obtenerConexiones().length} conexiones.`);
}

function actualizarTablaCiudades() {
  let tbody = document.getElementById('tbody-ciudades');
  let nodos = [...grafo.nodos.values()];

  if (nodos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#aaa; padding:20px;">No hay ciudades registradas</td></tr>';
    return;
  }

  tbody.innerHTML = nodos.map((n, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><span class="badge badge-azul">${n.codigo}</span></td>
      <td><strong>${n.nombre}</strong></td>
      <td>${n.dpto}</td>
      <td>${n.poblacion > 0 ? n.poblacion.toLocaleString() : '—'}</td>
      <td><span class="badge badge-verde">${n.vecinos.length}</span></td>
    </tr>
  `).join('');
}

function actualizarTablaConexiones() {
  let tbody      = document.getElementById('tbody-conexiones');
  let conexiones = grafo.obtenerConexiones();

  if (conexiones.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#aaa; padding:20px;">No hay conexiones registradas</td></tr>';
    return;
  }

  tbody.innerHTML = conexiones.map((c, i) => {
    let no        = grafo.nodos.get(c.origen)?.nombre  || c.origen;
    let nd        = grafo.nodos.get(c.destino)?.nombre || c.destino;
    let classBadge = c.tipo === 'autopista' ? 'badge-azul' :
                     c.tipo === 'terraceria' ? 'badge-naranja' : 'badge-verde';
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${no}</strong> <span class="badge badge-azul">${c.origen}</span></td>
        <td><strong>${nd}</strong> <span class="badge badge-azul">${c.destino}</span></td>
        <td><strong>${c.distancia} km</strong></td>
        <td><span class="badge ${classBadge}">${c.tipo}</span></td>
      </tr>
    `;
  }).join('');
}

function actualizarSelectores() {
  let nodos   = [...grafo.nodos.values()];
  let opciones = nodos.map(n =>
    `<option value="${n.codigo}">${n.nombre} (${n.codigo})</option>`
  ).join('');

  let idsSelectores = [
    'conn-origen', 'conn-destino',
    'bfs-inicio',  'dfs-inicio',
    'dijk-origen', 'dijk-destino',
    'sel-mod-ciudad'
  ];

  idsSelectores.forEach(id => {
    let el = document.getElementById(id);
    let textoVacio = id.includes('mod') ? 'Seleccione' : 'Seleccione ciudad';
    el.innerHTML = `<option value="">-- ${textoVacio} --</option>` + opciones;
  });

  // Select de conexiones para modificar
  let conexiones = grafo.obtenerConexiones();
  let selConn    = document.getElementById('sel-mod-conn');
  selConn.innerHTML = `<option value="">-- Seleccione conexión --</option>` +
    conexiones.map(c => {
      let no = grafo.nodos.get(c.origen)?.nombre  || c.origen;
      let nd = grafo.nodos.get(c.destino)?.nombre || c.destino;
      return `<option value="${c.origen}|${c.destino}">${no} ↔ ${nd} (${c.distancia} km)</option>`;
    }).join('');
}

function actualizarEstadisticas() {
  let conexiones = grafo.obtenerConexiones();
  let kmTotal    = conexiones.reduce((suma, c) => suma + c.distancia, 0);

  document.getElementById('stat-ciudades').textContent   = grafo.nodos.size;
  document.getElementById('stat-conexiones').textContent = conexiones.length;
  document.getElementById('stat-km').textContent         = kmTotal.toLocaleString();
}

/* =========================================================================
   DATOS DE PRUEBA — CIUDADES REALES DE GUATEMALA
   ========================================================================= */

function cargarDatosPrueba() {
  grafo = new GrafoCiudades();

  /* --- Ciudades --- */
  let ciudades = [
    ['GUA', 'Guatemala City',    'Guatemala',      1000000],
    ['XEL', 'Quetzaltenango',    'Quetzaltenango',  300000],
    ['ESC', 'Escuintla',         'Escuintla',       130000],
    ['COB', 'Cobán',             'Alta Verapaz',     95000],
    ['ANT', 'Antigua Guatemala', 'Sacatepéquez',     42000],
    ['HUE', 'Huehuetenango',     'Huehuetenango',   110000],
    ['CHI', 'Chiquimula',        'Chiquimula',       70000],
    ['FLO', 'Flores',            'Petén',            25000],
    ['PBR', 'Puerto Barrios',    'Izabal',           65000],
    ['MAZ', 'Mazatenango',       'Suchitepéquez',    60000],
    ['JAL', 'Jalapa',            'Jalapa',           50000],
    ['TOT', 'Totonicapán',       'Totonicapán',      97000],
    ['SAL', 'Salamá',            'Baja Verapaz',     30000],
    ['ZAC', 'Zacapa',            'Zacapa',           55000],
  ];

  /* Posiciones manuales ajustadas al canvas para que se vea el mapa */
  let posiciones = {
    'GUA': [490, 255], 'XEL': [195, 270], 'ESC': [395, 355],
    'COB': [555, 135], 'ANT': [405, 255], 'HUE': [125, 145],
    'CHI': [660, 275], 'FLO': [640, 65],  'PBR': [740, 185],
    'MAZ': [265, 360], 'JAL': [590, 270], 'TOT': [240, 225],
    'SAL': [500, 175], 'ZAC': [630, 220],
  };

  ciudades.forEach(([cod, nom, dep, pob]) => {
    grafo.agregarCiudad(cod, nom, dep, pob);
    let nodo = grafo.nodos.get(cod);
    if (posiciones[cod]) {
      nodo.x = posiciones[cod][0];
      nodo.y = posiciones[cod][1];
    }
  });

  /* --- Conexiones con distancias aproximadas reales (km) --- */
  let conexiones = [
    ['GUA', 'ANT', 45,  'autopista'],
    ['GUA', 'ESC', 62,  'autopista'],
    ['GUA', 'COB', 213, 'pavimentada'],
    ['GUA', 'SAL', 145, 'pavimentada'],
    ['GUA', 'CHI', 167, 'pavimentada'],
    ['GUA', 'JAL', 100, 'pavimentada'],
    ['ANT', 'ESC', 50,  'pavimentada'],
    ['ANT', 'XEL', 200, 'pavimentada'],
    ['XEL', 'HUE', 97,  'pavimentada'],
    ['XEL', 'TOT', 40,  'pavimentada'],
    ['XEL', 'MAZ', 45,  'pavimentada'],
    ['ESC', 'MAZ', 70,  'autopista'],
    ['COB', 'FLO', 360, 'pavimentada'],
    ['COB', 'SAL', 90,  'pavimentada'],
    ['CHI', 'ZAC', 30,  'pavimentada'],
    ['CHI', 'PBR', 185, 'pavimentada'],
    ['ZAC', 'PBR', 155, 'pavimentada'],
    ['ZAC', 'JAL', 60,  'pavimentada'],
    ['JAL', 'CHI', 70,  'terraceria'],
    ['HUE', 'TOT', 140, 'terraceria'],
    ['FLO', 'PBR', 300, 'terraceria'],
    ['SAL', 'COB', 90,  'pavimentada'],
    ['MAZ', 'HUE', 155, 'pavimentada'],
  ];

  conexiones.forEach(([o, d, dist, tipo]) => grafo.agregarConexion(o, d, dist, tipo));

  actualizarTodo();
  logInicio('Datos de ejemplo cargados: 14 ciudades guatemaltecas con 23 conexiones.');
}

function limpiarTodo() {
  grafo = new GrafoCiudades();
  limpiarResaltado();
  actualizarTodo();
  logInicio('Grafo limpiado. Sistema listo para nuevos datos.');
}

/* =========================================================================
   UTILIDADES DE INTERFAZ DE USUARIO
   ========================================================================= */

function mostrarSeccion(id, boton) {

  document.querySelectorAll('.seccion')
    .forEach(s => s.classList.remove('activo'));

  document.getElementById(id)
    .classList.add('activo');

  document.querySelectorAll('nav button')
    .forEach(b => b.classList.remove('activo'));

  if (boton) boton.classList.add('activo');

  // IMPORTANTE
  if (id === 'visualizar') {

    setTimeout(() => {

      ajustarTamanioCanvas();
      dibujarGrafo();

    }, 120);
  }

  if(id === "distancias"){

    setTimeout(() => {
        mapa.invalidateSize();
    }, 200);

}
}


function mostrarAlerta(idContenedor, tipo, mensaje) {
  let contenedor = document.getElementById(idContenedor);
  let clase = tipo === 'exito' ? 'alerta-exito' :
              tipo === 'error' ? 'alerta-error' : 'alerta-info';
  contenedor.innerHTML = `<div class="alerta ${clase}">${mensaje}</div>`;
  setTimeout(() => { contenedor.innerHTML = ''; }, 4500);
}

function logInicio(msg) {
  let panel = document.getElementById('log-inicio');
  if (!panel) return;
  let clase = msg.startsWith('Datos') || msg.startsWith('Grafo actualizado') ? 'linea-ok' :
              msg.startsWith('Error') ? 'linea-error' :
              msg.startsWith('Grafo limpiado') ? 'linea-warn' : 'linea-info';
  let linea = document.createElement('span');
  linea.className = clase;
  linea.textContent = '» ' + msg;
  panel.appendChild(document.createTextNode('\n'));
  panel.appendChild(linea);
  panel.scrollTop = panel.scrollHeight;
}

function cerrarModal() {
  document.getElementById('modal-fondo').classList.remove('abierto');
}

// ======================================
// DARK MODE
// ======================================
function toggleDarkMode(){

    document.body.classList.toggle(
        "dark-mode"
    );

    // GUARDAR PREFERENCIA
    if(
        document.body.classList.contains(
            "dark-mode"
        )
    ){
        localStorage.setItem(
            "darkMode",
            "activo"
        );
    }else{
        localStorage.setItem(
            "darkMode",
            "inactivo"
        );
    }

}

// ======================================
// CARGAR PREFERENCIA
// ======================================
window.addEventListener("load", () => {

    const modo =
        localStorage.getItem("darkMode");

    if(modo === "activo"){

        document.body.classList.add(
            "dark-mode"
        );

    }

});