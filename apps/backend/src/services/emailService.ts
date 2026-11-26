import nodemailer from 'nodemailer';

function criarTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Configuração SMTP ausente (SMTP_HOST, SMTP_USER, SMTP_PASS).');
  }

  const porta = Number(SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: porta,
    secure: porta === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return {
    transporter,
    remetente: SMTP_FROM || SMTP_USER,
  };
}

export async function enviarEmailRecuperacao(
  emailDestino: string,
  token: string,
): Promise<{ messageId: string }> {
  const { transporter, remetente } = criarTransporter();
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const linkRedefinicao = `${baseUrl}/redefinir-senha?token=${token}`;

  const info = await transporter.sendMail({
    from: `"KDaBoa" <${remetente}>`,
    to: emailDestino,
    subject: 'Recuperação de senha - KDaBoa',
    text: `Você solicitou a redefinição de senha. Use o token: ${token} ou acesse: ${linkRedefinicao}`,
    html: `<p>Você solicitou a redefinição de senha.</p><p>Seu token (válido por 1 hora): <b>${token}</b></p><p><a href="${linkRedefinicao}">Clique aqui para redefinir sua senha</a></p>`,
  });

  return {
    messageId: info.messageId,
  };
}

export interface DadosLembreteEvento {
  nomeUsuario: string;
  tituloEvento: string;
  dataInicio: Date;
  localNome?: string | null;
}

export async function enviarEmailLembrete(
  emailDestino: string,
  dados: DadosLembreteEvento,
): Promise<{ messageId: string }> {
  const { transporter, remetente } = criarTransporter();
  const horario = dados.dataInicio.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const localTexto = dados.localNome ? ` em ${dados.localNome}` : '';

  const info = await transporter.sendMail({
    from: `"KDaBoa" <${remetente}>`,
    to: emailDestino,
    subject: `Lembrete: ${dados.tituloEvento} é hoje! - KDaBoa`,
    text: `Olá, ${dados.nomeUsuario}! O evento "${dados.tituloEvento}" acontece hoje às ${horario}${localTexto}.`,
    html: `<p>Olá, <b>${dados.nomeUsuario}</b>!</p><p>Lembrete: o evento <b>${dados.tituloEvento}</b> acontece hoje às <b>${horario}</b>${localTexto}.</p>`,
  });

  return {
    messageId: info.messageId,
  };
}