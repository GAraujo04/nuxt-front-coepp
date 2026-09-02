# nuxt-front-coepp

Frontend do sistema PEP/COEPP (Prontuário Eletrônico do Paciente —
Clínica-Escola de Psicologia, Fundação Santo André), em **Vue 3 + Nuxt**.

Este repositório é o resultado de reverter a unificação em monorepo
(`pep-main`, ADR-0003) — o frontend volta a viver separado, e ao mesmo
tempo é reescrito de React pra Vue/Nuxt (ADR-0004). O motivo não é técnico:
é a stack que quem mantém este projeto no dia a dia conhece melhor.

## Este repo não define nada sozinho

- **Não define o contrato de API.** Consome a API do `pep-main`
  (`apps/api`, Fastify) pelo contrato gerado em `docs/api/openapi.yaml`
  daquele repo. Nunca redefine rota, schema ou regra de negócio aqui.
- **Não decide regra de autorização/negócio.** Guards de rota aqui são só
  UX — a autorização real (RLS, checagem de papel) é sempre no backend.
- **A cópia do contrato de API é vendorizada**, não consumida ao vivo por
  URL — ver `docs/api/openapi.yaml` neste repo (cópia local) e o script
  `npm run api:sync` (a definir/documentar quando a primeira feature migrar)
  pra atualizá-la a partir do `pep-main`.

## Onde estão as decisões e o plano

Toda a documentação de arquitetura desta migração vive no **`pep-main`**,
não aqui (Spec-Driven Development é convenção daquele repo):

- Spec: [`docs/specs/migracao-frontend-vue-nuxt.md`](../pep/docs/specs/migracao-frontend-vue-nuxt.md)
- ADR-0003 (unificação em monorepo, decisão revertida): [`docs/adr/0003-monorepo-via-subtree.md`](../pep/docs/adr/0003-monorepo-via-subtree.md)
- ADR-0004 (esta migração): [`docs/adr/0004-frontend-vue-nuxt-repo-proprio.md`](../pep/docs/adr/0004-frontend-vue-nuxt-repo-proprio.md)

(Os links acima assumem os dois repositórios como pastas irmãs, ex.:
`~/Documents/GitHub/pep` e `~/Documents/GitHub/nuxt-front-coepp` — ajuste
se sua estrutura local for diferente.)

## Stack

- **Nuxt 4** + Vue 3 — `app/` como diretório fonte (convenção do Nuxt 4:
  `app/pages`, `app/components`, `app/composables`, etc., diferente do
  Nuxt 3 que usava a raiz do projeto).
- **Pinia** (`@pinia/nuxt`) — estado global, equivalente ao Zustand do
  frontend React original.
- **Tailwind CSS v4** — a mesma paleta oficial FSA e os tokens de contraste
  WCAG do frontend React migram sem alteração (CSS não depende de framework JS).
- **`@tanstack/vue-query`** — estado de servidor, equivalente ao
  `@tanstack/react-query` original (API quase idêntica).
- **`vue-i18n`** — só `pt-BR`, sem fallback `en-US` (mesma regra do
  `i18next` original).

## Rodando localmente

Pré-requisito: o backend (`pep-main/apps/api`) rodando em `localhost:8000`
(ver `pep-main/CLAUDE.md` pra subir a stack — Docker Compose + `npm run dev:api`).

```bash
npm install
npm run dev      # http://localhost:3000
```

## Status

🚧 Em migração — feature a feature, a partir de `pep-main/apps/web` (React).
O React continua sendo o frontend real em produção até todas as features
serem migradas e validadas aqui (ver seção "Rollout plan" da spec).
