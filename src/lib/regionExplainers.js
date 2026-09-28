// Hardcoded per-region explanations for the "click a shaded area / line to learn what it
// is" feature. Keyed by the `data-region` value set on chart elements in marketChart.js.
// Starting with price ceiling/floor's regions only (cs, ps, dwl, ceiling, floor); tax and
// subsidy pages reuse cs/ps/dwl already but aren't wired up to this yet (see indirect-tax.js
// and subsidy.js — deliberately out of scope for this first pass).
export const REGION_INFO = {
  cs: {
    title: 'Consumer Surplus',
    text: 'The benefit consumers get from paying less than the maximum price they were willing to pay — the area between the demand curve and the price actually paid.',
  },
  ps: {
    title: 'Producer Surplus',
    text: 'The benefit producers get from receiving more than the minimum price they were willing to accept — the area between the supply curve and the price actually received.',
  },
  dwl: {
    title: 'Deadweight Loss',
    text: "The value of mutually beneficial trades that no longer happen because of the price control — welfare that simply disappears rather than shifting to anyone.",
  },
  ceiling: {
    title: 'Price Ceiling',
    text: 'A legal maximum price. Set below the equilibrium price, it holds the price artificially low, which is what creates the shortage below it.',
  },
  floor: {
    title: 'Price Floor',
    text: 'A legal minimum price. Set above the equilibrium price, it holds the price artificially high, which is what creates the surplus below it.',
  },
};

// Wires hover-pop and click-to-explain behavior onto a market chart SVG. Safe to call once
// per chart element — it listens on the SVG itself (event delegation), so it keeps working
// across re-renders even though renderMarketChart() tears down and rebuilds the chart's
// child elements on every call.
export function attachRegionExplainers(svg) {
  let popover = null;
  let activeRegion = null;

  function findRegion(target) {
    return target && target.closest ? target.closest('[data-region]') : null;
  }

  function closePopover() {
    if (popover) {
      popover.remove();
      popover = null;
    }
    if (activeRegion) {
      activeRegion.classList.remove('region-active');
      activeRegion = null;
    }
  }

  function positionPopover(el, clientX, clientY) {
    const pad = 12;
    // Measure after appending so offsetWidth/Height are real, then clamp into the viewport
    // so a click near an edge never renders the card partly off-screen.
    const w = el.offsetWidth, h = el.offsetHeight;
    let left = clientX + pad, top = clientY + pad;
    if (left + w > window.innerWidth - pad) left = clientX - w - pad;
    if (top + h > window.innerHeight - pad) top = clientY - h - pad;
    left = Math.max(pad, left);
    top = Math.max(pad, top);
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }

  function openPopover(regionEl, key, clientX, clientY) {
    const info = REGION_INFO[key];
    if (!info) return;
    closePopover();
    activeRegion = regionEl;
    activeRegion.classList.add('region-active');

    popover = document.createElement('div');
    popover.className = 'region-popover';
    popover.setAttribute('role', 'dialog');
    const heading = document.createElement('h4');
    heading.textContent = info.title;
    const body = document.createElement('p');
    body.textContent = info.text;
    const close = document.createElement('button');
    close.className = 'region-popover__close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.addEventListener('click', closePopover);
    popover.append(close, heading, body);
    document.body.appendChild(popover);
    positionPopover(popover, clientX, clientY);
  }

  svg.addEventListener('pointerover', (e) => {
    const region = findRegion(e.target);
    if (region) region.classList.add('region-hover');
  });
  svg.addEventListener('pointerout', (e) => {
    const region = findRegion(e.target);
    if (region) region.classList.remove('region-hover');
  });

  svg.addEventListener('click', (e) => {
    const region = findRegion(e.target);
    if (!region) return;
    const key = region.dataset.region;
    if (activeRegion === region) {
      closePopover();
    } else {
      openPopover(region, key, e.clientX, e.clientY);
    }
  });

  document.addEventListener('click', (e) => {
    if (!popover) return;
    if (popover.contains(e.target) || svg.contains(e.target)) return;
    closePopover();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopover();
  });
}
