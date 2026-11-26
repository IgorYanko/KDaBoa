import type { ReactNode } from 'react';

/**
 * Ícones do KdABoa: traço de 1.75 em grade 24×24, pontas arredondadas, cor do texto (currentColor).
 * Para mudar a cor, mude o `color` de quem envolve o ícone.
 */
const desenhos = {
  // Navegação
  inicio: <path d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.5V15h-5v5.5H5A1.5 1.5 0 0 1 3.5 19z" />,
  agenda: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  perfil: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1.4-3.7 4.2-5.5 7.5-5.5s6.1 1.8 7.5 5.5" />
    </>
  ),
  voltar: <path d="m14.5 18-6-6 6-6" />,
  'seta-direita': <path d="m9.5 18 6-6-6-6" />,
  fechar: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  sair: <path d="M14.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3.5M10 16.5 5.5 12 10 7.5M5.5 12h10" />,

  // Ações
  busca: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  mais: <path d="M12 5v14M5 12h14" />,
  editar: <path d="M4 20h4L18.6 9.4a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4" />,
  compartilhar: (
    <>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" />
    </>
  ),
  link: (
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1" />
  ),
  enviar: <path d="M20.5 3.5 10.6 13.4M20.5 3.5l-6.3 17-3.6-7.1-7.1-3.6z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  // Moderação do chat
  opcoes: (
    <>
      <circle cx="12" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  bloquear: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m6 6 12 12" />
    </>
  ),
  bandeira: <path d="M5 21V4.5M5 4.5c4-2 6 2 10 0s4-1 4-1v9s-1-.5-4 1-6-3-10-1" />,
  olho: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'olho-fechado': (
    <path d="M3.5 3.5l17 17M10.4 5.6c.5-.1 1-.1 1.6-.1 6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.9 3.7M6.6 6.7C4 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.3-.5 4.6-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  ),
  imagem: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <circle cx="9" cy="9" r="1.8" />
      <path d="m20.5 15-4.6-4.6L6 20.5" />
    </>
  ),
  upload: <path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15" />,
  lixeira: <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />,
  filtro: <path d="M4 7h16M7 12h10M10 17h4" />,
  alerta: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.8v4.7M12 16.2h.01" />
    </>
  ),
  brilho: (
    <path d="M11 3.5 12.6 8l4.4 1.6-4.4 1.6L11 15.5l-1.6-4.3L5 9.6 9.4 8zM18 14.5l.8 2.2 2.2.8-2.2.8L18 20.5l-.8-2.2-2.2-.8 2.2-.8z" />
  ),

  // Informações do evento
  local: (
    <>
      <path d="M12 21s-7-6-7-11.3a7 7 0 0 1 14 0C19 15 12 21 12 21z" />
      <circle cx="12" cy="9.7" r="2.5" />
    </>
  ),
  relogio: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  ingresso: (
    <path d="M3.5 9V6.5a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1V9a3 3 0 0 0 0 6v2.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V15a3 3 0 0 0 0-6zM14.5 5.5v2M14.5 11v2M14.5 16.5v2" />
  ),
  chat: <path d="M20.5 11.5a8 8 0 0 1-11.8 7L4 19.8l1.3-4.4a8 8 0 1 1 15.2-3.9z" />,
  cadeado: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  pessoas: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20c1-3.4 3.5-5.3 6.5-5.3s5.5 1.9 6.5 5.3M15.5 5.2a3.5 3.5 0 0 1 0 6.6M18 14.9c1.7.8 2.9 2.4 3.5 5.1" />
    </>
  ),
  mapa: <path d="M9 4.5 3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8zM9 4.5v12.7M15 6.8v12.7" />,
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2" />
    </>
  ),

  // Categorias
  musica: (
    <>
      <path d="M9 17.5V5.5l11-2v12" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="15.5" r="2.5" />
    </>
  ),
  festa: <path d="M4.5 4h15L12 12.5zM12 12.5V20M8 20h8M7.5 7.5h9" />,
  cultura: (
    <>
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1 0 1.7-.7 1.7-1.6 0-.4-.2-.8-.4-1.1a1.6 1.6 0 0 1 1.2-2.7h2a4 4 0 0 0 4-4c0-4.2-3.8-7.6-8.5-7.6z" />
      <circle cx="7.8" cy="11.5" r="1" />
      <circle cx="10" cy="7.6" r="1" />
      <circle cx="14.6" cy="7.6" r="1" />
    </>
  ),
  esporte: <path d="M3 12h4l2.5-6.5 5 13L17 12h4" />,
  gastronomia: <path d="M7 3.5V10a2 2 0 0 0 4 0V3.5M9 12v8.5M17 20.5V3.5c-2 1.3-3 3.7-3 6.8V13h3" />,
  teatro: (
    <path d="M4.5 4.5h15v6a7.5 7.5 0 0 1-15 0zM8.5 9h1.5M14 9h1.5M9.2 13.2a4 4 0 0 0 5.6 0" />
  ),
} satisfies Record<string, ReactNode>;

export type NomeIcone = keyof typeof desenhos;

/** Lista de todos os ícones (usada no guia de estilo). */
export const nomesIcones = Object.keys(desenhos) as NomeIcone[];

interface Props {
  nome: NomeIcone;
  /** Tamanho em px (padrão 20). */
  tamanho?: number;
  /** Espessura do traço (padrão 1.75). */
  traco?: number;
  /** Texto para leitores de tela. Sem ele, o ícone é decorativo. */
  rotulo?: string;
  className?: string;
}

/** Ícone SVG que herda a cor do texto. */
export function Icone({ nome, tamanho = 20, traco = 1.75, rotulo, className }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={traco}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      {desenhos[nome]}
    </svg>
  );
}
