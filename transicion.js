const INICIO_ARRUGAR = 0;      
const FIN_ARRUGAR = 1.5; 
const INICIO_DESARRUGAR = 1.5;

const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('transition-overlay');
  const video = document.getElementById('transition-video');

  if (prefiereMovimientoReducido) {
    overlay.classList.remove('is-locked');
    overlay.classList.add('is-hidden');
    return;
  }

  overlay.classList.add('is-locked');
  video.currentTime = INICIO_DESARRUGAR;
  
  video.onplaying = () => {
    overlay.classList.remove('is-locked');
  };

  video.play().catch(() => {
    overlay.classList.remove('is-locked');
    overlay.classList.add('is-hidden');
  });

  video.onended = () => {
    overlay.classList.add('is-hidden'); 
  };
});

function cambiarPagina(event, destinoUrl) {
  event.preventDefault(); 
  
  const overlay = document.getElementById('transition-overlay');
  const video = document.getElementById('transition-video');

  if (prefiereMovimientoReducido) {
    overlay.classList.remove('is-hidden');
    overlay.classList.add('is-locked');
    setTimeout(() => {
      window.location.href = destinoUrl;
    }, 100); 
    return;
  }

  video.onended = null; 
  overlay.classList.remove('is-hidden');
  video.currentTime = INICIO_ARRUGAR;
  video.play().catch(() => {
    window.location.href = destinoUrl;
  });

  video.addEventListener('timeupdate', function alActualizarTiempo() {
    if (video.currentTime >= FIN_ARRUGAR) {
      video.removeEventListener('timeupdate', alActualizarTiempo);
      video.pause();
      overlay.classList.add('is-locked');
      window.location.href = destinoUrl;
    }
  });
}



// Animación menú
const botonMenu = document.querySelector('.btn-hamburguesa');
const menuMovil = document.getElementById('menu-movil-lista');

botonMenu.addEventListener('click', () => {
    const estaAbierto = botonMenu.getAttribute('aria-expanded') === 'true';
    
    botonMenu.setAttribute('aria-expanded', !estaAbierto);
    
    menuMovil.classList.toggle('menu-abierto', !estaAbierto); 
});