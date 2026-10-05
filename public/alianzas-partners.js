// Directorio /alianzas/. Las tarjetas ya vienen en el HTML (las genera generate-alianzas.mjs);
// aquí solo: año del pie, cursor animado y menú móvil.
document.getElementById('year').textContent = new Date().getFullYear();

const customCursor = document.getElementById('custom-cursor');

document.querySelectorAll('.partner-card').forEach((card) => {
  card.addEventListener('mouseenter', () => customCursor.classList.add('active'));
  card.addEventListener('mouseleave', () => customCursor.classList.remove('active'));
});

document.addEventListener('mousemove', (e) => {
  customCursor.style.left = e.clientX + 'px';
  customCursor.style.top = e.clientY + 'px';
});

const toggleBtn = document.getElementById('mobile-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const iconMenu = document.getElementById('icon-menu');
const iconClose = document.getElementById('icon-close');

toggleBtn.addEventListener('click', () => {
  mobileMenu.classList.toggle('active');
  if (mobileMenu.classList.contains('active')) {
    iconMenu.style.display = 'none';
    iconClose.style.display = 'block';
  } else {
    iconMenu.style.display = 'block';
    iconClose.style.display = 'none';
  }
});
