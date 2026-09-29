/* ============================================================================
   ESTADO DE LA APLICACIÓN (no requiere edición docente)
   ============================================================================ */
const estado = {
  escenaActual: "scene-inicio",
  estaciones: {
    estacion1: { intentos: 0, resuelto: false },
    estacion2: { intentos: 0, resuelto: false },
    estacion3: { intentos: 0, resuelto: false },
    final: { intentos: 0, resuelto: false } // carga manual del código completo (Fase 3 de la Estación 3)
  },
  inicioTiempo: null,
  finTiempo: null,
  intervaloTimer: null
};

// Mapa de índice de estación -> id de sección
const ORDEN_ESCENAS = ["scene-inicio", "scene-1", "scene-2", "scene-3", "scene-final"];

/* ============================================================================
   UTILIDADES COMPARTIDAS
   ============================================================================ */

// Mezcla una copia de un array (algoritmo de Fisher-Yates). Se usa para que las
// tarjetas de las Estaciones 1 y 2 aparezcan en un orden distinto cada vez que
// se juega, en vez de siempre en el mismo orden.
function barajar(array){
  const copia = [...array];
  for(let i = copia.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Normaliza un código escrito a mano: sin espacios, en mayúsculas, con guion
// simple. Así "k-8-e-8-4", "K 8 E 8 4" y "K-8-E-8-4" se consideran equivalentes.
function normalizarCodigo(texto){
  return texto.trim().toUpperCase().replace(/\s+/g, "").replace(/–|—/g, "-");
}

/* ============================================================================
   ESTACIÓN 1 · JUEGO "EL FILTRO DE BIODIVERSIDAD"
   Clasificación de tarjetas (nativa / exótica invasora). Al clasificar todas
   las tarjetas correctamente, completarEstacion1() revela la clave definida
   en CONFIG.claves.estacion1 y habilita el botón "Continuar".
   ============================================================================ */
function renderEstacion1(){
  const cont = document.getElementById("bio-grid");
  cont.innerHTML = "";
  const tarjetasBarajadas = barajar(CONFIG.estacion1Tarjetas); // orden distinto cada vez que se juega
  tarjetasBarajadas.forEach(t => {
    const card = document.createElement("div");
    card.className = "bio-card";
    card.id = "card-" + t.id;
    card.innerHTML = `
      <span class="bio-emoji" aria-hidden="true">${t.emoji}</span>
      <h4>${t.nombre}</h4>
      <p>${t.pista}</p>
      <div class="bio-actions">
        <button type="button" class="bio-btn" data-id="${t.id}" data-eleccion="nativa">Nativa del Delta</button>
        <button type="button" class="bio-btn" data-id="${t.id}" data-eleccion="exotica">Exótica invasora</button>
      </div>
      <span class="bio-status">✅ Clasificada correctamente</span>
    `;
    cont.appendChild(card);
  });
  cont.querySelectorAll(".bio-btn").forEach(btn => {
    btn.addEventListener("click", () => clasificarTarjetaEstacion1(btn.dataset.id, btn.dataset.eleccion));
  });
  actualizarProgresoEstacion1();
}

function clasificarTarjetaEstacion1(id, eleccion){
  const st = estado.estaciones.estacion1;
  if(st.resuelto) return; // ya se desbloqueó la estación, no se aceptan más intentos

  const cardEl = document.getElementById("card-" + id);
  if(cardEl.classList.contains("correct")) return; // esa tarjeta ya está resuelta

  const tarjeta = CONFIG.estacion1Tarjetas.find(t => t.id === id);
  st.intentos += 1; // cada clic sobre una tarjeta cuenta como un intento

  if(eleccion === tarjeta.tipo){
    cardEl.classList.add("correct");
    cardEl.querySelectorAll(".bio-btn").forEach(b => b.disabled = true);
    st.correctas = (st.correctas || 0) + 1;
    Sonido.reproducir("acierto");
  } else {
    Sonido.reproducir("error");
    cardEl.classList.remove("incorrect");
    void cardEl.offsetWidth; // fuerza el reinicio de la animación de "sacudida"
    cardEl.classList.add("incorrect");
    setTimeout(() => cardEl.classList.remove("incorrect"), 450);
  }

  actualizarProgresoEstacion1();
  actualizarRegistro();

  if((st.correctas || 0) === CONFIG.estacion1Tarjetas.length){
    completarEstacion1();
  }
}

function actualizarProgresoEstacion1(){
  const st = estado.estaciones.estacion1;
  document.getElementById("bio-progress-count").textContent =
    `${st.correctas || 0} / ${CONFIG.estacion1Tarjetas.length}`;
}

function completarEstacion1(){
  // Equivale a haber tipeado la clave correcta: reutiliza el mismo flujo de
  // feedback y de habilitación del botón "Continuar" que las otras estaciones.
  const st = estado.estaciones.estacion1;
  st.resuelto = true;

  const feedbackEl = document.getElementById("feedback-1");
  feedbackEl.textContent = `✅ Filtro de biodiversidad desbloqueado. KRONOS-9 reconoce la clave ${CONFIG.claves.estacion1}.`;
  feedbackEl.className = "feedback show ok";

  Sonido.despues(350, "estacion_ok");
  document.getElementById("next-1").disabled = false;
  actualizarCodigo();
  actualizarRegistro();
}

function reiniciarEstacion1(){
  estado.estaciones.estacion1 = { intentos: 0, resuelto: false, correctas: 0 };
  renderEstacion1();
  document.getElementById("feedback-1").className = "feedback";
  document.getElementById("next-1").disabled = true;
}

/* ============================================================================
   ESTACIÓN 2 · "LA RED ENERGÉTICA Y TEMPORAL"
   Paso 1: video informativo (se ve ANTES de la actividad).
   Paso 2: el equipo arma la red trófica ARRASTRANDO tarjetas a los casilleros
           del camino de la energía. Las tarjetas "intrusas" van a la zona
           "No pertenece a la secuencia". Al verificar, las tarjetas bien
           ubicadas quedan fijas y las demás se pueden mover y volver a probar.
   Alternativas para netbooks sin mouse / pantallas táctiles / teclado:
           tocar la tarjeta y luego tocar el casillero (o Enter / Espacio).
   ============================================================================ */

const video2 = { iframeCreado:false, player:null, temporizador:null, fallo:false, desbloqueada:false };
const dnd = { seleccionada:null, arrastre:null };

// Todas las tarjetas de la Estación 2 (elementos reales + intrusos juntos)
function elementosEstacion2(){
  return [...CONFIG.estacion2Elementos, ...CONFIG.estacion2Intrusos];
}

/* ---------------------------- PASO 1: VIDEO ---------------------------- */
function prepararVideoEstacion2(){
  if(video2.iframeCreado) return; // el video se carga una sola vez, recién al entrar a la estación
  video2.iframeCreado = true;
  const cfg = CONFIG.estacion2Video;
  document.getElementById("video-link").href = "https://www.youtube.com/watch?v=" + cfg.id;

  // YouTube RECHAZA sistemáticamente los videos incrustados cuando la página se abrió con
  // doble clic (dirección file://): no hay forma de evitarlo desde el código de la página.
  // En ese caso mostramos un aviso claro en vez de un reproductor roto, y seguimos con el
  // botón «Abrir en YouTube». La solución real es abrir la experiencia con uno de los
  // archivos "Iniciar" de la carpeta (ver LEEME.txt), que sirven la página por http://
  // en vez de file:// y ahí el video sí se reproduce adentro de la página.
  if(location.protocol === "file:"){
    mostrarAvisoSinServidor();
    return;
  }

  const ifr = document.createElement("iframe");
  ifr.id = "yt-iframe";
  ifr.title = "Video informativo para armar la red trófica";
  ifr.referrerPolicy = "strict-origin-when-cross-origin"; // YouTube exige un referrer válido
  ifr.src = "https://www.youtube-nocookie.com/embed/" + cfg.id +
            "?enablejsapi=1&rel=0&modestbranding=1&playsinline=1&origin=" + encodeURIComponent(location.origin);
  ifr.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  ifr.allowFullscreen = true;
  document.getElementById("video-marco").appendChild(ifr);

  if(!cfg.exigirVerCompleto){
    habilitarBotonVideo("Pueden seguir cuando quieran.");
    return;
  }
  document.getElementById("video-ayuda").textContent =
    "Cuando el video termine se habilita el botón para seguir.";

  // Si el reproductor no responde a tiempo (por ejemplo, sin conexión a internet), la
  // actividad no queda trabada.
  video2.temporizador = setTimeout(videoNoDisponible, cfg.segundosSiFallaElVideo * 1000);
  cargarApiYouTube();
}

function mostrarAvisoSinServidor(){
  video2.fallo = true;
  document.getElementById("video-marco").innerHTML = `
    <div class="video-aviso">
      <strong>⚠ Para ver el video acá, hay que iniciar la página de otra forma.</strong>
      <p>
        Cierren esta pestaña y abran «Iniciar (Windows).bat» o «Iniciar (Mac o Linux).sh»
        —están en la misma carpeta que <code>index.html</code>— en vez de abrir
        <code>index.html</code> con doble clic. Es un paso único; el resto del juego funciona igual.
      </p>
      <p>Mientras tanto, usen «Abrir en YouTube» y, cuando terminen de verlo, sigan con la actividad.</p>
    </div>`;
  habilitarBotonVideo();
}

function cargarApiYouTube(){
  window.onYouTubeIframeAPIReady = function(){
    try {
      video2.player = new YT.Player("yt-iframe", { events: {
        onReady: () => clearTimeout(video2.temporizador),        // el reproductor responde: se confía en el evento "terminó"
        onStateChange: (e) => { if(e.data === 0) videoTerminado(); }, // 0 = el video llegó al final
        onError: () => videoNoDisponible()
      }});
    } catch(err){ videoNoDisponible(); }
  };
  if(window.YT && window.YT.Player){ window.onYouTubeIframeAPIReady(); return; }
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  s.onerror = videoNoDisponible;
  document.head.appendChild(s);
}

function habilitarBotonVideo(mensaje){
  document.getElementById("btn-video-ok").disabled = false;
  if(mensaje) document.getElementById("video-ayuda").textContent = mensaje;
}
function videoTerminado(){
  clearTimeout(video2.temporizador);
  habilitarBotonVideo("✅ Video completo. Ya pueden armar la red trófica.");
  Sonido.reproducir("acierto");
}
function videoNoDisponible(){
  clearTimeout(video2.temporizador);
  video2.fallo = true;
  habilitarBotonVideo("No se pudo cargar el video en esta pantalla (¿sin internet?). Ábranlo con el botón " +
                      "«Abrir en YouTube» y, cuando terminen de verlo, sigan con la actividad.");
}
function pausarVideoEstacion2(){
  try { if(video2.player && video2.player.pauseVideo) video2.player.pauseVideo(); } catch(e){}
}

function mostrarActividadEstacion2(){
  pausarVideoEstacion2();
  document.getElementById("video2-bloque").classList.add("fase-oculta");
  document.getElementById("actividad2").classList.remove("fase-oculta");
  if(!video2.desbloqueada){ video2.desbloqueada = true; Sonido.reproducir("acierto"); }
}
function volverAlVideoEstacion2(){
  document.getElementById("actividad2").classList.add("fase-oculta");
  document.getElementById("video2-bloque").classList.remove("fase-oculta");
}

/* ------------------- PASO 2: TABLERO DE ARRASTRE (DnD) ------------------- */
function crearCartaDnd(el){
  const card = document.createElement("div");
  card.className = "dnd-card";
  card.dataset.id = el.id;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", el.nombre + ". Tarjeta para ubicar: Enter para elegirla.");
  card.innerHTML = `<span class="emoji" aria-hidden="true">${el.emoji}</span><h4>${el.nombre}</h4><p>${el.descripcion}</p>`;
  card.addEventListener("pointerdown", (e) => iniciarArrastre(e, card));
  card.addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " "){ e.preventDefault(); alternarSeleccion(card); }
  });
  return card;
}

function renderEstacion2(){
  const cadena = document.getElementById("cadena-2");
  const pool = document.getElementById("pool-2");
  const excluir = document.getElementById("excluir-2");
  cadena.innerHTML = ""; pool.innerHTML = ""; excluir.innerHTML = "";
  dnd.seleccionada = null;

  // Casilleros del camino de la energía: uno por cada elemento real
  const total = CONFIG.estacion2Elementos.length;
  for(let i = 1; i <= total; i++){
    const slot = document.createElement("div");
    slot.className = "slot zona-dnd";
    slot.dataset.zona = "slot"; slot.dataset.pos = i;
    slot.tabIndex = 0; slot.setAttribute("role", "group");
    slot.setAttribute("aria-label", `Casillero ${i} de ${total}`);
    slot.innerHTML = `<span class="slot-num">${i}</span>`;
    cadena.appendChild(slot);
  }

  // Todas las tarjetas empiezan mezcladas en la zona de "sin ubicar"
  barajar(elementosEstacion2()).forEach(el => pool.appendChild(crearCartaDnd(el)));

  document.getElementById("bio-progress-count-2").textContent = `0 / ${elementosEstacion2().length}`;
}

function actualizarSlots(){
  document.querySelectorAll("#actividad2 .slot").forEach(s => {
    s.classList.toggle("tiene-carta", !!s.querySelector(".dnd-card"));
  });
}

// Mueve una tarjeta a una zona. Si el casillero ya tenía una tarjeta, se intercambian.
function colocarCarta(card, zona){
  const origen = card.parentElement;
  if(zona === origen && zona.dataset.zona !== "slot") return;
  if(zona.dataset.zona === "slot"){
    const ocupante = zona.querySelector(".dnd-card");
    if(ocupante === card) return;
    if(ocupante){
      if(ocupante.classList.contains("correct")) return; // las tarjetas ya correctas no se desplazan
      const destino = origen.dataset.zona === "slot" ? origen : document.getElementById("pool-2");
      destino.appendChild(ocupante);
    }
  }
  zona.appendChild(card);
  Sonido.reproducir("soltar");
  actualizarSlots();
}

/* --- selección por toque / teclado --- */
function deseleccionar(){
  if(dnd.seleccionada) dnd.seleccionada.classList.remove("seleccionada");
  dnd.seleccionada = null;
}
function alternarSeleccion(card){
  if(card.classList.contains("correct")) return;
  if(dnd.seleccionada === card){ deseleccionar(); return; }
  deseleccionar();
  dnd.seleccionada = card;
  card.classList.add("seleccionada");
  Sonido.reproducir("agarrar");
}
function ubicarSeleccionadaEn(zona){
  if(!dnd.seleccionada) return;
  const card = dnd.seleccionada;
  deseleccionar();
  colocarCarta(card, zona);
}

/* --- arrastre con mouse, dedo o lápiz (Pointer Events) --- */
function iniciarArrastre(e, card){
  if(card.classList.contains("correct")) return;
  if(e.pointerType === "mouse" && e.button !== 0) return;
  const r = card.getBoundingClientRect();
  dnd.arrastre = { card, x0:e.clientX, y0:e.clientY, dx:e.clientX - r.left, dy:e.clientY - r.top, ghost:null, movido:false };
  document.addEventListener("pointermove", moverArrastre);
  document.addEventListener("pointerup", terminarArrastre);
  document.addEventListener("pointercancel", cancelarArrastre);
}
function zonaBajoPuntero(x, y){
  const el = document.elementFromPoint(x, y);
  return el ? el.closest("#actividad2 .zona-dnd") : null;
}
function resaltarZona(zona){
  document.querySelectorAll("#actividad2 .zona-dnd.sobre").forEach(z => { if(z !== zona) z.classList.remove("sobre"); });
  if(zona) zona.classList.add("sobre");
}
function moverArrastre(e){
  const a = dnd.arrastre; if(!a) return;
  if(!a.movido){
    if(Math.hypot(e.clientX - a.x0, e.clientY - a.y0) < 6) return; // umbral: distingue clic de arrastre
    a.movido = true;
    deseleccionar();
    const g = a.card.cloneNode(true);
    g.className = "dnd-card dnd-fantasma";
    g.style.width = a.card.offsetWidth + "px";
    document.body.appendChild(g);
    a.ghost = g;
    a.card.classList.add("arrastrando");
    Sonido.reproducir("agarrar");
    a.raf = requestAnimationFrame(bucleAutoScroll);
  }
  a.ultX = e.clientX; a.ultY = e.clientY;
  a.ghost.style.left = (e.clientX - a.dx) + "px";
  a.ghost.style.top  = (e.clientY - a.dy) + "px";
  resaltarZona(zonaBajoPuntero(e.clientX, e.clientY));
}

// Desplazamiento automático: mientras la tarjeta esté cerca del borde superior o inferior de la
// ventana, la página se mueve sola (aunque el mouse esté quieto). Cuanto más cerca del borde, más rápido.
function bucleAutoScroll(){
  const a = dnd.arrastre;
  if(!a || !a.movido) return;
  const margen = 100, h = window.innerHeight;
  let v = 0;
  if(a.ultY < margen)         v = -Math.ceil((margen - a.ultY) / 4);
  else if(a.ultY > h - margen) v =  Math.ceil((a.ultY - (h - margen)) / 4);
  if(v){
    window.scrollBy(0, v);
    resaltarZona(zonaBajoPuntero(a.ultX, a.ultY)); // al moverse la página, cambia lo que hay bajo el puntero
  }
  a.raf = requestAnimationFrame(bucleAutoScroll);
}
function limpiarArrastre(){
  document.removeEventListener("pointermove", moverArrastre);
  document.removeEventListener("pointerup", terminarArrastre);
  document.removeEventListener("pointercancel", cancelarArrastre);
  const a = dnd.arrastre;
  if(a){ if(a.raf) cancelAnimationFrame(a.raf); if(a.ghost) a.ghost.remove(); a.card.classList.remove("arrastrando"); }
  resaltarZona(null);
  dnd.arrastre = null;
  return a;
}
function terminarArrastre(e){
  const a = dnd.arrastre; if(!a) return;
  const zona = a.movido ? zonaBajoPuntero(e.clientX, e.clientY) : null;
  limpiarArrastre();
  if(!a.movido){ alternarSeleccion(a.card); }   // fue un toque, no un arrastre
  else if(zona){ colocarCarta(a.card, zona); }
}
function cancelarArrastre(){ limpiarArrastre(); }

/* --- verificación --- */
function verificarSecuenciaEstacion2(){
  const st = estado.estaciones.estacion2;
  if(st.resuelto) return;
  st.intentos += 1; // cada clic en "Verificar red trófica" cuenta como un intento

  const todas = elementosEstacion2();
  let correctas = 0, sinUbicar = 0, errores = 0;

  todas.forEach(el => {
    const card = document.querySelector(`#actividad2 .dnd-card[data-id="${el.id}"]`);
    if(card.classList.contains("correct")){ correctas += 1; return; }

    const zona = card.parentElement;
    const tipo = zona.dataset.zona;
    let ok = false;
    if(tipo === "slot")        ok = el.posicion !== "excluir" && parseInt(zona.dataset.pos, 10) === el.posicion;
    else if(tipo === "excluir") ok = el.posicion === "excluir";

    if(ok){
      card.classList.add("correct");
      card.tabIndex = -1;
      card.setAttribute("aria-label", el.nombre + ": ubicada correctamente");
      if(tipo === "slot") zona.classList.add("correcta");
      correctas += 1;
    } else if(tipo === "pool"){
      sinUbicar += 1;
    } else {
      errores += 1;
      card.classList.remove("incorrect");
      void card.offsetWidth; // reinicia la animación de "sacudida"
      card.classList.add("incorrect");
      setTimeout(() => card.classList.remove("incorrect"), 450);
    }
  });

  document.getElementById("bio-progress-count-2").textContent = `${correctas} / ${todas.length}`;
  actualizarRegistro();

  const feedbackEl = document.getElementById("feedback-2");
  if(correctas === todas.length){
    completarEstacion2();
  } else {
    Sonido.reproducir(errores > 0 ? "error" : "acierto");
    feedbackEl.textContent =
      `⚠ ${CONFIG.mensajes.redTroficaIncorrecta} (${correctas} de ${todas.length} correctas` +
      (sinUbicar ? `; ${sinUbicar} sin ubicar` : "") + `).`;
    feedbackEl.className = "feedback show bad";
  }
}

function completarEstacion2(){
  const st = estado.estaciones.estacion2;
  st.resuelto = true;

  const feedbackEl = document.getElementById("feedback-2");
  feedbackEl.textContent = `✅ Red trófica correcta. KRONOS-9 reconoce la clave ${CONFIG.claves.estacion2}.`;
  feedbackEl.className = "feedback show ok";

  Sonido.reproducir("acierto");
  Sonido.despues(350, "estacion_ok");
  document.getElementById("next-2").disabled = false;
  actualizarCodigo();
  actualizarRegistro();
}

function reiniciarEstacion2(){
  estado.estaciones.estacion2 = { intentos: 0, resuelto: false };
  pausarVideoEstacion2();
  try { if(video2.player && video2.player.seekTo) video2.player.seekTo(0); } catch(e){}
  video2.desbloqueada = false;

  const exigir = CONFIG.estacion2Video.exigirVerCompleto;
  document.getElementById("btn-video-ok").disabled = exigir && !video2.fallo;
  if(video2.iframeCreado && exigir && !video2.fallo){
    document.getElementById("video-ayuda").textContent = "Cuando el video termine se habilita el botón para seguir.";
  }
  document.getElementById("video2-bloque").classList.remove("fase-oculta");
  document.getElementById("actividad2").classList.add("fase-oculta");

  renderEstacion2();
  document.getElementById("feedback-2").className = "feedback";
  document.getElementById("next-2").disabled = true;
}

/* ============================================================================
   ESTACIÓN 3 · JUEGO "NÚCLEO 3R" (en 3 fases)
   Fase 1: clasificar residuos (reducir / reusar / reciclar).
   Fase 2: ordenar las 3R por prioridad — al completarla se revela el número
           final en el HUD, igual que en las otras estaciones.
   Fase 3: escribir a mano el código COMPLETO de la misión (K-#-E-#-#) para
           transmitirlo a KRONOS-9 y recién ahí pasar a la pantalla final.
   ============================================================================ */
const CATEGORIAS_3R = [
  { valor: "reducir",  etiqueta: "Reducir"  },
  { valor: "reusar",   etiqueta: "Reusar"   },
  { valor: "reciclar", etiqueta: "Reciclar" }
];

/* ---------- Fase 1: clasificación de residuos ---------- */
function renderEstacion3(){
  const cont = document.getElementById("waste-grid");
  cont.innerHTML = "";
  const residuosBarajados = barajar(CONFIG.estacion3Residuos); // orden distinto cada vez que se juega

  residuosBarajados.forEach(r => {
    const botones = CATEGORIAS_3R.map(cat =>
      `<button type="button" class="bio-btn opt-${cat.valor}" data-id="${r.id}" data-eleccion="${cat.valor}">${cat.etiqueta}</button>`
    ).join("");

    const card = document.createElement("div");
    card.className = "bio-card";
    card.id = "card-" + r.id;
    card.innerHTML = `
      <span class="bio-emoji" aria-hidden="true">${r.emoji}</span>
      <h4>${r.nombre}</h4>
      <p>${r.pista}</p>
      <div class="bio-actions three">${botones}</div>
      <span class="bio-status">✅ Clasificado correctamente</span>
    `;
    cont.appendChild(card);
  });

  cont.querySelectorAll(".bio-btn").forEach(btn => {
    btn.addEventListener("click", () => clasificarResiduoEstacion3(btn.dataset.id, btn.dataset.eleccion));
  });

  actualizarProgresoFaseA();
}

function clasificarResiduoEstacion3(id, eleccion){
  const st = estado.estaciones.estacion3;
  if(st.faseAResuelta) return; // esta fase ya se completó

  const cardEl = document.getElementById("card-" + id);
  if(cardEl.classList.contains("correct")) return;

  const residuo = CONFIG.estacion3Residuos.find(r => r.id === id);
  st.intentos += 1; // cada clic sobre una tarjeta cuenta como un intento

  if(eleccion === residuo.categoria){
    cardEl.classList.add("correct");
    cardEl.querySelectorAll(".bio-btn").forEach(b => b.disabled = true);
    st.correctasA = (st.correctasA || 0) + 1;
    Sonido.reproducir("acierto");
  } else {
    Sonido.reproducir("error");
    cardEl.classList.remove("incorrect");
    void cardEl.offsetWidth; // reinicia la animación de "sacudida"
    cardEl.classList.add("incorrect");
    setTimeout(() => cardEl.classList.remove("incorrect"), 450);
  }

  actualizarProgresoFaseA();
  actualizarRegistro();

  if((st.correctasA || 0) === CONFIG.estacion3Residuos.length){
    completarFaseClasificacion();
  }
}

function actualizarProgresoFaseA(){
  const st = estado.estaciones.estacion3;
  document.getElementById("bio-progress-count-3a").textContent =
    `${st.correctasA || 0} / ${CONFIG.estacion3Residuos.length}`;
}

function completarFaseClasificacion(){
  const st = estado.estaciones.estacion3;
  st.faseAResuelta = true;

  const feedbackEl = document.getElementById("feedback-3a");
  feedbackEl.textContent = "✅ Clasificación correcta. Avancen a la Fase 2: ordenar la jerarquía de las 3R.";
  feedbackEl.className = "feedback show ok";

  Sonido.despues(350, "estacion_ok");
  document.getElementById("fase3-b").classList.remove("fase-oculta");
  renderFaseJerarquia();
}

/* ---------- Fase 2: jerarquía de prioridad de las 3R ---------- */
function renderFaseJerarquia(){
  const cont = document.getElementById("jerarquia-grid");
  cont.innerHTML = "";
  const ordenVisual = barajar(CATEGORIAS_3R); // orden distinto cada vez que se juega

  ordenVisual.forEach(cat => {
    const card = document.createElement("div");
    card.className = "bio-card";
    card.id = "prio-" + cat.valor;
    card.innerHTML = `
      <h4>${cat.etiqueta}</h4>
      <p>¿En qué lugar de prioridad va esta estrategia?</p>
      <div class="bio-actions">
        <select class="bio-select" data-valor="${cat.valor}" aria-label="Prioridad de ${cat.etiqueta}">
          <option value="">Elegí un lugar…</option>
          <option value="1">1er lugar</option>
          <option value="2">2do lugar</option>
          <option value="3">3er lugar</option>
        </select>
      </div>
      <span class="bio-status">✅ Lugar correcto</span>
    `;
    cont.appendChild(card);
  });
}

function verificarJerarquia(){
  const st = estado.estaciones.estacion3;
  if(st.resuelto) return;
  st.intentos += 1; // cada clic en "Verificar orden" cuenta como un intento

  let correctas = 0;
  CATEGORIAS_3R.forEach(cat => {
    const card = document.getElementById("prio-" + cat.valor);
    if(card.classList.contains("correct")){ correctas += 1; return; }

    const select = card.querySelector(".bio-select");
    const valor = parseInt(select.value, 10);

    if(valor === CONFIG.estacion3PrioridadCorrecta[cat.valor]){
      card.classList.add("correct");
      select.disabled = true;
      correctas += 1;
    } else {
      card.classList.remove("incorrect");
      void card.offsetWidth; // reinicia la animación de "sacudida"
      card.classList.add("incorrect");
      setTimeout(() => card.classList.remove("incorrect"), 450);
    }
  });

  actualizarRegistro();

  const feedbackEl = document.getElementById("feedback-3b");
  if(correctas === CATEGORIAS_3R.length){
    completarFaseJerarquia();
  } else {
    Sonido.reproducir("error");
    feedbackEl.textContent =
      `⚠ ${CONFIG.mensajes.incorrecto} (${correctas} de ${CATEGORIAS_3R.length} en su lugar correcto).`;
    feedbackEl.className = "feedback show bad";
  }
}

function completarFaseJerarquia(){
  const st = estado.estaciones.estacion3;
  st.resuelto = true; // el número final ya se puede revelar en el HUD

  const feedbackEl = document.getElementById("feedback-3b");
  feedbackEl.textContent = `✅ Jerarquía correcta. KRONOS-9 reconoce el número final ${CONFIG.claves.estacion3}.`;
  feedbackEl.className = "feedback show ok";

  Sonido.reproducir("acierto");
  Sonido.despues(350, "estacion_ok");
  document.getElementById("fase3-c").classList.remove("fase-oculta");
  actualizarCodigo();
  actualizarRegistro();
}

/* ---------- Fase 3: transmisión manual del código completo ---------- */
function verificarCodigoFinal(){
  const st = estado.estaciones.final;
  if(st.resuelto) return;
  st.intentos += 1;

  const input = document.getElementById("input-final");
  const ingresado = normalizarCodigo(input.value);
  const esperado = normalizarCodigo(
    `${CONFIG.claves.estacion1}-${CONFIG.claves.estacion2}-${CONFIG.claves.estacion3}`
  );

  const feedbackEl = document.getElementById("feedback-3c");

  if(ingresado === esperado){
    st.resuelto = true;
    feedbackEl.textContent = "✅ Código verificado. Transmitiendo a KRONOS-9…";
    feedbackEl.className = "feedback show ok";
    Sonido.reproducir("acierto");
    actualizarRegistro();
    setTimeout(mostrarFinal, 700); // breve pausa para leer el mensaje antes de pasar a la pantalla final
  } else {
    feedbackEl.textContent =
      "⚠ Código incorrecto. Revisen el panel «Código de acceso» del costado y vuelvan a escribirlo completo.";
    Sonido.reproducir("error");
    feedbackEl.className = "feedback show bad";
    actualizarRegistro();
  }
}

function reiniciarEstacion3(){
  estado.estaciones.estacion3 = { intentos: 0, resuelto: false, correctasA: 0, faseAResuelta: false };
  renderEstacion3(); // Fase 1

  document.getElementById("feedback-3a").className = "feedback";
  document.getElementById("feedback-3b").className = "feedback";
  document.getElementById("feedback-3c").className = "feedback";
  document.getElementById("fase3-b").classList.add("fase-oculta");
  document.getElementById("fase3-c").classList.add("fase-oculta");
  document.getElementById("input-final").value = "";
}

// Sonido que suena al entrar a cada escena (definidos en CONFIG.sonidos.archivos)
const SONIDO_ESCENA = { "scene-1":"sala1", "scene-2":"sala2", "scene-3":"sala3", "scene-final":"victoria" };

function mostrarEscena(id, opciones){
  opciones = opciones || {};
  if(estado.escenaActual === "scene-2" && id !== "scene-2") pausarVideoEstacion2();
  document.querySelectorAll(".scene").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  estado.escenaActual = id;
  document.body.dataset.escena = id;   // el CSS cambia el color de acento según la estación
  actualizarStepper();
  if(id === "scene-2") prepararVideoEstacion2();
  if(!opciones.silencio && SONIDO_ESCENA[id]) Sonido.reproducir(SONIDO_ESCENA[id]);
  // Lleva el foco al inicio del panel para navegación por teclado / lectores de pantalla
  const panel = document.querySelector(`#${id} .panel`);
  if(panel){ panel.setAttribute("tabindex","-1"); panel.focus({preventScroll:false}); }
}

function actualizarStepper(){
  const indice = ORDEN_ESCENAS.indexOf(estado.escenaActual); // 0..4
  document.querySelectorAll(".step-dot").forEach((dot, i) => {
    const paso = i + 1; // 1..4 (inicio no tiene punto propio, arranca en estación 1)
    dot.classList.remove("done","active");
    if(indice > paso) dot.classList.add("done");
    else if(indice === paso) dot.classList.add("active");
  });
}

/* ============================================================================
   CÓDIGO ACUMULADO (HUD)
   ============================================================================ */
function actualizarCodigo(){
  const c1 = estado.estaciones.estacion1.resuelto ? CONFIG.claves.estacion1.split("-")[1] : "?";
  const c2 = estado.estaciones.estacion2.resuelto ? CONFIG.claves.estacion2.split("-")[1] : "?";
  const c3 = estado.estaciones.estacion3.resuelto ? CONFIG.claves.estacion3 : "?";

  setChip("k-n", c1, estado.estaciones.estacion1.resuelto);
  setChip("e-n", c2, estado.estaciones.estacion2.resuelto);
  setChip("final", c3, estado.estaciones.estacion3.resuelto);
}
function setChip(slot, valor, lleno){
  const el = document.querySelector(`.code-chip[data-slot="${slot}"]`);
  el.textContent = valor;
  el.classList.toggle("filled", !!lleno);
}

/* ============================================================================
   REGISTRO DE INTENTOS (evidencia para el/la docente)
   ============================================================================ */
const NOMBRES_ESTACION = {
  estacion1: "1 · Biodiversidad",
  estacion2: "2 · Red Energética",
  estacion3: "3 · Núcleo 3R",
  final: "Transmisión final"
};

function actualizarRegistro(){
  const tbody = document.getElementById("log-body");
  tbody.innerHTML = "";
  Object.keys(estado.estaciones).forEach(key => {
    const st = estado.estaciones[key];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${NOMBRES_ESTACION[key]}</td>
      <td>${st.intentos}</td>
      <td><span class="state-pill ${st.resuelto ? "solved" : "pending"}">
            ${st.resuelto ? "Resuelto" : "Pendiente"}
          </span></td>`;
    tbody.appendChild(tr);
  });
}

/* ============================================================================
   TEMPORIZADOR DE MISIÓN
   ============================================================================ */
function iniciarTimer(){
  estado.inicioTiempo = Date.now();
  estado.intervaloTimer = setInterval(() => {
    const seg = Math.floor((Date.now() - estado.inicioTiempo) / 1000);
    const mm = String(Math.floor(seg / 60)).padStart(2, "0");
    const ss = String(seg % 60).padStart(2, "0");
    document.getElementById("timer-display").textContent = `${mm}:${ss}`;
  }, 1000);
}
function detenerTimer(){
  clearInterval(estado.intervaloTimer);
  estado.finTiempo = Date.now();
}
function tiempoTotalTexto(){
  const seg = Math.floor((estado.finTiempo - estado.inicioTiempo) / 1000);
  const mm = String(Math.floor(seg / 60)).padStart(2, "0");
  const ss = String(seg % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/* ============================================================================
   PANTALLA FINAL
   ============================================================================ */
function mostrarFinal(){
  detenerTimer();
  const codigoFinal = `${CONFIG.claves.estacion1}-${CONFIG.claves.estacion2}-${CONFIG.claves.estacion3}`;
  document.getElementById("final-code-display").textContent = codigoFinal;

  const totalIntentos = Object.values(estado.estaciones).reduce((acc, s) => acc + s.intentos, 0);
  const grid = document.getElementById("summary-grid");
  grid.innerHTML = `
    <div class="summary-item"><div class="num">${tiempoTotalTexto()}</div><div class="lbl">Tiempo total</div></div>
    <div class="summary-item"><div class="num">${totalIntentos}</div><div class="lbl">Intentos totales</div></div>
    <div class="summary-item"><div class="num">3 / 3</div><div class="lbl">Estaciones resueltas</div></div>
  `;
  mostrarEscena("scene-final");
}

/* ============================================================================
   REINICIO (para que el mismo dispositivo se use con el próximo equipo)
   ============================================================================ */
function reiniciarMision(){
  Object.keys(estado.estaciones).forEach(k => { estado.estaciones[k] = { intentos:0, resuelto:false }; });
  reiniciarEstacion1(); // la Estación 1 es un juego de tarjetas, no un campo de texto
  reiniciarEstacion2(); // la Estación 2 es un juego de secuenciación, no un campo de texto
  reiniciarEstacion3(); // la Estación 3 es un juego de clasificación 3R, no un campo de texto
  actualizarCodigo();
  actualizarRegistro();
  clearInterval(estado.intervaloTimer);
  document.getElementById("timer-display").textContent = "00:00";
  Sonido.reiniciarMusica(); // la música vuelve a empezar desde el principio para el próximo equipo
  mostrarEscena("scene-inicio");
}

/* ============================================================================
   EVENTOS
   ============================================================================ */
document.getElementById("btn-start").addEventListener("click", () => {
  iniciarTimer();
  Sonido.reproducir("inicio");        // arranque de la misión
  Sonido.despues(1400, "sala1");      // y enseguida el sonido de la Estación 1
  Sonido.iniciarMusica();             // música de fondo en loop durante toda la experiencia
  mostrarEscena("scene-1", { silencio: true });
});

// Estación 2: video previo, tablero de arrastre y verificación
document.getElementById("btn-video-ok").addEventListener("click", mostrarActividadEstacion2);
document.getElementById("btn-ver-video").addEventListener("click", volverAlVideoEstacion2);
document.getElementById("btn-verificar-2").addEventListener("click", verificarSecuenciaEstacion2);
(function(){
  // Un solo par de listeners (delegados) para tocar/teclear sobre las zonas del tablero
  const actividad = document.getElementById("actividad2");
  actividad.addEventListener("click", (e) => {
    if(e.target.closest(".dnd-card")) return;              // las tarjetas se manejan con sus propios eventos
    const zona = e.target.closest(".zona-dnd");
    if(zona) ubicarSeleccionadaEn(zona);
  });
  actividad.addEventListener("keydown", (e) => {
    if((e.key === "Enter" || e.key === " ") && e.target.classList.contains("zona-dnd")){
      e.preventDefault();
      ubicarSeleccionadaEn(e.target);
    }
  });
})();

document.getElementById("form-3b").addEventListener("submit", (e) => {
  e.preventDefault();
  verificarJerarquia();
});

document.getElementById("form-3c").addEventListener("submit", (e) => {
  e.preventDefault();
  verificarCodigoFinal();
});

document.getElementById("next-1").addEventListener("click", () => mostrarEscena("scene-2"));
document.getElementById("next-2").addEventListener("click", () => mostrarEscena("scene-3"));

document.querySelectorAll("[data-goto]").forEach(btn => {
  btn.addEventListener("click", () => mostrarEscena(btn.dataset.goto));
});

document.getElementById("btn-reset").addEventListener("click", reiniciarMision);

// Completa los textos que vienen de config.js (número y lugar del documento confidencial)
function aplicarTextosConfig(){
  const d = CONFIG.estacion1Documento;
  document.querySelectorAll('[data-cfg="doc-numero"]').forEach(el => { el.textContent = d.numero; });
  document.querySelectorAll('[data-cfg="doc-ubicacion"]').forEach(el => { el.textContent = d.ubicacion; });
}

// Estado inicial del registro, del código y de los juegos de las Estaciones 1, 2 y 3 al cargar la página
document.body.dataset.escena = "scene-inicio";
aplicarTextosConfig();
renderEstacion1();
renderEstacion2();
renderEstacion3();
actualizarCodigo();
actualizarRegistro();
actualizarStepper();
