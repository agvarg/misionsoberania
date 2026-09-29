/* ============================================================================
   CONFIGURACIÓN EDITABLE POR EL / LA DOCENTE
   Todas las claves y textos importantes están agrupados acá arriba.
   Para cambiar una clave o un texto, solo hay que editar este bloque:
   no hace falta tocar el resto del código.
   ============================================================================ */
const CONFIG = {

  // Claves correctas de cada estación (podés cambiarlas sin tocar nada más)
  claves: {
    estacion1: "K-8",   // Escena 1 · El Filtro de Biodiversidad
    estacion2: "E-8",   // Escena 2 · La Red Energética y Temporal
    estacion3: "4"      // Escena 3 · Núcleo 3R (solo el número final)
  },

  // Mensajes de feedback (se pueden personalizar por estación si se desea)
  mensajes: {
    correcto: "Clave aceptada. KRONOS-9 reconoce el fragmento de código.",
    incorrecto: "Clave no reconocida por el sistema. Revisen la pista de la estación y vuelvan a intentar.",
    redTroficaIncorrecta: "La red trófica todavía no es correcta. Revisen el video y muevan las tarjetas mal ubicadas o sin ubicar."
  },

  // ---------------------------------------------------------------------------
  // SONIDOS (los archivos están en la carpeta /sonidos)
  // ---------------------------------------------------------------------------
  sonidos: {
    activadoAlInicio: true,   // false = arranca en silencio (se activa con el botón del encabezado)
    volumen: 0.7,             // volumen general, de 0 (mudo) a 1 (máximo)
    carpeta: "sonidos",
    // nombre interno -> archivo. Para usar tus propios sonidos, reemplazá el archivo o cambiá el nombre acá.
    archivos: {
      inicio:      "inicio.wav",       // al iniciar la misión
      sala1:       "sala1.wav",        // al entrar a la Estación 1
      sala2:       "sala2.wav",        // al entrar a la Estación 2
      sala3:       "sala3.wav",        // al entrar a la Estación 3
      acierto:     "acierto.wav",      // respuesta correcta
      error:       "error.wav",        // respuesta incorrecta
      estacion_ok: "estacion_ok.wav",  // estación o fase completada
      victoria:    "victoria.wav",     // Banco de Semillas liberado
      agarrar:     "agarrar.wav",      // al levantar una tarjeta (Estación 2)
      soltar:      "soltar.wav"        // al soltar una tarjeta (Estación 2)
    },
    // Ajuste fino de volumen por sonido (1 = igual que el general)
    ajusteVolumen: { error: 0.6, agarrar: 0.5, soltar: 0.6 },

    // Música de fondo: suena en loop desde que arranca la misión hasta el final.
    musica: {
      archivo: "musica_fondo.wav",
      volumen: 0.35,            // bien por debajo de los efectos, para no tapar la conversación del aula
      activadaAlInicio: true    // false = arranca sin música (se activa con el botón "Música" del encabezado)
    }
  },

  // ---------------------------------------------------------------------------
  // ESTACIÓN 1 · documento impreso que el equipo consulta en el aula
  // ---------------------------------------------------------------------------
  estacion1Documento: {
    numero: "0075",
    ubicacion: "la caja de seguridad del aula"
  },

  // ---------------------------------------------------------------------------
  // ESTACIÓN 2 · video que se ve ANTES de armar la red trófica
  // El ID es lo que aparece después de "v=" en la dirección de YouTube.
  // ---------------------------------------------------------------------------
  estacion2Video: {
    id: "c7xmWIQiqa8",
    exigirVerCompleto: true,   // true = la actividad se habilita al terminar el video
    segundosSiFallaElVideo: 20 // si el video no se puede cargar, se habilita el botón tras estos segundos
  },

  // Tarjetas del juego de la Estación 1 ("El Filtro de Biodiversidad").
  // Para agregar, sacar o cambiar una especie, solo hay que editar esta lista.
  // "tipo" debe ser exactamente "nativa" o "exotica".
  estacion1Tarjetas: [
    { id:"c1",  nombre:"Ceibo",                   emoji:"🌺", pista:"Árbol de flores rojas, típico de las costas del río.", tipo:"nativa" },
    { id:"c2",  nombre:"Sauce criollo",           emoji:"🌳", pista:"Tolera las inundaciones y sostiene las orillas con sus raíces.", tipo:"nativa" },
    { id:"c3",  nombre:"Camalote",                emoji:"🌿", pista:"Planta flotante que forma islas vegetales en el río.", tipo:"nativa" },
    { id:"c4",  nombre:"Carpincho",                emoji:"🐹", pista:"El roedor más grande del mundo, siempre cerca del agua.", tipo:"nativa" },
    { id:"c5",  nombre:"Coipo",                    emoji:"🐭", pista:"Roedor semiacuático de dientes anaranjados.", tipo:"nativa" },
    { id:"c6",  nombre:"Yacaré overo",             emoji:"🐊", pista:"Reptil de los humedales, amenazado por la caza furtiva.", tipo:"nativa" },
    { id:"c7",  nombre:"Ligustro",                 emoji:"🌱", pista:"Arbusto traído de Asia que desplaza al monte nativo.", tipo:"exotica" },
    { id:"c8",  nombre:"Jabalí europeo",           emoji:"🐗", pista:"Mamífero introducido para la caza; remueve y erosiona el suelo.", tipo:"exotica" },
    { id:"c9",  nombre:"Mejillón dorado",          emoji:"🦪", pista:"Molusco llegado en barcos; tapa cañerías y desplaza fauna nativa.", tipo:"exotica" },
    { id:"c10", nombre:"Tortuga de orejas rojas",  emoji:"🐢", pista:"Mascota liberada que compite con las tortugas locales.", tipo:"exotica" }
  ],

  // Elementos REALES del flujo de energía de la Estación 2 ("La Red Energética y Temporal").
  // "posicion" es el lugar correcto en la secuencia (1 a 6, sin repetir).
  // Los casilleros del tablero se generan solos según la cantidad de elementos.
  estacion2Elementos: [
    { id:"e1", nombre:"Sol (energía solar)",        emoji:"☀️", descripcion:"Fuente primaria de energía que llega al ecosistema.", posicion:1 },
    { id:"e2", nombre:"Productores",                 emoji:"🌿", descripcion:"Camalotes, algas y plantas captan la energía solar por fotosíntesis.", posicion:2 },
    { id:"e3", nombre:"Consumidores primarios",      emoji:"🐹", descripcion:"Herbívoros, como el carpincho, se alimentan de los productores.", posicion:3 },
    { id:"e4", nombre:"Consumidores secundarios",    emoji:"🐊", descripcion:"Carnívoros, como el yacaré, se alimentan de los consumidores primarios.", posicion:4 },
    { id:"e5", nombre:"Consumidores terciarios",     emoji:"🦅", descripcion:"Grandes predadores, como aves rapaces, que se alimentan de otros carnívoros.", posicion:5 },
    { id:"e6", nombre:"Descomponedores",             emoji:"🍄", descripcion:"Hongos y bacterias degradan la materia orgánica y devuelven nutrientes al ecosistema.", posicion:6 }
  ],

  // Tarjetas INTRUSAS de la Estación 2: no forman parte del flujo de energía.
  // El equipo debe reconocerlas y llevarlas a la zona "No pertenece a la secuencia".
  // Se pueden agregar o quitar libremente; hacen la actividad más difícil.
  estacion2Intrusos: [
    { id:"i1", nombre:"Quema de basura a cielo abierto", emoji:"🔥", descripcion:"Libera gases contaminantes, pero no es un paso del flujo natural de energía.", posicion:"excluir" },
    { id:"i2", nombre:"Erosión del suelo",               emoji:"🌪️", descripcion:"Es un problema ambiental, no una etapa de la cadena alimentaria.", posicion:"excluir" },
    { id:"i3", nombre:"Extinción de una especie",        emoji:"⚠️", descripcion:"Es una consecuencia posible, no un paso del flujo de energía.", posicion:"excluir" }
  ],

  // Residuos de la Fase 1 de la Estación 3 ("Núcleo 3R"). "categoria" debe ser
  // exactamente "reducir", "reusar" o "reciclar". Se puede agregar, quitar o
  // cambiar residuos libremente.
  estacion3Residuos: [
    { id:"r1",  nombre:"Bolsa plástica de un solo uso",     emoji:"🛍️", pista:"Se entrega en un comercio y se tira después de un solo uso.", categoria:"reducir" },
    { id:"r2",  nombre:"Vaso descartable",                   emoji:"🥤", pista:"Se usa unos minutos y enseguida se convierte en basura.", categoria:"reducir" },
    { id:"r3",  nombre:"Envoltorio individual de golosina",  emoji:"🍬", pista:"Genera residuo aunque lo que envuelve dure solo un instante.", categoria:"reducir" },
    { id:"r4",  nombre:"Cubiertos plásticos descartables",   emoji:"🍴", pista:"Se usan una sola vez y después se tiran.", categoria:"reducir" },
    { id:"r5",  nombre:"Frasco de vidrio",                   emoji:"🫙", pista:"Se puede lavar y volver a llenar muchas veces.", categoria:"reusar" },
    { id:"r6",  nombre:"Caja de cartón fuerte",              emoji:"📦", pista:"Sirve para guardar o mudar cosas antes de descartarla.", categoria:"reusar" },
    { id:"r7",  nombre:"Ropa en buen estado",                emoji:"👕", pista:"Puede donarse o intercambiarse en vez de tirarse.", categoria:"reusar" },
    { id:"r8",  nombre:"Hoja de papel usada de un solo lado",emoji:"📄", pista:"Antes de reciclarla, todavía se puede aprovechar la otra cara.", categoria:"reusar" },
    { id:"r9",  nombre:"Lata de aluminio",                   emoji:"🥫", pista:"Se separa para fundirse y convertirse en metal nuevo.", categoria:"reciclar" },
    { id:"r10", nombre:"Botella de plástico PET",            emoji:"🧴", pista:"Se procesa para fabricar fibra textil o nuevos envases.", categoria:"reciclar" },
    { id:"r11", nombre:"Papel y cartón rotos",               emoji:"♻️", pista:"Ya no sirven para reusar, pero sí como materia prima.", categoria:"reciclar" },
    { id:"r12", nombre:"Pilas usadas",                       emoji:"🔋", pista:"Contienen metales pesados; hay que juntarlas en puntos especiales.", categoria:"reciclar" }
  ],

  // Orden de prioridad correcto de la Fase 2 de la Estación 3 (1 = se aplica primero).
  estacion3PrioridadCorrecta: { reducir: 1, reusar: 2, reciclar: 3 }
};

