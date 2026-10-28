// A bento tile that, on click, splits into one link per mode. `modes` is the
// { mode, label, href } list from diagramModeLinks.
// The tile's own href stays the bare page, so it still works without JS.

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
    // Cmd/Ctrl/Shift/Alt or a non-primary button: let the browser open the bare page as asked.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (split) return;
    openingEvent = e;
    const doc = tile.ownerDocument;
    split = doc.createElement('div');
    split.className = 'bento__split';
    tile.classList.forEach((c) => {
      if (c !== 'bento__tile') split.classList.add(c);
    });
    modes.forEach(({ mode, label: text, href }) => {
      const link = doc.createElement('a');
      link.className = `bento__mode bento__mode--${mode}`;
      link.href = href;
      if (tile.style.backgroundImage) link.style.backgroundImage = tile.style.backgroundImage;
      const label = doc.createElement('span');
      label.textContent = text;
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
