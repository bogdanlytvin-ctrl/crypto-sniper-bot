// FTOS Diagnostics Engine
// Симптом → дерево перевірок → ймовірна причина + крок фіксу.
// Перевірки прив'язані до пінауту конкретної плати (pad_ref) — це і є ядро цінності.
// Принцип: інструмент ПІДКАЗУЄ (confidence + source), фінальна перевірка — на технікові.

import type { Board } from './engine';

export type CheckMethod = 'visual' | 'multimeter' | 'configurator' | 'swap' | 'listen';
export type Confidence = 'likely' | 'possible';
export type FixAction =
  | 'rewire'
  | 'reflash'
  | 'replace'
  | 'resolder'
  | 'configure'
  | 'clean';
export type VerifyStatus = 'draft' | 'manual_checked' | 'field_tested';

// Куди саме дивитись/міряти на платі. Резолвиться з профілю обраної плати.
export interface PadRef {
  kind: 'bec' | 'uart' | 'literal';
  voltage?: string; // kind=bec:    "9V"
  role?: string; // kind=uart:   "vtx_digital"
  label?: string; // kind=literal:"VBAT"
}

export interface Outcome {
  label: string; // "0 В"
  next: string; // id наступного вузла
}

export interface CheckNode {
  type: 'check';
  id: string;
  instruction: string;
  method: CheckMethod;
  expected?: string; // що має бути в нормі
  pad_ref?: PadRef; // прив'язка до плати
  note?: string; // важливий нюанс/застереження
  outcomes: Outcome[];
}

export interface CauseNode {
  type: 'cause';
  id: string;
  cause: string;
  fix_steps: string[];
  fix_action?: FixAction;
  confidence: Confidence; // НІКОЛИ не "точно"
  source_url: string; // звідки знання
  est_minutes?: number;
}

export type FlowNode = CheckNode | CauseNode;

export interface DiagnosticFlow {
  id: string;
  symptom: string;
  summary?: string;
  applies_to?: { has?: string[] };
  entry: string;
  nodes: Record<string, FlowNode>;
  verified: { status: VerifyStatus; checked_by?: string; date?: string };
  source_url: string;
}

// --- pad_ref резолвер: прив'язка перевірки до конкретної плати (моат) ---
export interface ResolvedPad {
  label: string; // "пад 9V"
  detail?: string; // "BEC до 2.0 A — для цифрового VTX"
  missing?: boolean; // на цій платі такого виходу немає
}

export function resolvePad(board: Board, ref: PadRef): ResolvedPad {
  if (ref.kind === 'literal') {
    return { label: ref.label ?? '—' };
  }
  if (ref.kind === 'bec') {
    const bec = board.voltage?.bec_outputs?.find((b) => b.voltage === ref.voltage);
    if (!bec) return { label: ref.voltage ?? 'BEC', missing: true };
    const detail = `BEC до ${bec.max_current_a} A${bec.notes ? ` — ${bec.notes}` : ''}`;
    return { label: `пад ${bec.voltage}`, detail };
  }
  // kind === 'uart'
  const u = board.uarts.find((x) => x.recommended_for?.includes(ref.role ?? ''));
  if (!u) return { label: ref.role ?? 'UART', missing: true };
  return { label: `${u.name} (пади ${u.pads.join(' / ')})`, detail: u.notes };
}

// --- обхід дерева ---
// Безпечний доступ: повертає undefined замість throw, щоб «бите» дерево
// не валило весь рендер сторінки (критично для офлайн-інструменту в полі).
export function getNode(flow: DiagnosticFlow, id: string): FlowNode | undefined {
  return flow.nodes[id];
}

export function isCause(node: FlowNode): node is CauseNode {
  return node.type === 'cause';
}

// Один пройдений крок (для «хлібних крихт» і кнопки «назад»)
export interface PathStep {
  node: CheckNode;
  chosen: Outcome;
}

// Валідатор цілісності дерева — щоб «битий» JSON падав явно, а не мовчки.
export function validateFlow(flow: DiagnosticFlow): string[] {
  const errors: string[] = [];
  const ids = new Set(Object.keys(flow.nodes));
  if (!ids.has(flow.entry)) errors.push(`entry "${flow.entry}" відсутній у nodes`);
  for (const [id, node] of Object.entries(flow.nodes)) {
    if (node.id !== id) errors.push(`id вузла "${node.id}" не збігається з ключем "${id}"`);
    if (node.type === 'check') {
      if (!node.outcomes.length) errors.push(`check "${id}" не має жодного outcome`);
      for (const o of node.outcomes) {
        if (!ids.has(o.next)) errors.push(`check "${id}" → невідомий вузол "${o.next}"`);
      }
    } else if (!node.source_url) {
      errors.push(`cause "${id}" без source_url`);
    }
  }
  return errors;
}
