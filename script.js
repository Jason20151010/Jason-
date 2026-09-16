const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

menuButton?.addEventListener('click', () => {
  const open = siteNav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

siteNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});
