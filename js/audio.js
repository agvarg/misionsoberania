/* ============================================================================
   AUDIO · Misión Soberanía Vital 2050
   Reproduce los efectos y la música de fondo de la carpeta /sonidos. No hace
   falta editar este archivo: para cambiar un sonido, reemplazá el archivo por
   otro con el MISMO nombre (o cambiá el nombre en CONFIG.sonidos, en config.js).

   Nota: los navegadores no permiten reproducir audio hasta que la persona
   hace un primer clic en la página. Por eso todo el audio (efectos y música)
   arranca recién al apretar "Iniciar protocolo de acceso".

   La música de fondo se reproduce con la Web Audio API (no con un simple
   <audio loop>) para que el loop sea "sample-exacto": sin el clic o el
   silencio de medio segundo que suelen tener los navegadores al repetir un
   audio común, algo que se nota mucho en una música que da vueltas durante
   toda una clase.
   ============================================================================ */
const Sonido = (function(){
  const cfg = CONFIG.sonidos;
  let activado = cfg.activadoAlInicio;
  const cache = {};

  // Precarga suave de los EFECTOS: crea los elementos <audio> sin reproducirlos
  Object.keys(cfg.archivos).forEach(nombre => {
    try {
      const a = new Audio(cfg.carpeta + "/" + cfg.archivos[nombre]);
      a.preload = "auto";
      cache[nombre] = a;
    } catch(e) { /* sin audio disponible: el juego funciona igual, en silencio */ }
  });

  function reproducir(nombre){
    if(!activado || !cache[nombre]) return;
    try {
      // Se clona el elemento para permitir sonidos superpuestos (p. ej. dos aciertos seguidos)
      const a = cache[nombre].cloneNode();
      const ajuste = cfg.ajusteVolumen[nombre] !== undefined ? cfg.ajusteVolumen[nombre] : 1;
      a.volume = Math.min(1, cfg.volumen * ajuste);
      const p = a.play();
      if(p && p.catch) p.catch(() => {}); // el navegador puede bloquearlo: no es un error del juego
    } catch(e) {}
  }

  function despues(ms, nombre){ setTimeout(() => api.reproducir(nombre), ms); }

  function alternar(){
    activado = !activado;
    actualizarBoton();
    if(activado) reproducir("acierto"); // pequeña confirmación al volver a activar
    return activado;
  }

  function actualizarBoton(){
    const btn = document.getElementById("btn-sonido");
    if(!btn) return;
    btn.setAttribute("aria-pressed", String(activado));
    btn.textContent = activado ? "🔊 Sonido: sí" : "🔇 Sonido: no";
  }

  /* ---------------------------------------------------------------------
     MÚSICA DE FONDO (loop continuo durante toda la experiencia)

     Hay dos formas de reproducirla, según cómo se haya abierto la página:
     - "buffer" (ideal): se descarga el archivo entero y se reproduce con
       AudioBufferSourceNode.loop = true. El loop es "sample-exacto", sin
       clics ni silencios. Esto requiere fetch(), que funciona cuando la
       página se sirve por http:// (por ejemplo, con los lanzadores
       "Iniciar" de la carpeta).
     - "elemento" (respaldo): un <audio loop> común conectado a la Web
       Audio API solo para poder controlar el volumen junto con los demás
       sonidos. Hace falta cuando la página se abrió con doble clic
       (dirección file://), porque ahí los navegadores bloquean fetch()
       por seguridad aunque el archivo esté en la misma carpeta. El loop
       es prácticamente igual de bueno para un .wav sin comprimir.
     --------------------------------------------------------------------- */
  let ctx = null, musicaGain = null, musicaBuffer = null, musicaFuente = null;
  let elementoMusica = null, modoMusica = null; // modoMusica: "buffer" | "elemento" | null
  let musicaActivada = cfg.musica ? cfg.musica.activadaAlInicio : false;
  let cargaMusica = null;

  function cargarMusica(){
    if(cargaMusica) return cargaMusica;               // ya se está cargando / ya cargó
    cargaMusica = (async () => {
      if(!cfg.musica) return;
      const ruta = cfg.carpeta + "/" + cfg.musica.archivo;
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        musicaGain = ctx.createGain();
        musicaGain.gain.value = musicaActivada ? cfg.musica.volumen : 0;
        musicaGain.connect(ctx.destination);
      } catch(e) { return; } // sin Web Audio disponible: el juego sigue funcionando igual, sin música

      try {
        // Plan A: descarga completa + loop sample-exacto (funciona sirviendo la página por http/https)
        const resp = await fetch(ruta);
        if(!resp.ok) throw new Error("HTTP " + resp.status);
        const arrayBuf = await resp.arrayBuffer();
        musicaBuffer = await ctx.decodeAudioData(arrayBuf);
        modoMusica = "buffer";
      } catch(e) {
        // Plan B: la página se abrió con doble clic (file://) y fetch() está bloqueado.
        // Un <audio> normal sí puede cargar un archivo local, así que lo usamos como
        // fuente de la Web Audio API para poder controlarle el volumen igual que al resto.
        try {
          elementoMusica = new Audio(ruta);
          elementoMusica.loop = true;
          elementoMusica.preload = "auto";
          const nodo = ctx.createMediaElementSource(elementoMusica);
          nodo.connect(musicaGain);
          modoMusica = "elemento";
        } catch(e2) { modoMusica = null; }
      }
    })();
    return cargaMusica;
  }

  // Arranca (o reinicia desde el principio) la reproducción del loop, en el modo que corresponda
  function reiniciarFuenteMusica(){
    if(modoMusica === "buffer"){
      if(!musicaBuffer || !ctx) return;
      if(musicaFuente){ try{ musicaFuente.stop(); } catch(e){} }
      musicaFuente = ctx.createBufferSource();
      musicaFuente.buffer = musicaBuffer;
      musicaFuente.loop = true;                 // loop nativo de Web Audio: sample-exacto, sin clics
      musicaFuente.connect(musicaGain);
      musicaFuente.start(0);
    } else if(modoMusica === "elemento" && elementoMusica){
      elementoMusica.currentTime = 0;
      const p = elementoMusica.play();
      if(p && p.catch) p.catch(() => {});
    }
  }

  // Se llama una sola vez, en el primer clic del usuario (arranque de la misión)
  function iniciarMusica(){
    cargarMusica().then(() => {
      if(!modoMusica) return;
      if(ctx.state === "suspended") ctx.resume();
      reiniciarFuenteMusica();
    });
  }

  // Vuelve a poner la música desde el principio (se usa al reiniciar la misión para el próximo equipo)
  function reiniciarMusica(){
    if(modoMusica) reiniciarFuenteMusica();
  }

  function alternarMusica(){
    musicaActivada = !musicaActivada;
    if(musicaGain && ctx) musicaGain.gain.setTargetAtTime(musicaActivada ? cfg.musica.volumen : 0, ctx.currentTime, 0.2);
    actualizarBotonMusica();
    return musicaActivada;
  }

  function actualizarBotonMusica(){
    const btn = document.getElementById("btn-musica");
    if(!btn) return;
    btn.setAttribute("aria-pressed", String(musicaActivada));
    btn.textContent = musicaActivada ? "🎵 Música: sí" : "🎵 Música: no";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btnS = document.getElementById("btn-sonido");
    if(btnS) btnS.addEventListener("click", alternar);
    actualizarBoton();

    const btnM = document.getElementById("btn-musica");
    if(btnM) btnM.addEventListener("click", alternarMusica);
    actualizarBotonMusica();
  });

  const api = { reproducir, despues, alternar, iniciarMusica, alternarMusica, reiniciarMusica };
  return api;
})();
