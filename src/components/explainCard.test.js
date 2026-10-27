import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountExplainCard } from './explainCard.js';
import { SUBSIDY_STEPS } from '../pages/subsidyExplainSteps.js';

let container, onRender, onAmount, onFinish, card;
beforeEach(() => {
  document.body.innerHTML = '<section id="explain-card"></section>';
  container = document.getElementById('explain-card');
  onRender = vi.fn(); onAmount = vi.fn(); onFinish = vi.fn();
  card = mountExplainCard(container, {
    steps: SUBSIDY_STEPS, amount: 20,
    getContext: () => ({ amount: 20, result: { Q: 55, govCost: 1100 } }),
    onRender, onAmount, onFinish,
  });
});
const btn = (t) => [...container.querySelectorAll('button')].find((b) => b.textContent === t);

describe('explain card', () => {
  it('starts at step 1 of 11 with Back disabled', () => {
    expect(container.querySelector('.explain-card__count').textContent).toBe('Step 1 of 11');
    expect(btn('Back').disabled).toBe(true);
    expect(container.querySelector('.explain-slider').closest('div').hidden).toBe(true);
  });
  it('Next renders with animate and shows step 2', () => {
    btn('Next').click();
    expect(onRender).toHaveBeenLastCalledWith(SUBSIDY_STEPS[1], { animate: true });
    expect(container.querySelector('h3').textContent).toBe('Supply');
    expect(container.querySelector('[aria-current="step"]')).toBe(container.querySelectorAll('.explain-dot')[1]);
  });
  it('slider on step 3 calls onAmount then onRender without animate', () => {
    card.goTo(2);
    onRender.mockClear();
    const slider = container.querySelector('.explain-slider');
    expect(slider.closest('div').hidden).toBe(false);
    slider.value = '30';
    slider.dispatchEvent(new Event('input'));
    expect(onAmount).toHaveBeenCalledWith(30);
    expect(onRender).toHaveBeenCalledWith(SUBSIDY_STEPS[2], { animate: false });
    expect(onAmount.mock.invocationCallOrder[0]).toBeLessThan(onRender.mock.invocationCallOrder[0]);
  });
  it('last step offers Try it in Play', () => {
    card.goTo(10);
    btn('Try it in Play →').click();
    expect(onFinish).toHaveBeenCalled();
  });
  it('ArrowRight advances, ignored on the range input', () => {
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(card.index()).toBe(1);
    card.goTo(2);
    container.querySelector('.explain-slider').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(card.index()).toBe(2);
  });
});
