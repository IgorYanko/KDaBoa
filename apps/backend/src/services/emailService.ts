import nodemailer from 'nodemailer';

export async function enviarEmailRecuperacao(
  emailDestino: string,
  token: string,
): Promise<{ messageId: string }> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, FRONTEND_URL } =
    process.env;

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

  const baseUrl = FRONTEND_URL || 'http://localhost:5173';
  const linkRedefinicao = `${baseUrl}/redefinir-senha?token=${token}`;
  const remetente = SMTP_FROM || SMTP_USER;

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