import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Mapping = {
  id: string;
  transformedId: string;
};

const codepointsText = readFileSync(join('..', 'font', 'material-symbols-outlined.codepoints'), {
  encoding: 'utf-8',
});

const identifiers = codepointsText.split('\n').map((line) => line.split(' ')[0]);

const mappings: Mapping[] = identifiers
  .map((id) => {
    let transformedId = id
      .split('_')
      .map((part) => {
        if (part) {
          return part[0].toUpperCase() + part.slice(1);
        }
      })
      .join('');

    const firstCharCode = transformedId.charCodeAt(0);

    if (firstCharCode >= 48 && firstCharCode <= 57) {
      transformedId = 'Icon' + transformedId;
    }

    return { id, transformedId };
  })
  .filter(({ transformedId, id }) => transformedId.length > 0 && id !== 'flourescent');

/**
 * Create d.ts
 */
const defLines = mappings.map((mapping, index) => {
  if (index === 0) {
    return `export const ${mapping.transformedId}: string;`;
  }

  return `  export const ${mapping.transformedId}: string;`;
});

const def = `// src/vite-mat-symbols.d.ts
declare module 'vite-mat-symbols' {
  ${defLines.join('\n')}
  const _default: string[];
  export default _default;
}
`;

// TODO: determine where to put this later on
writeFileSync(join('..', '..', 'web-react-test-app', 'src', 'vite-mat-symbols.d.ts'), def, {
  encoding: 'utf-8',
});

/**
 * Create wrapper components
 */
const mappingToComponent = ({ id, transformedId }: Mapping) => {
  return `export const ${transformedId} = ({ weight = 400 }: BaseSymbolProps) => {
  return <MaterialSymbol id="${id}" weight={weight} />;
}
`;
};

const template = `
import { MaterialSymbol } from './symbol.tsx';

type BaseSymbolProps = {
  weight?: string;
}

${mappings.map(mappingToComponent)}
`;

writeFileSync(join('..', '..', '..', 'packages', 'vite-material-symbols', 'src', 'react', 'icon.tsx'), template);

/**
 * Create mapping from proper import name to icon id as defined by the codepoints file
 */
const idToMapping = ({ transformedId, id }: Mapping, index: number) => {
  return `  ${transformedId}: '${id}'`;
};

const iconMapping = `type KeyType = typeof supportedExports[number]; 

type Mapping = {
  [K in KeyType]: string; // or any type you want for the values
};

export const iconMapping: Mapping = {
${mappings.map(idToMapping).join(',\n')}
}

export const supportedExports = [
${mappings.map(({ transformedId }) => `  '${transformedId}'`).join(',\n')}
]
`;

writeFileSync(join('..', '..', '..', 'packages', 'vite-material-symbols', 'src', 'mappings.ts'), iconMapping, {
  encoding: 'utf-8',
});
