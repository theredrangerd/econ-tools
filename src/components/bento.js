import { unitHref } from '../lib/units.js';

export function renderBento(container, units) {
  container.innerHTML = '';
  container.className = 'bento';
  units.forEach((unit) => {
    const tile = document.createElement('a');
    tile.href = unitHref(unit);
    tile.className = `bento__tile bento__tile--${unit.tier}`;
    tile.innerHTML = `<h3>${unit.name}</h3>`;
    container.appendChild(tile);
  });
}
