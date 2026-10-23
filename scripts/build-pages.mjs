import {build} from 'vite';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
await build({configFile:fileURLToPath(new URL('../vite.pages.config.ts',import.meta.url))});
await writeFile(new URL('../dist-pages/.nojekyll',import.meta.url),'');
