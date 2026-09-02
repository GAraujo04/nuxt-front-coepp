import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: {
    head: {
      title: 'PEP — Clínica-Escola de Psicologia',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
        },
      ],
    },
  },
  // Decisão tomada ao migrar a slice auth (era item em aberto na spec):
  // SPA puro, sem SSR. O sistema é quase todo autenticado (SEO não se
  // aplica) e o React original nunca foi server-rendered — SSR aqui só
  // trocaria simplicidade por um problema real que não temos (evitar
  // vazamento de token entre requisições concorrentes de usuários
  // diferentes no mesmo processo, que é a razão de existir da
  // arquitetura de plugin/composable escopado por requisição do Nuxt).
  ssr: false,
  // @pinia/nuxt substitui o Zustand (ver ADR-0004 no pep-main) — auto-importa
  // stores de stores/*.ts, sem precisar de <PiniaProvider> envolvendo a árvore
  // como o Zustand nem precisava, mas o Pinia integra com o devtools do Nuxt.
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  // useI18n não é auto-importado por padrão (só com o módulo @nuxtjs/i18n,
  // que decidi não usar — ver plugins/i18n.ts). Registra manualmente pra
  // não precisar de `import { useI18n } from 'vue-i18n'` em toda página.
  imports: {
    presets: [{ from: 'vue-i18n', imports: ['useI18n'] }],
  },
  // Equivalente ao server.proxy do vite.config.ts original: em dev, /api/*
  // é encaminhado pro backend Fastify (pep-main/apps/api, :8000), mantendo
  // front e back na mesma origem do ponto de vista do navegador — evita o
  // problema de cookie cross-origin registrado na spec (seção 7).
  devServer: { port: 3000 },
  nitro: {
    devProxy: {
      '/api': { target: 'http://localhost:8000/api', changeOrigin: true },
    },
  },
})
