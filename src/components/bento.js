// src/components/bento.js
export function renderBento(container, items, options = {}) {
  const tiered = options.tiered !== false;
  container.innerHTML = '';
  container.className = 'bento';
  items.forEach((item) => {
    const tile = document.createElement('a');
    tile.href = item.href;
    tile.className = tiered && item.tier ? `bento__tile bento__tile--${item.tier}` : 'bento__tile';
    const badge = item.status === 'coming-soon' ? '<span class="bento__badge">Coming soon</span>' : '';
    const levelPill = item.level ? `<span class="level-pill">${item.level}</span>` : '';
    tile.innerHTML = `${badge}${levelPill}<h3>${item.name}</h3>`;
    container.appendChild(tile);
  });
}
