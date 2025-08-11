import { type Plugin } from 'vite';
import * as path from 'node:path';

const materialSymbolsPlugin = (): Plugin => {
  return {
    name: 'vite-material-symbols',
    resolveId(id) {
      if (id === 'vite-material-symbols') {
        return '\0virtual:material-symbols';
      }
    },
    async load(id) {
      if (id !== '\0virtual:material-symbols') return null;

      const icons = ['menu', 'home', 'search'];
    },
  };
};
