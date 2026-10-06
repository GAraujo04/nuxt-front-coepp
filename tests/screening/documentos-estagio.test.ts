import { describe, expect, it, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import DocumentField from '../../app/components/DocumentField.vue';
import DocumentRepeatGroup from '../../app/components/DocumentRepeatGroup.vue';
import { ref } from 'vue';
import { addItem, DOC_TYPE_LABEL, initialContentFor, missingFields, PATIENT_DOC_SLOTS, removeItem, setAt, stepsFor } from '../../app/shared/screening/fields';
import type { ScreeningType } from '../../app/composables/useScreenings';

// Mesmo motivo do teste de middleware: plugins do Nuxt rodam no boot e o
// bootstrap de sessão chamaria a API de verdade.
vi.mock('../../app/shared/api/client', () => ({
  api: {
    post: () => Promise.reject(new Error('sem sessão (mock de teste)')),
    get: () => Promise.reject(new Error('sem sessão (mock de teste)')),
  },
}));

const ALL_TYPES: ScreeningType[] = [
  'SCREENING_ADULT',
  'SCREENING_CHILD',
  'EVOLUTION',
  'WEEKLY_REPORT',
  'PSYCH_ASSESSMENT',
  'PSYCH_REPORT',
  'PARTIAL_REPORT',
  'FINAL_REPORT',
];

const ESTAGIO: ScreeningType[] = [
  'EVOLUTION',
  'WEEKLY_REPORT',
  'PSYCH_ASSESSMENT',
  'PSYCH_REPORT',
  'PARTIAL_REPORT',
  'FINAL_REPORT',
];

describe('documentos de estágio — mesmo wizard da triagem', () => {
  it('todo tipo tem roteiro de etapas e rótulo (sem isso o wizard abriria vazio)', () => {
    for (const type of ESTAGIO) {
      expect(stepsFor(type).length, `${type} sem etapas`).toBeGreaterThan(0);
      expect(DOC_TYPE_LABEL[type], `${type} sem rótulo`).toBeTruthy();
    }
  });

  it('a Ficha de Evolução renderiza os 4 campos do .docx por atendimento', async () => {
    const step = stepsFor('EVOLUTION')[0]!;
    expect(step.repeat).toBeDefined();

    const wrapper = await mountSuspended(DocumentRepeatGroup, {
      props: {
        repeat: step.repeat!,
        // Dois atendimentos já preenchidos: é o caso que o papel resolve
        // repetindo o bloco na folha.
        content: {
          sessoes: [
            { dataAtendimento: '2026-09-16', sinteseAtendimento: 'primeira sessão' },
            { dataAtendimento: '2026-09-23', sinteseAtendimento: 'segunda sessão' },
          ],
        },
      },
    });

    const html = wrapper.html();
    expect(html).toContain('Data do atendimento');
    expect(html).toContain('Síntese do atendimento');
    expect(html).toContain('Estagiário(a) que realizou o atendimento');
    expect(html).toContain('Supervisor(a) responsável');
    // Um bloco por atendimento, numerado, mais o botão de acrescentar.
    expect(html).toContain('Atendimento 1');
    expect(html).toContain('Atendimento 2');
    expect(html).toContain('+ Adicionar atendimento');
    expect(html).toContain('2026-09-16');
    expect(html).toContain('primeira sessão');
  });

  it('o laudo mostra a identificação do paciente sem deixar editar', async () => {
    const identificacao = stepsFor('PSYCH_ASSESSMENT')[0]!;
    const campoNome = identificacao.fields.find((f) => f.path === 'identificacao.nome')!;
    expect(campoNome.kind).toBe('readonly');

    const wrapper = await mountSuspended(DocumentField, {
      props: { field: campoNome, value: 'Eneci Ruggeri' },
    });

    expect(wrapper.text()).toContain('Eneci Ruggeri');
    // Sem input: é texto. Um input desabilitado sugeriria que habilita
    // em outro estado do documento.
    expect(wrapper.find('input').exists()).toBe(false);
  });

  it('a criação copia a identificação do cadastro (única chance — o campo não é editável)', () => {
    const paciente = { fullName: 'Eneci Ruggeri', birthDate: '1990-05-10' };

    expect(initialContentFor('PSYCH_ASSESSMENT', paciente)).toEqual({
      identificacao: { nome: 'Eneci Ruggeri', dataNascimento: '1990-05-10' },
    });
    expect(initialContentFor('WEEKLY_REPORT', paciente)).toEqual({
      identificacao: { pacienteInstituicao: 'Eneci Ruggeri' },
    });
    // A ficha já abre com o primeiro atendimento em branco.
    expect(initialContentFor('EVOLUTION', paciente)).toEqual({ sessoes: [{}] });
  });

  it('uma ficha sem nenhum atendimento não passa como completa', () => {
    const vazia = missingFields('EVOLUTION', {});
    expect(vazia.some((m) => m.label.includes('nenhum registrado'))).toBe(true);

    // Com um atendimento pela metade, falta o que falta nele — e o rótulo
    // diz de qual atendimento se trata.
    const parcial = missingFields('EVOLUTION', { sessoes: [{ dataAtendimento: '2026-09-16' }] });
    expect(parcial.map((m) => m.label)).toContain('Atendimento 1 — Síntese do atendimento');
  });
});

describe('as sete linhas fixas do prontuário', () => {
  it('são sete, e a triagem é uma linha só com as duas variantes', () => {
    expect(PATIENT_DOC_SLOTS).toHaveLength(7);

    const triagem = PATIENT_DOC_SLOTS.find((s) => s.id === 'triagem')!;
    // Adulto e criança são excludentes: o paciente é um ou outro, então
    // ocupam a MESMA linha — é o que faz sete e não oito.
    expect(triagem.types).toEqual(['SCREENING_ADULT', 'SCREENING_CHILD']);
  });

  it('cobrem todos os tipos, sem sobra e sem repetição', () => {
    const nosSlots = PATIENT_DOC_SLOTS.flatMap((s) => s.types);
    // Sem repetição: um tipo em duas linhas faria o mesmo documento aparecer
    // duas vezes no prontuário.
    expect(new Set(nosSlots).size).toBe(nosSlots.length);
    // Sem sobra: um tipo fora das linhas seria um documento que o estagiário
    // não tem por onde começar — é a falha que esta invariante existe pra pegar.
    expect([...nosSlots].sort()).toEqual([...ALL_TYPES].sort());
  });

  it('toda linha tem rótulo, mesmo antes de o documento existir', () => {
    for (const slot of PATIENT_DOC_SLOTS) {
      expect(slot.label, `slot ${slot.id} sem rótulo`).toBeTruthy();
      for (const t of slot.types) expect(DOC_TYPE_LABEL[t], `${t} sem rótulo`).toBeTruthy();
    }
  });
});

// No wizard o content é um ref — um Proxy reativo. structuredClone rejeita
// Proxy, então setAt/addItem lançavam e toda edição (e o "+ Adicionar
// atendimento") era descartada em silêncio.
describe('edição do content reativo', () => {
  it('setAt, addItem e removeItem aceitam o content de um ref', () => {
    const content = ref<Record<string, unknown>>({ sessoes: [{}] });

    content.value = setAt(content.value, 'sessoes.0.dataAtendimento', '2026-10-06');
    content.value = addItem(content.value, 'sessoes');
    expect(content.value).toEqual({ sessoes: [{ dataAtendimento: '2026-10-06' }, {}] });

    content.value = removeItem(content.value, 'sessoes', 0);
    expect(content.value).toEqual({ sessoes: [{}] });
  });
});
