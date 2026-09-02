import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';

// Mesmas opções default do QueryClient original (app/providers.tsx no React).
export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    },
  });
  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });
});
