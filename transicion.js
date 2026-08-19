const INICIO_ARRUGAR = 0;
const FIN_ARRUGAR = 1.5;
const INICIO_DESARRUGAR = 1.5;

const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- DETECCIÓN RÁPIDA DE TRANSPARENCIA (SIN CANVAS / SIN INYECCIÓN EN DOM) ---

function DetectWebMAlpha() {
  const v = document.createElement('video');
  // VP9 con canal Alfa (profile 2/3 o vp09.02.xx)
  const canPlayWebM = v.canPlayType('video/webm; codecs="vp9, vp09.02.10.08"');
  return canPlayWebM === 'probably' || canPlayWebM === 'maybe';
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
  // Evaluaciones instantáneas en CPU
  if (DetectHEVCAlpha() || DetectWebMAlpha()) {
    return true;
  }

  // Fallback con la API moderna Media Capabilities (asíncrona y ultra rápida)
  if ('mediaCapabilities' in navigator) {
    try {
      const result = await navigator.mediaCapabilities.decodingInfo({
        type: 'file',
        video: {
          contentType: 'video/webm; codecs="vp09.00.10.08"',
          width: 64,
          height: 64,
          bitrate: 10000,
          framerate: 30
        }
      });
      return result.supported;
    } catch (e) {
      return false;
    }
  }

  return false;
}

// --- LÓGICA DE CONTROL DE TRANSICIÓN ---

let transicionHabilitada = false;

function desactivarOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.classList.remove('is-locked');
    overlay.classList.add('is-hidden');
  }
  transicionHabilitada = false;
}

// Inicialización de la transición cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
  const overlay = document.getElementById('transition-overlay');
  const video = document.getElementById('transition-video');
  const playBtn = document.getElementById('transition-play-btn');

  desactivarOverlay();

  if (prefiereMovimientoReducido || !overlay || !video) return;

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

  const iniciarDesarrugar = () => {
    video.currentTime = INICIO_DESARRUGAR;
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Corrección para iOS: reasegurar la posición del tiempo tras arrancar
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

// Función global para navegación de páginas
function cambiarPagina(event, destinoUrl) {
  event.preventDefault(); 
  
  const overlay = document.getElementById('transition-overlay');
  const video = document.getElementById('transition-video');

  if (!transicionHabilitada || !overlay || !video) {
    window.location.href = destinoUrl;
    return;
  }

  video.onended = null;
  overlay.classList.remove('is-hidden');

  video.currentTime = INICIO_ARRUGAR;

  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      video.currentTime = INICIO_ARRUGAR;

      // Optimización: Uso de requestVideoFrameCallback o requestAnimationFrame
      const monitorearProgreso = () => {
        if (video.currentTime >= FIN_ARRUGAR) {
          video.pause();
          overlay.classList.add('is-locked');
          window.location.href = destinoUrl;
        } else {
          if ('requestVideoFrameCallback' in video) {
            video.requestVideoFrameCallback(monitorearProgreso);
          } else {
            requestAnimationFrame(monitorearProgreso);
          }
        }
      };

      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(monitorearProgreso);
      } else {
        requestAnimationFrame(monitorearProgreso);
      }

    }).catch(() => {
      window.location.href = destinoUrl;
    });
  } else {
    window.location.href = destinoUrl;
  }
}

// --- MENÚ DE NAVEGACIÓN (EJECUCIÓN INMEDIATA E INDEPENDIENTE) ---
(function inicializarMenu() {
  const ejecutar = () => {
    const botonMenu = document.querySelector('.btn-hamburguesa');
    const menuMovil = document.getElementById('menu-movil-lista');

    if (botonMenu && menuMovil) {
      botonMenu.addEventListener('click', () => {
        const estaAbierto = botonMenu.getAttribute('aria-expanded') === 'true';
        botonMenu.setAttribute('aria-expanded', !estaAbierto);
        menuMovil.classList.toggle('menu-abierto', !estaAbierto); 
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ejecutar);
  } else {
    ejecutar();
  }
})();