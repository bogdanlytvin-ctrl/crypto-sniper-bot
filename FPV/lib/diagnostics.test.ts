import { describe, it, expect } from 'vitest';
import type { Board } from './engine';
import {
  resolvePad,
  validateFlow,
  getNode,
  isCause,
  safeHref,
  type DiagnosticFlow,
  type CauseNode,
} from './diagnostics';

const board: Board = {
  id: 'b',
  brand: 'Test',
  model: 'FC',
  revision: 'v1',
  mcu: 'F405',
  voltage: { bec_outputs: [{ voltage: '9V', max_current_a: 2, notes: 'для VTX' }] },
  uarts: [
    { name: 'UART6', pads: ['T6', 'R6'], default_function: null, recommended_for: ['gps'], notes: 'для GPS', connector: null },
  ],
  verified: { status: 'manual_checked' },
  source_url: 'https://example.com',
};

describe('resolvePad', () => {
  it('literal повертає свій label', () => {
    expect(resolvePad(board, { kind: 'literal', label: 'VBAT' })).toEqual({ label: 'VBAT' });
  });

  it('bec — знаходить пад і деталь зі струмом', () => {
    const r = resolvePad(board, { kind: 'bec', voltage: '9V' });
    expect(r.label).toBe('пад 9V');
    expect(r.detail).toMatch(/2 A/);
    expect(r.missing).toBeFalsy();
  });

  it('bec — відсутній на платі позначається missing', () => {
    expect(resolvePad(board, { kind: 'bec', voltage: '12V' }).missing).toBe(true);
  });

  it('uart — резолвиться за роллю, з падами', () => {
    const r = resolvePad(board, { kind: 'uart', role: 'gps' });
    expect(r.label).toMatch(/UART6/);
    expect(r.label).toMatch(/T6 \/ R6/);
  });

  it('uart — невідома роль позначається missing', () => {
    expect(resolvePad(board, { kind: 'uart', role: 'receiver' }).missing).toBe(true);
  });
});

// --- хелпери для дерев ---
function flow(nodes: DiagnosticFlow['nodes'], entry = 'start'): DiagnosticFlow {
  return { id: 'f', symptom: 's', entry, nodes, verified: { status: 'draft' }, source_url: 'https://example.com' };
}
const cause = (id: string, source = 'https://example.com'): CauseNode => ({
  type: 'cause',
  id,
  cause: 'c',
  fix_steps: ['x'],
  confidence: 'likely',
  source_url: source,
});

describe('validateFlow', () => {
  it('коректне дерево — без помилок', () => {
    const f = flow({
      start: { type: 'check', id: 'start', instruction: 'q', method: 'visual', outcomes: [{ label: 'a', next: 'end' }] },
      end: cause('end'),
    });
    expect(validateFlow(f)).toEqual([]);
  });

  it('ловить відсутній entry', () => {
    const f = flow({ end: cause('end') }, 'missing');
    expect(validateFlow(f).join(' ')).toMatch(/entry/);
  });

  it('ловить розбіжність id вузла й ключа', () => {
    const f = flow({ start: cause('WRONG') });
    expect(validateFlow(f).join(' ')).toMatch(/не збігається/);
  });

  it('ловить обірваний next', () => {
    const f = flow({
      start: { type: 'check', id: 'start', instruction: 'q', method: 'visual', outcomes: [{ label: 'a', next: 'nope' }] },
    });
    expect(validateFlow(f).join(' ')).toMatch(/невідомий вузол/);
  });

  it('ловить cause без source_url', () => {
    const f = flow({
      start: { type: 'check', id: 'start', instruction: 'q', method: 'visual', outcomes: [{ label: 'a', next: 'end' }] },
      end: cause('end', ''),
    });
    expect(validateFlow(f).join(' ')).toMatch(/source_url/);
  });

  it('ловить недосяжний вузол (острівець)', () => {
    const f = flow({
      start: { type: 'check', id: 'start', instruction: 'q', method: 'visual', outcomes: [{ label: 'a', next: 'end' }] },
      end: cause('end'),
      island: cause('island'), // ні з чого не досяжний
    });
    expect(validateFlow(f).join(' ')).toMatch(/недосяжний/);
  });
});

describe('getNode / isCause', () => {
  const f = flow({
    start: { type: 'check', id: 'start', instruction: 'q', method: 'visual', outcomes: [{ label: 'a', next: 'end' }] },
    end: cause('end'),
  });
  it('getNode повертає вузол або undefined', () => {
    expect(getNode(f, 'end')?.id).toBe('end');
    expect(getNode(f, 'zzz')).toBeUndefined();
  });
  it('isCause розрізняє тип вузла', () => {
    expect(isCause(f.nodes.end)).toBe(true);
    expect(isCause(f.nodes.start)).toBe(false);
  });
});

describe('safeHref', () => {
  it('пропускає лише http(s)', () => {
    expect(safeHref('https://ok.com')).toBe('https://ok.com');
    expect(safeHref('http://ok.com')).toBe('http://ok.com');
  });
  it('блокує небезпечні схеми та порожнє', () => {
    expect(safeHref('javascript:alert(1)')).toBe('#');
    expect(safeHref('data:text/html,x')).toBe('#');
    expect(safeHref(undefined)).toBe('#');
  });
});
