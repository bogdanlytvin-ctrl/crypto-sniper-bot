import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// '@' → корінь проєкту, щоб тести могли імпортувати реальні дані (FLOWS/BOARDS).
const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@': root },
  },
});
