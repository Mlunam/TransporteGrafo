let mapa = L.map('mapaDistancias').setView([15.5, -90.25], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(mapa);

let marcadores = [];
let lineaRuta = null;

// ===============================
// OBTENER COORDENADAS
// ===============================
async function obtenerCoordenadas(ciudad) {

    const url =
        `https://nominatim.openstreetmap.org/search?format=json&q=${ciudad}, Guatemala`;

    const respuesta = await fetch(url);

    const datos = await respuesta.json();

    if (datos.length === 0) {
        return null;
    }

    return {
        lat: parseFloat(datos[0].lat),
        lon: parseFloat(datos[0].lon)
    };
}

// ===============================
// CALCULAR RUTA REAL
// ===============================
async function calcularRutaReal() {

    const origen =
        document.getElementById("ciudadOrigen").value;

    const destino =
        document.getElementById("ciudadDestino").value;

    if (!origen || !destino) {
        alert("Completa ambas ciudades");
        return;
    }

    // LIMPIAR
    marcadores.forEach(m => mapa.removeLayer(m));
    marcadores = [];

    if (lineaRuta) {
        mapa.removeLayer(lineaRuta);
    }

    // OBTENER COORDENADAS
    const coordOrigen =
        await obtenerCoordenadas(origen);

    const coordDestino =
        await obtenerCoordenadas(destino);

    if (!coordOrigen || !coordDestino) {

        document.getElementById(
            "panelUbicacion"
        ).innerHTML =
            "No se encontraron ciudades.";

        return;
    }

    // MARCADORES
    const marker1 = L.marker([
        coordOrigen.lat,
        coordOrigen.lon
    ]).addTo(mapa);

    marker1.bindPopup(origen);

    const marker2 = L.marker([
        coordDestino.lat,
        coordDestino.lon
    ]).addTo(mapa);

    marker2.bindPopup(destino);

    marcadores.push(marker1, marker2);

    // API GRATUITA OSRM
    const rutaURL =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${coordOrigen.lon},${coordOrigen.lat};` +
        `${coordDestino.lon},${coordDestino.lat}` +
        `?overview=full&geometries=geojson`;

    const rutaResp = await fetch(rutaURL);

    const rutaData = await rutaResp.json();

    const ruta =
        rutaData.routes[0];

    // DISTANCIA
    const km =
        (ruta.distance / 1000).toFixed(2);

    // TIEMPO
    const minutos =
        Math.round(ruta.duration / 60);

    // DIBUJAR LINEA
    lineaRuta = L.geoJSON(
        ruta.geometry
    ).addTo(mapa);

    mapa.fitBounds(
        lineaRuta.getBounds()
    );

    // PANEL
document.getElementById(
    "panelUbicacion"
).innerHTML = `
    <strong>Origen:</strong> ${origen}<br>
    <strong>Destino:</strong> ${destino}<br>
    <strong>Distancia:</strong> ${km} km<br>
    <strong>Tiempo Aproximado:</strong> ${minutos} min
`;
}

// AJUSTAR MAPA
setTimeout(() => {
    mapa.invalidateSize();
}, 1000);