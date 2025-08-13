import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const codepointsText = readFileSync(join('..', 'font', 'MaterialIcons-Regular.codepoints'), {
  encoding: 'utf-8',
});

const identifiers = codepointsText.split('\n').map((line) => line.split(' ')[0]);

const transformedIds = identifiers
  .map((id) =>
    id
      .split('_')
      .map((part) => {
        if (part) {
          return part[0].toUpperCase() + part.slice(1);
        }
      })
      .join('')
  )
  .map((line) => {
    const firstCharCode = line.charCodeAt(0);
    if (firstCharCode >= 48 && firstCharCode <= 57) {
      return 'Icon' + line;
    }

    return line;
  })
  .filter((line) => line.length > 0);

const defLines = transformedIds.map((id, index) => {
  if (index === 0) {
    return `export const ${id}: string;`;
  }

  return `  export const ${id}: string;`;
});

const def = `
// src/vite-mat-symbols.d.ts
declare module 'vite-mat-symbols' {
  ${defLines.join('\n')}
  const _default: string[];
  export default _default;
}
`;

writeFileSync(join('..', '..', 'web-react-test-app', 'src', 'vit-mat-symbols.d.ts'), def, {
  encoding: 'utf-8',
});
