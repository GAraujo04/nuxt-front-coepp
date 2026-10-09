#!/usr/bin/env node
// Sincroniza docs/api/openapi.json (cópia vendorizada) a partir do backend
// (python-back-coepp), assumido como pasta irmã deste repo. O backend gera
// esse arquivo das próprias rotas (python -m scripts.export_openapi) e a CI
// dele garante que está em dia.
//
// Cópia vendorizada, e não leitura ao vivo por URL: o build tem que ser
// reproduzível sem backend no ar, e uma mudança de contrato precisa ser um
// commit revisável aqui (ADR-0004).
//
// Uso: npm run api:sync -- [caminho para o checkout do backend]
// Sem argumento, tenta ../python-back-coepp.

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const sourceRepo = process.argv[2] ?? resolve(import.meta.dirname, '../../python-back-coepp');
const source = resolve(sourceRepo, 'docs/api/openapi.json');
const dest = resolve(import.meta.dirname, '../docs/api/openapi.json');

if (!existsSync(source)) {
  console.error(`Não encontrei ${source}.`);
  console.error('Rode com o caminho do backend: npm run api:sync -- /caminho/pro/python-back-coepp');
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(source, dest);
console.log(`Copiado ${source} -> ${dest}.`);
console.log('Rode "npm run api:types" em seguida pra regerar os tipos TS a partir do contrato novo.');
