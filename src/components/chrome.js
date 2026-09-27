export function renderHero(container, { eyebrow, title, lede }) {
  container.innerHTML = `
    <div class="hero">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p class="lede">${lede}</p>
    </div>
  `;
}

export function renderMiniHeader(container, { title, backHref, backLabel, siblings, base = import.meta.env.BASE_URL }) {
  const back = backHref
    ? `<a class="mini-header__back" href="${backHref}">&larr; ${backLabel || 'Back'}</a>`
    : '';
  const siblingLinks = (siblings || []).filter((s) => !s.current);
  const siblingNav = siblingLinks.length
    ? `<div class="mini-header__siblings">${siblingLinks.map((s) => `<a href="${s.href}">${s.name}</a>`).join('')}</div>`
    : '';
  container.innerHTML = `
    <header class="mini-header">
      ${back}
      <a class="mini-header__home" href="${base}index.html">IB Econ Graphs</a>
      <span class="mini-header__title">${title}</span>
      ${siblingNav}
    </header>
  `;
}
