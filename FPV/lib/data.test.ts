import { describe, it, expect } from 'vitest';
import { FLOWS, BOARDS, COMPONENTS } from '@/lib/data';
import { RECIPES } from '@/lib/recipes';
import { validateFlow } from '@/lib/diagnostics';

// Data-integrity гейт: реальні дані мусять бути цілісні, інакше CI червоний
// до деплою — «битий» JSON у полі = білий екран замість підказки.
describe('діагностичні дерева — цілісність', () => {
  it('усі FLOWS проходять validateFlow (entry/next/id/reachability/source)', () => {
    for (const f of FLOWS) {
      expect(validateFlow(f), `дерево "${f.id}"`).toEqual([]);
    }
  });

  it('id дерев унікальні, symptom непорожній', () => {
    const ids = FLOWS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FLOWS) expect(f.symptom.length).toBeGreaterThan(0);
  });

  it('нові дерева (РЕБ + оптоволокно) зареєстровані', () => {
    const ids = FLOWS.map((f) => f.id);
    expect(ids).toContain('link-loss-jamming');
    expect(ids).toContain('fiber-no-signal');
  });
});

describe('реєстр плат/компонентів — базова цілісність', () => {
  it('у кожної плати є id, uarts і source_url; id унікальні', () => {
    const ids = BOARDS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of BOARDS) {
      expect(b.id.length).toBeGreaterThan(0);
      expect(b.uarts.length).toBeGreaterThan(0);
      expect(b.source_url).toMatch(/^https?:\/\//);
    }
  });

  it('id компонентів унікальні, тип валідний', () => {
    const ids = COMPONENTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const types = new Set(['receiver', 'vtx_digital', 'vtx_analog', 'gps', 'esc', 'release']);
    for (const c of COMPONENTS) expect(types.has(c.type)).toBe(true);
  });
});

describe('рецепти збірок — цілісність', () => {
  it('id унікальні; BOM і нотатки непорожні; джерело — http(s)', () => {
    const ids = RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of RECIPES) {
      expect(r.role.length).toBeGreaterThan(0);
      expect(r.bom.length).toBeGreaterThan(0);
      expect(r.config_notes.length).toBeGreaterThan(0);
      expect(r.source_url).toMatch(/^https?:\/\//);
      for (const b of r.bom) {
        expect(b.part.length).toBeGreaterThan(0);
        expect(b.spec.length).toBeGreaterThan(0);
      }
    }
  });
});
