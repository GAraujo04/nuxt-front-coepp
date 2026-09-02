import { createI18n } from 'vue-i18n';
import ptBR from '../i18n/pt-BR';

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = createI18n({
    legacy: false, // usa a Composition API (useI18n()/t() no <script setup>)
    locale: 'pt-BR',
    fallbackLocale: 'pt-BR', // sem fallback pra en-US, de propósito
    messages: { 'pt-BR': ptBR },
  });
  nuxtApp.vueApp.use(i18n);
});
