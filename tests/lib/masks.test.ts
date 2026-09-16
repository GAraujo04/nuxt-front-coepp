import { describe, expect, it } from 'vitest';
import { applyMask, maskCPF, maskPhone, MASK_LENGTH, phoneMaskLength, todayISO } from '../../app/shared/lib/masks';

// Simula o que o browser entrega no @input: o elemento já contém o texto
// digitado, INCLUSIVE o caractere que passou do limite.
function inputEvent(valorDigitado: string): Event {
  const el = document.createElement('input');
  el.value = valorDigitado;
  return { target: el } as unknown as Event;
}

describe('applyMask', () => {
  it('descarta o dígito excedente e corrige o DOM (regressão: campo parecia aceitar mais dígitos)', () => {
    // 12 dígitos num CPF de 11: o cenário que deixava o excedente visível.
    const event = inputEvent('000.000.000-009');
    const retorno = applyMask(event, maskCPF);

    expect(retorno).toBe('000.000.000-00');
    // O ponto do helper: sem a reescrita, isto continuaria com o '9' no fim,
    // porque o model não muda e o Vue não repinta um input ligado por :value.
    expect((event.target as HTMLInputElement).value).toBe('000.000.000-00');
  });

  it('não mexe no texto quando a máscara não tinha nada a corrigir', () => {
    const event = inputEvent('123.456.789-0');
    expect(applyMask(event, maskCPF)).toBe('123.456.789-0');
    expect((event.target as HTMLInputElement).value).toBe('123.456.789-0');
  });

  it('limita o telefone conforme móvel (11 dígitos) ou fixo (10)', () => {
    const movel = inputEvent('(11) 91234-56789');
    expect(applyMask(movel, (raw) => maskPhone(raw, true))).toBe('(11) 91234-5678');

    const fixo = inputEvent('(11) 1234-56789');
    expect(applyMask(fixo, (raw) => maskPhone(raw, false))).toBe('(11) 1234-5678');
  });
});

describe('comprimentos declarados no maxlength', () => {
  it('batem com o que a máscara produz no limite', () => {
    expect(maskCPF('00000000000')).toHaveLength(MASK_LENGTH.cpf);
    expect(maskPhone('11912345678', true)).toHaveLength(phoneMaskLength(true));
    expect(maskPhone('1112345678', false)).toHaveLength(phoneMaskLength(false));
  });
});

describe('todayISO', () => {
  it('usa a data LOCAL, não a UTC (o max não pode liberar data futura à noite)', () => {
    const d = new Date();
    const esperado = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(todayISO()).toBe(esperado);
  });
});
