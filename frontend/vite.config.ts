import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

export default defineConfig({
  plugins: [
    vue(),
    // Auto-register any Vue component used in templates (no manual imports)
    Components({
      dts: true, // generate components.d.ts for TS intellisense
      resolvers: [
        // Turn <i-lucide-... /> tags into icon components from the "lucide" set
        IconsResolver({ enabledCollections: ['lucide'] }),
      ],
    }),
    // Compile icon components on-demand; auto-install JSON sets when needed
    Icons({
      compiler: 'vue3',
      autoInstall: true,
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts']
  },

})
