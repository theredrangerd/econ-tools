// Step card for the subsidy page's Explain mode. Presentational: the page supplies the
// context and reacts to onRender/onAmount/onFinish.
import { guardSliders } from '../lib/pageControls.js';

export function mountExplainCard(container, {
  steps, amount, min = 0, max = 60, getContext, onRender, onAmount, onFinish, isValidAmount = () => true,
}) {
  let current = 0;
  container.classList.add('explain-card', 'card');

  const count = el('p', 'explain-card__count');
  const headline = el('h3');
  const text = el('p', 'explain-card__text');
  const sliderRow = el('div', 'explain-card__slider');
  const slider = el('input', 'explain-slider');
  slider.type = 'range';
  slider.min = String(min);
  slider.max = String(max);
  slider.step = '1';
  slider.value = String(amount);
  slider.setAttribute('aria-label', 'Subsidy per loaf');
  sliderRow.append(slider);
  const nav = el('div', 'explain-card__nav');
  const back = el('button', 'explain-btn'); back.type = 'button'; back.textContent = 'Back';
  const next = el('button', 'explain-btn explain-btn--primary'); next.type = 'button';
  const dots = el('div', 'explain-card__dots');
  const dotEls = steps.map((s, i) => {
    const d = el('button', 'explain-dot'); d.type = 'button';
    d.setAttribute('aria-label', `Step ${i + 1}: ${s.id}`);
    d.addEventListener('click', () => goTo(i));
    dots.append(d);
    return d;
  });
  nav.append(back, dots, next);
  container.replaceChildren(count, headline, text, sliderRow, nav);

  function paintText() {
    const step = steps[current];
    const ctx = getContext();
    headline.textContent = step.headline(ctx);
    text.innerHTML = step.text(ctx); // static copy only
  }

  function paint() {
    const step = steps[current];
    slider.value = String(getContext().amount);
    count.textContent = `Step ${current + 1} of ${steps.length}`;
    paintText();
    sliderRow.hidden = !step.slider;
    back.disabled = current === 0;
    const last = current === steps.length - 1;
    next.textContent = last ? 'Try it in Play →' : 'Next';
    dotEls.forEach((d, i) => {
      if (i === current) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
  }

  function goTo(i) {
    current = Math.max(0, Math.min(steps.length - 1, i));
    paint();
    onRender(steps[current], { animate: true });
  }

  back.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => {
    if (current === steps.length - 1) onFinish(); else goTo(current + 1);
  });

  guardSliders([slider], () => isValidAmount(+slider.value));
  slider.addEventListener('input', () => {
    onAmount(+slider.value);
    paintText();
    onRender(steps[current], { animate: false });
  });

  container.addEventListener('keydown', (e) => {
    if (e.target === slider) return;
    if (e.key === 'ArrowRight') goTo(current + 1);
    else if (e.key === 'ArrowLeft') goTo(current - 1);
  });

  paint();
  return { goTo, index: () => current, refresh: paint };
}

function el(tag, cls) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
}
