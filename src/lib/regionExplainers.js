// Hardcoded per-region explanations for the "click a shaded area / line to learn what it
// is" feature. Keyed by the `data-region` value set on chart elements in marketChart.js.
// Covers all four government-intervention pages: price ceiling, price floor, indirect tax,
// and subsidy.
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
    text: "The loss of total welfare when the market doesn't trade the efficient quantity — value that simply disappears rather than shifting to anyone. A price ceiling, price floor or tax means too few units are traded; a subsidy means too many.",
  },
  ceiling: {
    title: 'Price Ceiling',
    text: 'A legal maximum price. Set below the equilibrium price, it stops the price rising to clear the market: at this price buyers want more than sellers will supply, and the gap between them is the shortage.',
  },
  floor: {
    title: 'Price Floor',
    text: 'A legal minimum price. Set above the equilibrium price, it stops the price falling to clear the market: at this price sellers want to supply more than buyers will buy, and the gap between them is the excess supply.',
  },
  shortage: {
    title: 'Shortage',
    text: 'Quantity demanded minus quantity supplied at the ceiling price (Qd − Qs). Only Qs is actually traded, so some buyers who would pay the ceiling price go without — expect queues, waiting lists or black markets.',
  },
  'excess-supply': {
    title: 'Excess supply',
    text: 'Quantity supplied minus quantity demanded at the floor price (Qs − Qd), often called a "surplus" — not the same thing as producer surplus. Only Qd is actually bought, so the rest goes unsold unless the government buys it up.',
  },
  'tax-consumer': {
    title: 'Consumer Burden',
    text: 'The portion of the tax that consumers pay through a higher price. How much of the burden falls here rather than on producers depends on how responsive (elastic) demand is relative to supply.',
  },
  'tax-producer': {
    title: 'Producer Burden',
    text: 'The portion of the tax that producers absorb through a lower price received. How much of the burden falls here rather than on consumers depends on how responsive (elastic) supply is relative to demand.',
  },
  'tax-revenue': {
    title: 'Government Tax Revenue',
    text: 'The total revenue the government collects from the tax — the tax per unit multiplied by the quantity still traded after the tax.',
  },
  'subsidy-consumer': {
    title: 'Consumer Benefit',
    text: 'The portion of the subsidy that lowers the price consumers pay. How much of the benefit lands here rather than with producers depends on how responsive (elastic) demand is relative to supply.',
  },
  'subsidy-producer': {
    title: 'Producer Benefit',
    text: 'The portion of the subsidy that raises the price producers receive. How much of the benefit lands here rather than with consumers depends on how responsive (elastic) supply is relative to demand.',
  },
  'subsidy-cost': {
    title: 'Government Spending',
    text: 'The total cost to the government of paying the subsidy — the subsidy per unit multiplied by the quantity traded.',
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
    // Only clicks that land on the active region itself (handled above, which toggles it
    // closed) or inside the popover should be ignored here — everywhere else, including
    // empty chart background/axes inside the SVG, should close it.
    if (popover.contains(e.target) || findRegion(e.target) === activeRegion) return;
    closePopover();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopover();
  });
}
