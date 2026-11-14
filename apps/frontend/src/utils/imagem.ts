/** Tipos de imagem aceitos na capa do evento. */
export const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp'];

/** Tamanho máximo do arquivo escolhido (antes de reduzir). */
export const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

/** Mensagem de erro se o arquivo não servir como capa; null se estiver tudo certo. */
export function validarImagem(arquivo: File): string | null {
  if (!TIPOS_IMAGEM.includes(arquivo.type)) return 'Use uma imagem JPG, PNG ou WebP.';
  if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) return 'A imagem pode ter até 5 MB.';
  return null;
}

/**
 * Reduz a imagem para no máximo `larguraMaxima` px e devolve um data URL JPEG.
 * Usado no modo mock para guardar a capa no navegador sem estourar o espaço.
 */
export async function reduzirImagem(arquivo: File, larguraMaxima = 1280, qualidade = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, larguraMaxima / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const contexto = canvas.getContext('2d');
  if (!contexto) throw new Error('Canvas indisponível');
  contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', qualidade);
}
