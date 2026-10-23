import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
const project=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig({root:project+'static-pages',base:'/cisheng/',publicDir:project+'public',plugins:[react()],css:{postcss:project},build:{outDir:project+'dist-pages',emptyOutDir:true},preview:{host:'127.0.0.1',port:5175,strictPort:true}});
