// src/components/bento.js
import microeconomicsImg from '../assets/bento/microeconomics.svg';
import macroeconomicsImg from '../assets/bento/macroeconomics.svg';
import internationalImg from '../assets/bento/international.svg';
import developmentImg from '../assets/bento/development.svg';

const UNIT_TILE_IMAGES = {
  microeconomics: microeconomicsImg,
  macroeconomics: macroeconomicsImg,
  international: internationalImg,
  development: developmentImg,
};

export function renderBento(container, items, options = {}) {
  const tiered = options.tiered !== false;
  container.innerHTML = '';
  container.className = 'bento';
  items.forEach((item) => {
    const tile = document.createElement('a');
    tile.href = item.href;
    const classes = ['bento__tile'];
    if (tiered && item.tier) classes.push(`bento__tile--${item.tier}`);
    const image = UNIT_TILE_IMAGES[item.slug];
    if (image) {
      classes.push(`bento__tile--${item.slug}`);
      tile.style.backgroundImage = `url(${image})`;
    }
    tile.className = classes.join(' ');
    const badge = item.status === 'coming-soon' ? '<span class="bento__badge">Coming soon</span>' : '';
    const levelPill = item.level ? `<span class="level-pill">${item.level}</span>` : '';
    tile.innerHTML = `${badge}${levelPill}<h3>${item.name}</h3>`;
    container.appendChild(tile);
  });
}
