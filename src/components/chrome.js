export function renderHero(container, { eyebrow, title, lede }) {
  container.innerHTML = `
    <div class="hero">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p class="lede">${lede}</p>
    </div>
  `;
}

export function renderMiniHeader(container, { title }) {
  container.innerHTML = `
    <header class="mini-header">
      <a class="mini-header__home" href="/index.html">IB Econ Graphs</a>
      <span class="mini-header__title">${title}</span>
    </header>
  `;
}
