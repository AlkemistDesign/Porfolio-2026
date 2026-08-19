const INICIO_ARRUGAR = 0;
const FIN_ARRUGAR = 1.5;
const INICIO_DESARRUGAR = 1.5;

// 1. DETECCIÓN DE PREFERENCIAS Y DISPOSITIVOS MÓVILES
const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Consideramos móvil si la pantalla mide menos de 768px
const esDispositivoMovil = window.matchMedia('(max-width: 767px)').matches; 

let transicionHabilitada = false;

// 2. SINGLETON PARA EL TEST DE VIDEO
let testVideoElement = null;

function getTestVideo() {
  if (!testVideoElement) testVideoElement = document.createElement('video');
  return testVideoElement;
}

function DetectWebMAlpha() {
  const v = getTestVideo();
  const canPlayWebM = v.canPlayType('video/webm; codecs="vp9, vp09.02.10.08"');
  return canPlayWebM === 'probably' || canPlayWebM === 'maybe';
}

function DetectHEVCAlpha() {
  const v = getTestVideo();
  const checkMp4 = v.canPlayType('video/mp4; codecs="hvc1"');
  const checkQuicktime = v.canPlayType('video/quicktime; codecs="hvc1"');
  return (checkMp4 === 'probably' || checkMp4 === 'maybe' ||
          checkQuicktime === 'probably' || checkQuicktime === 'maybe');
}

async function evaluarSoporteAlfa() {
  if (DetectHEVCAlpha() || DetectWebMAlpha()) return true;

  if ('mediaCapabilities' in navigator) {
    try {
      const result = await navigator.mediaCapabilities.decodingInfo({
        type: 'file',
        video: { contentType: 'video/webm; codecs="vp09.00.10.08"', width: 64, height: 64, bitrate: 10000, framerate: 30 }
      });
      return result.supported;
    } catch (e) {
      return false;
    }
  }
  return false;
}

function desactivarOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.classList.remove('is-locked');
    overlay.classList.add('is-hidden');
  }
  transicionHabilitada = false;
}

// 3. INICIALIZACIÓN OPTIMIZADA
function inicializarTransicion() {
  const overlay = document.getElementById('transition-overlay');
  const video = document.getElementById('transition-video');
  const playBtn = document.getElementById('transition-play-btn');

  // CANCELACIÓN RÁPIDA: Si es móvil, prefiere movimiento reducido o no hay video
  if (esDispositivoMovil || prefiereMovimientoReducido || !overlay || !video) {
    desactivarOverlay();
    return;
  }

  evaluarSoporteAlfa().then(soportaAlfa => {
    if (!soportaAlfa) {
      desactivarOverlay();
      return;
    }

    transicionHabilitada = true;
    overlay.classList.remove('is-hidden');
    overlay.classList.add('is-locked');

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    video.onerror = desactivarOverlay;
    video.onplaying = () => {
      if (playBtn) playBtn.style.display = 'none';
      overlay.classList.remove('is-locked');
    };
    video.onended = () => overlay.classList.add('is-hidden');

    const iniciarDesarrugar = () => {
      video.currentTime = INICIO_DESARRUGAR;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          video.currentTime = INICIO_DESARRUGAR;
        }).catch(() => {
          if (playBtn) playBtn.style.display = 'block';
        });
      } else if (playBtn) {
        playBtn.style.display = 'block';
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
        }).catch(desactivarOverlay);
      });
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarTransicion);
} else {
  inicializarTransicion();
}

// 4. NAVEGACIÓN ENTRE PÁGINAS
window.cambiarPagina = function(event, destinoUrl) {
  event.preventDefault(); 
  const overlay = document.getElementById('transition-overlay');
  const video = document.getElementById('transition-video');

  // Si está deshabilitado (como en móviles), redirige de inmediato sin delay
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
      
      const monitorearProgreso = () => {
        if (video.currentTime >= FIN_ARRUGAR) {
          video.pause();
          overlay.classList.add('is-locked');
          window.location.href = destinoUrl;
        } else {
          (video.requestVideoFrameCallback || requestAnimationFrame).call(video, monitorearProgreso);
        }
      };
      (video.requestVideoFrameCallback || requestAnimationFrame).call(video, monitorearProgreso);
    }).catch(() => {
      window.location.href = destinoUrl;
    });
  } else {
    window.location.href = destinoUrl;
  }
};

// 5. MENÚ MOVIL
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