// FTOS — рецепти збірок: стандартизовані борти під роль, щоб майстерня
// збирала однотипно, а новачок не вгадував. Усе DRAFT — орієнтир, не догма.

import type { VerifyStatus } from './diagnostics';

import strike5 from '@/data/recipes/strike-5-6s.json';
import lr7 from '@/data/recipes/long-range-7-6s.json';
import bomber10 from '@/data/recipes/bomber-10.json';
import wingRecon from '@/data/recipes/wing-recon.json';

export interface BuildRecipe {
  $comment?: string;
  id: string;
  role: string;
  summary: string;
  frame: string;
  cells: string;
  firmware: string;
  fc_hint: string;
  bom: { part: string; spec: string }[];
  config_notes: string[];
  verified: { status: VerifyStatus; checked_by?: string; date?: string };
  source_url: string;
}

export const RECIPES = [strike5, lr7, bomber10, wingRecon] as BuildRecipe[];
