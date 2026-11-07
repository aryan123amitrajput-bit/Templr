import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: [
      '4173-inznui8ixcxeze2r7kh1c.e2b.app',
      '4180-inznui8ixcxeze2r7kh1c.e2b.app',
    ],
  },
});
