// @ts-check
import { defineConfig } from 'astro/config';
// https://astro.build/config
export default defineConfig({
   
    site: 'https://alejandro-vazquez.com',
    

  vite: {
    optimizeDeps: {
      include: ["three"]
    },
  },

    i18n:{
        defaultLocale:'es',
        locales:['es','en'],
        routing:{
            prefixDefaultLocale:true,
            redirectToDefaultLocale:true
        }
    }
});
 