export function renderFamilyNav(container, { familyName, familyHref, siblings }) {
  const links = siblings
    .map((s) => `<a href="${s.href}"${s.current ? ' aria-current="page"' : ''}>${s.name}</a>`)
    .join('');
  container.innerHTML = `
    <nav class="family-nav">
      <a class="family-nav__back" href="${familyHref}">&larr; ${familyName}</a>
      <div class="family-nav__siblings">${links}</div>
    </nav>
  `;
}
