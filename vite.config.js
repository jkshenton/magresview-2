import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import legacy from '@vitejs/plugin-legacy'
import commonjs from 'vite-plugin-commonjs';
// import commonjs from '@rollup/plugin-commonjs';
// rollup resolve plugin
import resolve from '@rollup/plugin-node-resolve';
import { nodePolyfills } from 'vite-plugin-node-polyfills';





// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './dist/magresview-2',
    // commonjs
    commonjsOptions: {
      include: [
        /node_modules/,
        '@ccp-nc/crystvis-js',
        'node_modules/@jkshenton/three-bmfont-text/**'
      ],
    },
  },
  server: {
    port: 4200,
    open: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: 'src/setupTests.js',
    css: true,
  },
  plugins: [react(), svgr(), legacy(),
    nodePolyfills({
      include: ['path', 'stream', 'util'],
      exclude: ['http'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      overrides: {
        fs: 'memfs',
      },
      protocolImports: true,
    }),
    commonjs({
      filter(id) {
      if (id.includes('node_modules/@jkshenton')) {
        return true
      }
      if (id.includes('node_modules/@ccp-nc/crystvis-js')) {
        return true
      }
    },}),
    resolve(),
  ],
});
