/**
 * Guard específico do estagiário: perfil ainda incompleto (disciplina/
 * supervisor/disponibilidade/termo) manda pro formulário de completar
 * cadastro em vez do painel normal. login-estagiario.vue já redireciona pra
 * lá logo após o login — este guard cobre o resto (F5, link direto, voltar
 * do navegador), senão um refresh de página "escaparia" da exigência.
 *
 * Equivalente a shared/auth/RequireInternProfileComplete.tsx do React.
 * Usado só em páginas que já levam 'require-role' com roles: ['INTERN'] —
 * nunca na própria rota /completar-cadastro (senão o redirect nunca teria
 * onde parar).
 */
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth();
  if (user.value?.profileComplete === false) {
    return navigateTo('/completar-cadastro', { replace: true });
  }
});
