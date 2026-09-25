import fs from 'node:fs';
import path from 'node:path';
import type { BusinessConfig } from './types';

const CONFIG_DIR = path.join(process.cwd(), 'config');

interface Registry {
  defaultBusiness: string;
  businesses: Record<string, string>;
}

let registry: Registry | null = null;

function loadRegistry(): Registry {
  if (!registry) {
    registry = JSON.parse(
      fs.readFileSync(path.join(CONFIG_DIR, 'registry.json'), 'utf-8')
    ) as Registry;
  }
  return registry;
}

export function getDefaultBusinessId(): string {
  return loadRegistry().defaultBusiness;
}

export function getBusinessIds(): string[] {
  return Object.keys(loadRegistry().businesses);
}

export function loadBusiness(id: string): BusinessConfig {
  const reg = loadRegistry();
  const file = reg.businesses[id];
  if (!file) {
    throw new Error(`Unknown business id: "${id}". Registered: ${Object.keys(reg.businesses).join(', ')}`);
  }
  return JSON.parse(path.isAbsolute(file) ? fs.readFileSync(file, 'utf-8') : fs.readFileSync(path.join(CONFIG_DIR, file), 'utf-8')) as BusinessConfig;
}
