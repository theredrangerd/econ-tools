// A bento tile that, on click, splits into one link per mode (Explain / Play).
// The tile's own href stays the bare page, so it still works without JS.
const MODE_LABELS = { explain: 'Explain', play: 'Play' };

export function enableTileSplit(tile, modes) {
  let split = null;
  let openingEvent = null;

  function onDocClick(e) {
    if (split && e !== openingEvent && !tile.contains(e.target) && !split.contains(e.target)) restore();
  }
  function onKeydown(e) {
    if (e.key === 'Escape') restore();
  }

  function restore() {
    if (!split) return;
    split.remove();
    split = null;
    tile.hidden = false;
    tile.ownerDocument.removeEventListener('click', onDocClick);
    tile.ownerDocument.removeEventListener('keydown', onKeydown);
    tile.focus();
  }

  tile.addEventListener('click', (e) => {
    e.preventDefault();
    if (split) return;
    openingEvent = e;
    const doc = tile.ownerDocument;
    split = doc.createElement('div');
    split.className = 'bento__split';
    tile.classList.forEach((c) => {
      if (c !== 'bento__tile') split.classList.add(c);
    });
    const base = tile.getAttribute('href');
    modes.forEach((mode) => {
      const link = doc.createElement('a');
      link.className = `bento__mode bento__mode--${mode}`;
      link.href = `${base}#${mode}`;
      if (tile.style.backgroundImage) link.style.backgroundImage = tile.style.backgroundImage;
      const label = doc.createElement('span');
      label.textContent = MODE_LABELS[mode] || mode;
      link.appendChild(label);
      split.appendChild(link);
    });
    tile.hidden = true;
    tile.after(split);
    split.querySelector('a').focus();
    doc.addEventListener('click', onDocClick);
    doc.addEventListener('keydown', onKeydown);
  });

  return { restore };
}
