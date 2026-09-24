import { describe, it, expect, beforeEach } from 'vitest';
import { renderHero, renderMiniHeader } from './chrome.js';

describe('renderHero', () => {
  let container;
  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders the eyebrow, title, and lede text into the container', () => {
    renderHero(container, {
      eyebrow: 'IB ECONOMICS',
      title: 'Understand the graph, not just the answer',
      lede: 'Interactive diagrams for IB Economics revision.',
    });
    expect(container.querySelector('.eyebrow').textContent).toBe('IB ECONOMICS');
    expect(container.querySelector('h1').textContent).toBe('Understand the graph, not just the answer');
    expect(container.querySelector('.lede').textContent).toBe('Interactive diagrams for IB Economics revision.');
  });
});

describe('renderMiniHeader', () => {
  it('renders a link back to the homepage and the given title', () => {
    const container = document.createElement('div');
    renderMiniHeader(container, { title: 'Microeconomics' });
    const link = container.querySelector('.mini-header__home');
    expect(link.getAttribute('href')).toBe('/index.html');
    expect(container.querySelector('.mini-header__title').textContent).toBe('Microeconomics');
  });

  it('honors an explicit base path, so the home link still works under a GitHub Pages project subpath', () => {
    const container = document.createElement('div');
    renderMiniHeader(container, { title: 'Microeconomics', base: '/econ-tools/' });
    const link = container.querySelector('.mini-header__home');
    expect(link.getAttribute('href')).toBe('/econ-tools/index.html');
  });
});
