const VIEWS = [['ib', 'IB perfect'], ['explorer', 'Explorer']];
const FOCUSES = [
  ['cs', 'Consumer surplus'],
  ['ps', 'Producer surplus'],
  ['overlap', 'Overlap'],
  ['gov', 'Government spending'],
  ['dwl', 'Welfare loss'],
];

// IB perfect | Explorer segmented control, plus the focus bar (inserted right after the
// chart head) of chips that pick one area to highlight in Explorer. DOM + callbacks only.
export function mountViewSwitch(chartHead, { view, focus, onChange }) {
  const doc = chartHead.ownerDocument;
  const root = doc.createElement('div');
  root.className = 'view-switch seg';
  root.setAttribute('role', 'radiogroup');
  root.setAttribute('aria-label', 'Graph view');
  root.innerHTML = VIEWS.map(([v, label]) =>
    `<label class="seg__opt"><input type="radio" name="play-view" value="${v}"><span>${label}</span></label>`).join('');
  chartHead.append(root);

  const bar = doc.createElement('div');
  bar.className = 'focus-bar';
  bar.innerHTML = `<span class="focus-bar__prompt">Pick something to highlight:</span>${FOCUSES.map(([id, label]) =>
    `<button type="button" class="focus-chip" data-focus="${id}" aria-pressed="false">${label}</button>`).join('')}`;
  chartHead.after(bar);

  const radios = [...root.querySelectorAll('input[name="play-view"]')];
  const chips = [...bar.querySelectorAll('.focus-chip')];
  let state = { view: 'ib', focus: null };

  const paint = () => {
    radios.forEach((r) => { r.checked = r.value === state.view; });
    bar.hidden = state.view !== 'explorer';
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.focus === state.focus)));
  };
  const set = ({ view: v, focus: f = null }) => {
    state = { view: v, focus: v === 'explorer' ? f : null };
    paint();
  };
  const user = (next) => { set(next); onChange({ ...state }); };
  set({ view, focus });

  root.addEventListener('change', (e) => {
    if (e.target.name === 'play-view') user({ view: e.target.value, focus: state.focus });
  });
  bar.addEventListener('click', (e) => {
    const chip = e.target.closest('.focus-chip');
    if (!chip) return;
    user({ view: 'explorer', focus: state.focus === chip.dataset.focus ? null : chip.dataset.focus });
  });

  return { set };
}
