import nodemailer from 'nodemailer';

export async function enviarEmailRecuperacao(
  emailDestino: string,
  token: string,
): Promise<{ messageId: string; previewUrl: string | false }> {
  let transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const contaTeste = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: contaTeste.smtp.host,
      port: contaTeste.smtp.port,
      secure: contaTeste.smtp.secure,
      auth: {
        user: contaTeste.user,
        pass: contaTeste.pass,
      },
    });
  }

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const linkRedefinicao = `${baseUrl}/redefinir-senha?token=${token}`;

  const info = await transporter.sendMail({
    from: '"KDaBoa" <no-reply@kdaboa.com>',
    to: emailDestino,
    subject: 'Recuperação de senha - KDaBoa',
    text: `Você solicitou a redefinição de senha. Use o token: ${token} ou acesse: ${linkRedefinicao}`,
    html: `<p>Você solicitou a redefinição de senha.</p><p>Seu token (válido por 1 hora): <b>${token}</b></p><p><a href="${linkRedefinicao}">Clique aqui para redefinir sua senha</a></p>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    previewUrl,
  };
}