import { useRef, useState } from 'react';
import { ErroApi } from '../../api/client';
import { Campo } from '../../components/Campo';
import { Icone } from '../../components/Icone';
import { buscarCep, digitosDoCep, formatarCep } from '../../services/cep';
import styles from './Divulgar.module.css';
import type { ErrosEvento, FormularioEvento } from './validarEvento';

interface Props {
  formulario: FormularioEvento;
  erros: ErrosEvento;
  alterar: <K extends keyof FormularioEvento>(campo: K, valor: FormularioEvento[K]) => void;
  marcarErro: (campo: keyof FormularioEvento, mensagem: string) => void;
}

/**
 * Local novo no Divulgar (issue #44): ao completar o CEP, o ViaCEP preenche rua, bairro e cidade.
 * CEP inexistente não preenche nada e avisa no próprio campo.
 */
export function NovoLocal({ formulario, erros, alterar, marcarErro }: Props) {
  const [buscando, setBuscando] = useState(false);
  /** CEP da última busca: evita buscar o mesmo de novo e ignora respostas de um CEP já trocado. */
  const ultimaBusca = useRef('');

  function limparEndereco() {
    alterar('logradouro', '');
    alterar('bairro', '');
    alterar('cidade', '');
  }

  async function consultar(digitos: string) {
    if (digitos === ultimaBusca.current) return;
    ultimaBusca.current = digitos;
    setBuscando(true);
    try {
      const endereco = await buscarCep(digitos);
      if (ultimaBusca.current !== digitos) return;
      alterar('logradouro', endereco.logradouro);
      alterar('bairro', endereco.bairro);
      alterar('cidade', `${endereco.cidade}/${endereco.uf}`);
    } catch (e) {
      if (ultimaBusca.current !== digitos) return;
      limparEndereco();
      marcarErro('cep', e instanceof ErroApi ? e.message : 'Não foi possível consultar o CEP.');
      ultimaBusca.current = '';
    } finally {
      setBuscando(false);
    }
  }

  function aoDigitarCep(valor: string) {
    const formatado = formatarCep(valor);
    alterar('cep', formatado);
    const digitos = digitosDoCep(formatado);
    if (digitos.length === 8) {
      consultar(digitos);
    } else if (formulario.cidade) {
      // Mudou o CEP depois de achar: o endereço antigo não vale mais.
      ultimaBusca.current = '';
      limparEndereco();
    }
  }

  return (
    <div className={styles.novoLocal}>
      <Campo
        rotulo="Nome do local"
        name="novoLocalNome"
        placeholder="Ex.: Espaço Cultural da Vila"
        maxLength={120}
        value={formulario.novoLocalNome}
        erro={erros.novoLocalNome}
        onChange={(e) => alterar('novoLocalNome', e.target.value)}
      />
      <Campo
        rotulo="CEP"
        name="cep"
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="00000-000"
        maxLength={9}
        value={formulario.cep}
        erro={erros.cep}
        onChange={(e) => aoDigitarCep(e.target.value)}
      />

      {buscando && (
        <p className={styles.cepStatus} role="status">
          <span className={styles.cepCarregando} aria-hidden="true" />
          Buscando o endereço…
        </p>
      )}
      {!buscando && formulario.cidade && (
        <p className={`${styles.cepStatus} ${styles.cepAchado}`} role="status">
          <Icone nome="check" tamanho={16} />
          Endereço encontrado em {formulario.cidade}
        </p>
      )}

      {formulario.cidade && (
        <>
          <Campo
            rotulo="Rua"
            name="logradouro"
            placeholder="Nome da rua ou avenida"
            maxLength={150}
            value={formulario.logradouro}
            erro={erros.logradouro}
            onChange={(e) => alterar('logradouro', e.target.value)}
          />
          <div className={styles.duasColunas}>
            <Campo
              rotulo="Número"
              name="numero"
              placeholder="Ex.: 150 ou s/n"
              maxLength={10}
              value={formulario.numero}
              erro={erros.numero}
              onChange={(e) => alterar('numero', e.target.value)}
            />
            <Campo
              rotulo="Bairro"
              name="bairro"
              placeholder="Bairro"
              maxLength={80}
              value={formulario.bairro}
              onChange={(e) => alterar('bairro', e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}
