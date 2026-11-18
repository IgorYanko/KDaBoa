import { type ChangeEvent, useEffect, useId, useRef, useState } from 'react';
import type { CampoProps } from './Campo';
import styles from './Campo.module.css';
import { Icone } from './Icone';

/**
 * Data e horário sempre no formato brasileiro (dd/mm/aaaa e 24h), independente do idioma do navegador.
 * O <input type="date"> nativo mostra mm/dd/yyyy em navegadores em inglês; aqui a pessoa digita
 * com máscara e o valor entregue continua o mesmo do input nativo ("aaaa-mm-dd" e "hh:mm"),
 * então quem usa o Campo não precisa mudar nada.
 */

const MASCARA = {
  date: { digitos: 8, placeholder: 'dd/mm/aaaa', invalido: 'Data inválida.', incompleto: 'Complete a data (dd/mm/aaaa).' },
  time: { digitos: 4, placeholder: 'hh:mm', invalido: 'Horário inválido.', incompleto: 'Complete o horário (hh:mm).' },
};

type Tipo = keyof typeof MASCARA;

/** "14031998" → "14/03/1998" · "2130" → "21:30" (o separador só entra quando o próximo número chega). */
function formatar(tipo: Tipo, digitos: string): string {
  if (tipo === 'time') return digitos.length > 2 ? `${digitos.slice(0, 2)}:${digitos.slice(2)}` : digitos;
  let texto = digitos.slice(0, 2);
  if (digitos.length > 2) texto += `/${digitos.slice(2, 4)}`;
  if (digitos.length > 4) texto += `/${digitos.slice(4)}`;
  return texto;
}

/** Texto digitado → valor do input nativo ("aaaa-mm-dd" / "hh:mm"); "" se incompleto ou inválido. */
function paraValor(tipo: Tipo, texto: string): string {
  const d = texto.replace(/\D/g, '');
  if (d.length !== MASCARA[tipo].digitos) return '';
  if (tipo === 'time') {
    const [h, m] = [Number(d.slice(0, 2)), Number(d.slice(2))];
    return h < 24 && m < 60 ? `${d.slice(0, 2)}:${d.slice(2)}` : '';
  }
  const [dia, mes, ano] = [Number(d.slice(0, 2)), Number(d.slice(2, 4)), Number(d.slice(4))];
  const data = new Date(ano, mes - 1, dia);
  const existe = data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  return existe && ano >= 1900 ? `${d.slice(4)}-${d.slice(2, 4)}-${d.slice(0, 2)}` : '';
}

/** Valor do input nativo → texto exibido. */
function paraTexto(tipo: Tipo, valor: string): string {
  if (!valor) return '';
  if (tipo === 'time') return valor.slice(0, 5);
  const [ano, mes, dia] = valor.split('-');
  return `${dia}/${mes}/${ano}`;
}

interface Props extends CampoProps {
  type: Tipo;
}

export function CampoDataHora({
  type: tipo,
  rotulo,
  erro,
  compacto,
  id,
  className,
  value,
  onChange,
  name,
  min,
  max,
  placeholder,
  acessorio: _acessorio,
  icone: _icone,
  ...props
}: Props) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idErro = `${idCampo}-erro`;
  const valor = typeof value === 'string' ? value : '';
  const mascara = MASCARA[tipo];

  const [texto, setTexto] = useState(() => paraTexto(tipo, valor));
  const seletor = useRef<HTMLInputElement>(null);

  // Valor trocado por fora (ex.: formulário limpo): atualiza o texto exibido.
  useEffect(() => {
    setTexto((atual) => (paraValor(tipo, atual) === valor ? atual : paraTexto(tipo, valor)));
  }, [tipo, valor]);

  /** Avisa quem usa o Campo com um evento no formato do input nativo. */
  function emitir(novoValor: string) {
    const alvo = { value: novoValor, name: name ?? '' };
    onChange?.({ target: alvo, currentTarget: alvo } as unknown as ChangeEvent<HTMLInputElement>);
  }

  function aoDigitar(evento: ChangeEvent<HTMLInputElement>) {
    const digitos = evento.target.value.replace(/\D/g, '').slice(0, mascara.digitos);
    const novo = formatar(tipo, digitos);
    setTexto(novo);
    emitir(paraValor(tipo, novo));
  }

  function aoEscolherNoCalendario(evento: ChangeEvent<HTMLInputElement>) {
    setTexto(paraTexto(tipo, evento.target.value));
    emitir(evento.target.value);
  }

  const digitos = texto.replace(/\D/g, '');
  const completo = digitos.length === mascara.digitos;
  // Erro de quem usa o Campo tem prioridade; com o texto pela metade, explica o formato.
  let mensagem = erro;
  if (completo && !paraValor(tipo, texto)) mensagem = mascara.invalido;
  else if (erro && digitos.length > 0 && !completo) mensagem = mascara.incompleto;

  const temCalendario = tipo === 'date' && typeof HTMLInputElement !== 'undefined' && 'showPicker' in HTMLInputElement.prototype;
  const classesInput = [styles.input, compacto && styles.compacto, temCalendario && styles.comAcessorio, mensagem && styles.invalido]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className ? `${styles.campo} ${className}` : styles.campo}>
      <label htmlFor={idCampo} className={styles.rotulo}>
        {rotulo}
      </label>
      <div className={styles.caixa}>
        <input
          {...props}
          id={idCampo}
          name={name}
          type="text"
          inputMode="numeric"
          placeholder={placeholder ?? mascara.placeholder}
          maxLength={mascara.placeholder.length}
          className={classesInput}
          value={texto}
          onChange={aoDigitar}
          aria-invalid={mensagem ? true : undefined}
          aria-describedby={mensagem ? idErro : undefined}
        />
        {temCalendario && (
          <div className={styles.acessorio}>
            <button
              type="button"
              className={styles.botaoCalendario}
              aria-label="Abrir calendário"
              onClick={() => seletor.current?.showPicker()}
            >
              <Icone nome="calendario" tamanho={18} />
            </button>
            {/* Input nativo escondido, só para abrir o calendário do sistema. */}
            <input
              ref={seletor}
              type="date"
              tabIndex={-1}
              aria-hidden="true"
              className={styles.seletorOculto}
              min={min}
              max={max}
              value={valor}
              onChange={aoEscolherNoCalendario}
            />
          </div>
        )}
      </div>
      {mensagem && (
        <p id={idErro} className={styles.erro}>
          <Icone nome="alerta" tamanho={14} />
          {mensagem}
        </p>
      )}
    </div>
  );
}
