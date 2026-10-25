// First-visit walkthrough: a few spotlighted pointers ("this switch does X"), each with
// Skip tour / Next. Steps say what a student can *do*, never what the graph teaches.
// Pages supply their own steps, so any graph page can use it.

const EDGE = 12;       // min gap between the bubble and the viewport edge
const GAP = 12;        // gap between the target and the bubble
const SPOT_PAD = 6;    // spotlight padding around the target

function resolve(doc, target) {
  return typeof target === 'string' ? doc.querySelector(target) : target || null;
}

function reducedMotion(win) {
  return !!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// Below the target if it fits, else above, else beside it (right, then left); finally
// clamped so the whole bubble stays on screen however big or oddly placed the target is.
function placeBubble(rect, w, h, vw, vh) {
  let left = rect.left;
  let top;
  if (rect.bottom + GAP + h <= vh - EDGE) {
    top = rect.bottom + GAP;
  } else if (rect.top - GAP - h >= EDGE) {
    top = rect.top - GAP - h;
  } else {
    top = rect.top + rect.height / 2 - h / 2;
    left = rect.right + GAP + w <= vw - EDGE ? rect.right + GAP : rect.left - GAP - w;
  }
  left = Math.min(Math.max(left, EDGE), vw - EDGE - w);
  top = Math.min(Math.max(top, EDGE), vh - EDGE - h);
  return { left, top };
}

export function startTour(doc, steps, { onDone } = {}) {
  const win = doc.defaultView;
  const live = steps
    .map((s) => ({ ...s, el: resolve(doc, s.target) }))
    .filter((s) => s.el);

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    backdrop.remove();
    spotlight.remove();
    bubble.remove();
    doc.removeEventListener('keydown', onKey);
    win.removeEventListener('resize', position);
    win.removeEventListener('scroll', position, true);
    onDone?.();
  };

  const backdrop = doc.createElement('div');
  backdrop.className = 'tour-backdrop';
  const spotlight = doc.createElement('div');
  spotlight.className = 'tour-spotlight';
  const bubble = doc.createElement('div');
  bubble.className = 'tour-bubble';
  bubble.setAttribute('role', 'dialog');
  bubble.setAttribute('aria-labelledby', 'tour-bubble-title');

  function onKey(e) {
    if (e.key === 'Escape') finish();
  }

  if (!live.length) {
    finish();
    return { end() {} };
  }

  let index = 0;

  function position() {
    const rect = live[index].el.getBoundingClientRect();
    Object.assign(spotlight.style, {
      left: `${rect.left - SPOT_PAD}px`,
      top: `${rect.top - SPOT_PAD}px`,
      width: `${rect.width + SPOT_PAD * 2}px`,
      height: `${rect.height + SPOT_PAD * 2}px`,
    });
    const { left, top } = placeBubble(rect, bubble.offsetWidth || 300, bubble.offsetHeight || 160, win.innerWidth, win.innerHeight);
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
  }

  function show() {
    const step = live[index];
    const last = index === live.length - 1;
    bubble.innerHTML = `
      <p class="tour-bubble__count">Step ${index + 1} of ${live.length}</p>
      <p class="tour-bubble__body"><strong id="tour-bubble-title"></strong> <span class="tour-bubble__text"></span></p>
      <div class="tour-bubble__actions">
        ${last ? '<span></span>' : '<button type="button" class="tour-skip">Skip tour</button>'}
        <button type="button" class="tour-next">${last ? 'Got it' : 'Next →'}</button>
      </div>`;
    bubble.querySelector('#tour-bubble-title').textContent = step.title;
    bubble.querySelector('.tour-bubble__text').textContent = step.text;
    bubble.querySelector('.tour-skip')?.addEventListener('click', finish);
    bubble.querySelector('.tour-next').addEventListener('click', () => {
      if (last) finish();
      else { index += 1; show(); }
    });
    if (typeof step.el.scrollIntoView === 'function') {
      step.el.scrollIntoView({ block: 'center', behavior: reducedMotion(win) ? 'auto' : 'smooth' });
    }
    position();
    bubble.querySelector('.tour-next').focus({ preventScroll: true });
  }

  doc.body.append(backdrop, spotlight, bubble);
  doc.addEventListener('keydown', onKey);
  // Smooth scrolling moves the target after show(); follow it (and any resize) until done.
  win.addEventListener('resize', position);
  win.addEventListener('scroll', position, true);
  show();

  return { end: finish };
}

export function mountReplayButton(doc, onClick) {
  const btn = doc.createElement('button');
  btn.type = 'button';
  btn.className = 'tour-replay';
  btn.innerHTML = '<span class="tour-replay__icon" aria-hidden="true">?</span><span>Replay tour</span>';
  btn.addEventListener('click', onClick);
  doc.body.appendChild(btn);
  return btn;
}
