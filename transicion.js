const INICIO_ARRUGAR = 0;      
const FIN_ARRUGAR = 1.5; 
const INICIO_DESARRUGAR = 1.5;

const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- DETECCIÓN REAL DE TRANSPARENCIA ---

function DetectWebMAlpha() {
  return new Promise((resolve, reject) => {
    try {
      var video = document.createElement("video");
      video.autoplay = false;
      video.loop = false;
      video.style.display = "none";

      function AddElement() { document.body.appendChild(video); }
      function RemoveElement() { if (video.parentNode) document.body.removeChild(video); }

      video.addEventListener("loadeddata", function() {
        RemoveElement();
        var canvas = document.createElement("canvas");
        var context = canvas.getContext && canvas.getContext("2d");

        if (!context) {
          reject();
        } else {
          context.fillStyle = "white";
          context.rect(0, 0, 64, 64);
          context.fill();
          context.drawImage(video, 0, 0);

          var topLeftPixel = context.getImageData(2, 2, 1, 1);
          var blendResult = topLeftPixel.data[0];

          if ((blendResult > 180) && (blendResult < 200)) resolve();
          else reject();
        }
      });

      video.addEventListener("error", () => { RemoveElement(); reject(); });
      video.addEventListener("stalled", () => { RemoveElement(); reject(); });
      video.addEventListener("abort", () => { RemoveElement(); reject(); });

      var source = document.createElement("source");
      source.src = "data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAIREU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggEpTbuMU6uEHFO7a1OsggH77AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNjAuMTYuMTAwV0GNTGF2ZjYwLjE2LjEwMESJiEBEAAAAAAAAFlSua8yuAQAAAAAAAEPXgQFzxYgVQM9yjABNrpyBACK1nIN1bmSIgQCGhVZfVlA5g4EBI+ODhAJiWgDglLCBQLqBQJqBAlPAgQFVsIRVuYEBElTDZ0CAc3OgY8CAZ8iaRaOHRU5DT0RFUkSHjUxhdmY2MC4xNi4xMDBzc9pjwItjxYgVQM9yjABNrmfIpUWjh0VOQ09ERVJEh5hMYXZjNjAuMzEuMTAyIGxpYnZweC12cDlnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAwLjA0MDAwMDAwMAAfQ7Z1x+eBAKDCoZ+BAAAAgkmDQgAD8AP2ADgkHBhKAAAwYAAAE7gYAAAAdaGeppzugQGll4JJg0IAA/AD9gA4JBwYSgAAMGAAAE+AHFO7a5G7j7OBALeK94EB8YIBr/CBAw==";
      source.addEventListener("error", () => { RemoveElement(); reject(); });

      video.appendChild(source);
      AddElement();
    } catch (e) {
      reject(e);
    }
  });
}

function DetectHEVCAlpha() {
  const v = document.createElement('video');
  const checkMp4 = v.canPlayType('video/mp4; codecs="hvc1"');
  const checkQuicktime = v.canPlayType('video/quicktime; codecs="hvc1"');
  const checkMp4Full = v.canPlayType('video/mp4; codecs="hvc1.2.4.L153.b0"');
  
  return (checkMp4 === 'probably' || checkMp4 === 'maybe' ||
          checkQuicktime === 'probably' || checkQuicktime === 'maybe' ||
          checkMp4Full === 'probably' || checkMp4Full === 'maybe');
}

async function evaluarSoporteAlfa() {
  if (DetectHEVCAlpha()) return true;
  try {
    await DetectWebMAlpha();
    return true;
  } catch (e) {
    return false;
  }
}

// --- LÓGICA DE CONTROL ---

let transicionHabilitada = false;

function desactivarOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.classList.remove('is-locked');
    overlay.classList.add('is-hidden');
  }
  transicionHabilitada = false;
}

document.addEventListener('DOMContentLoaded', async () => {
  const overlay = document.getElementById('transition-overlay');
  const video = document.getElementById('transition-video');
  const playBtn = document.getElementById('transition-play-btn');

  desactivarOverlay();

  if (prefiereMovimientoReducido) return;

  const soportaAlfa = await evaluarSoporteAlfa();
  if (!soportaAlfa) return;

  transicionHabilitada = true;
  overlay.classList.remove('is-hidden');
  overlay.classList.add('is-locked');

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;

  video.onerror = () => desactivarOverlay();

  video.onplaying = () => {
    if (playBtn) playBtn.style.display = 'none';
    overlay.classList.remove('is-locked');
  };

  video.onended = () => {
    overlay.classList.add('is-hidden'); 
  };

  // Función para arrancar la reproducción de DESARRUGAR en el instante correcto
  const iniciarDesarrugar = () => {
    video.currentTime = INICIO_DESARRUGAR;
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // CORRECCIÓN PARA iOS: Safari resetea currentTime a 0 al iniciar play().
        // Forzamos la posición del tiempo justo después de arrancar la reproducción.
        video.currentTime = INICIO_DESARRUGAR;
      }).catch(() => {
        if (playBtn) playBtn.style.display = 'block';
      });
    } else {
      if (playBtn) playBtn.style.display = 'block';
    }
  };

  if (video.readyState >= 1) {
    iniciarDesarrugar();
  } else {
    video.addEventListener('loadedmetadata', iniciarDesarrugar, { once: true });
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      playBtn.style.display = 'none';
      video.currentTime = INICIO_DESARRUGAR;
      video.play().then(() => {
        video.currentTime = INICIO_DESARRUGAR;
      }).catch(() => {
        desactivarOverlay();
      });
    });
  }
});

function cambiarPagina(event, destinoUrl) {
  event.preventDefault(); 
  
  const overlay = document.getElementById('transition-overlay');
  const video = document.getElementById('transition-video');

  if (!transicionHabilitada) {
    window.location.href = destinoUrl;
    return;
  }

  video.onended = null; // Desactivar el evento onended para que no oculte el overlay
  overlay.classList.remove('is-hidden');

  // Ajustar al tramo de ARRUGAR (0 a 1.5s)
  video.currentTime = INICIO_ARRUGAR;

  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      // Forzar que empiece en el segundo 0 si iOS intentó moverlo
      video.currentTime = INICIO_ARRUGAR;

      video.addEventListener('timeupdate', function alActualizarTiempo() {
        if (video.currentTime >= FIN_ARRUGAR) {
          video.removeEventListener('timeupdate', alActualizarTiempo);
          video.pause();
          overlay.classList.add('is-locked');
          window.location.href = destinoUrl;
        }
      });
    }).catch(() => {
      window.location.href = destinoUrl;
    });
  } else {
    window.location.href = destinoUrl;
  }
}

// Animación menú
const botonMenu = document.querySelector('.btn-hamburguesa');
const menuMovil = document.getElementById('menu-movil-lista');

if (botonMenu && menuMovil) {
  botonMenu.addEventListener('click', () => {
    const estaAbierto = botonMenu.getAttribute('aria-expanded') === 'true';
    botonMenu.setAttribute('aria-expanded', !estaAbierto);
    menuMovil.classList.toggle('menu-abierto', !estaAbierto); 
  });
}