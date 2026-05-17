import { SimulationInputs } from '../types';

const STORAGE_KEY = 'nisa-simulator-inputs-v1';

export function loadInputs(): Partial<SimulationInputs> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as Partial<SimulationInputs>;
  } catch {
    return null;
  }
}

export function saveInputs(inputs: SimulationInputs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}
