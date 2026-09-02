#!/usr/bin/env node
// Sincroniza docs/api/openapi.yaml (cópia vendorizada) a partir de um
// checkout local do pep-main, assumido como pasta irmã deste repo
// (../pep). Nunca busca o contrato ao vivo por URL em build — ver
// ADR-0004 (pep-main/docs/adr/0004-frontend-vue-nuxt-repo-proprio.md)
// pra justificativa: build tem que ser reproduzível sem depender de um
// backend estar de pé numa rede específica, e uma mudança de contrato
// precisa ser um commit revisável aqui, não um efeito colateral silencioso
// do próximo `npm install`.
//
// Uso: npm run api:sync -- [caminho para o checkout do pep-main]
// Sem argumento, tenta ../pep (convenção adotada no README).

import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const sourceRepo = process.argv[2] ?? resolve(import.meta.dirname, '../../pep');
const source = resolve(sourceRepo, 'docs/api/openapi.yaml');
const dest = resolve(import.meta.dirname, '../docs/api/openapi.yaml');

if (!existsSync(source)) {
  console.error(`Não encontrei ${source}.`);
  console.error('Rode com o caminho do checkout do pep-main: npm run api:sync -- /caminho/pro/pep');
  process.exit(1);
}

copyFileSync(source, dest);
console.log(`Copiado ${source} -> ${dest}.`);
console.log('Rode "npm run api:types" em seguida pra regerar os tipos TS a partir do contrato novo.');
