document.getElementById('year').textContent = new Date().getFullYear();

// Rutas relativas desde /alianzas/ → ../images/
const partners = [
  { name: 'Konfío', slug: 'konfio', logo: 'https://static.wixstatic.com/media/84b48d_c3d0407487a44c8bac8cd9dd0bed9444~mv2.png/v1/fill/w_1000,h_563,al_c,q_90,usm_0.66_1.00_0.01/84b48d_c3d0407487a44c8bac8cd9dd0bed9444~mv2.png' },
  { name: 'PDN', slug: 'pdn', logo: '../images/logo-pdn.jpg' },
  { name: 'UNIFIN', slug: 'unifin', logo: '../images/logo-unifin.png' },
  { name: 'FinBe ABC', slug: 'finbe-abc', logo: '../images/logo-finbe-abc.png' },
  { name: 'Xepelin', slug: 'xepelin', logo: 'https://almomento.mx/wp-content/uploads/2024/02/Logotipo-Xepelin-Press-Kit-1-scaled.jpg' },
  { name: 'finkargo', slug: 'finkargo', logo: '../images/logo-finkargo.png' },
  { name: 'imagina LEASING', slug: 'imagina-leasing', logo: '../images/logo-imagina.png' },
  { name: 'Covalto', slug: 'covalto', logo: 'https://media.cdn.teamtailor.com/images/s3/teamtailor-production/logotype-v3/image_uploads/15e2f7f9-b5a4-476a-852c-c435bc8cc489/original.png' },
  { name: 'engen CAPITAL', slug: 'engen-capital', logo: '../images/logo-engen-capital.png' },
  { name: 'hey banco', slug: 'hey-banco', logo: '../images/logo-hey-banco.png' },
  { name: 'Anticipa', slug: 'anticipa', logo: 'https://www.credenza.mx/img/clients/ANTICIPA.png' },
  { name: 'axionex Financiera', slug: 'axionex-financiera', logo: '../images/logo-axionex.png' },
  { name: 'Bx+', slug: 'bx-plus', logo: '../images/logo-bxplus.png' },
  { name: 'Finsus', slug: 'finsus', logo: '../images/logo-finsus.png' },
  { name: 'Hay Cash', slug: 'hay-cash', logo: 'https://socasesores.com/oficinas/img/bancos/empresarial/HEY-CASH-color.png' },
  { name: 'BANORTE', slug: 'banorte', logo: '../images/logo-banorte.png' },
  { name: 'AFIRME', slug: 'afirme', logo: '../images/logo-afirme.png' },
  { name: 'Creze', slug: 'creze', logo: 'https://fincor.com.mx/wp-content/uploads/2019/08/creze222.png' },
];

document.getElementById('partner-count').textContent = partners.length;

const grid = document.getElementById('partners-grid');
const customCursor = document.getElementById('custom-cursor');

partners.forEach((p, i) => {
  const card = document.createElement('a');
  card.href = '/alianzas/' + p.slug + '/';
  card.className = 'partner-card';
  card.style.textDecoration = 'none';
  card.style.animationDelay = `${i * 0.045}s`;
  card.innerHTML = `
    <div class="partner-logo-wrap">
      <img src="${p.logo}" alt="${p.name}" loading="lazy" />
    </div>
    <p class="partner-name">${p.name}</p>
  `;
  grid.appendChild(card);

  // Eventos del Mouse para Animación Interactiva
  card.addEventListener('mouseenter', () => customCursor.classList.add('active'));
  card.addEventListener('mouseleave', () => customCursor.classList.remove('active'));
});

// Tracking global del cursor
document.addEventListener('mousemove', (e) => {
  customCursor.style.left = e.clientX + 'px';
  customCursor.style.top = e.clientY + 'px';
});

// Mobile Menu Logic
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
