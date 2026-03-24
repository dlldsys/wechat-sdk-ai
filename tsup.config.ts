import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  
  format: ['esm', 'cjs'],
  
  target: 'node18',
  
  external: ['ioredis', 'node:http', 'node:https', 'node:fs', 'node:path', 'node:crypto', 'node:events', 'node:util', 'node:os', 'node:stream', 'node:buffer', 'node:url', 'node:zlib'],
  
  dts: {
    entry: 'src/index.ts',
    resolve: true,
    absolute: false,
  },
  
  splitting: false,
  
  sourcemap: true,
  
  clean: true,
  
  minify: false,
  
  treeshake: true,
  
  shims: true,
  
  banner: {
    js: '/** @wechat-sdk-ai A comprehensive Node.js SDK for WeChat Official Accounts and Mini Programs */',
  },
  
  outDir: 'dist',
  
  noExternal: [],
  
  env: {
    NODE_ENV: 'production',
  },
});
