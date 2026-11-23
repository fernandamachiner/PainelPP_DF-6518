import { Resend } from "resend";

/** E-mail só funciona se houver RESEND_API_KEY e EMAIL_REMETENTE no .env. */
export const emailConfigurado = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_REMETENTE);

export async function enviarEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  if (!emailConfigurado()) {
    console.warn(`[email] não configurado — e-mail para ${to} não enviado: ${subject}`);
    return false;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: process.env.EMAIL_REMETENTE!, to: [to], subject, text, html });
  if (error) throw new Error(`Falha ao enviar e-mail: ${error.message}`);
  return true;
}

export function emailRedefinicao(nome: string, link: string) {
  const ola = nome ? `Olá, ${nome}!` : "Olá!";
  return {
    subject: "Redefinir sua senha — Painel Pesquisadores Populares",
    text: `${ola}\n\nRecebemos um pedido para redefinir sua senha no Painel Pesquisadores Populares Interseccionais.\n\nPara criar uma nova senha, abra este link (vale por 1 hora):\n${link}\n\nSe não foi você, ignore este e-mail. Sua senha continua a mesma.`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2a1f;line-height:1.5">
<p>${ola}</p><p>Recebemos um pedido para redefinir sua senha no <b>Painel Pesquisadores Populares Interseccionais</b>.</p>
<p><a href="${link}" style="display:inline-block;background:#1f4a2c;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Criar nova senha</a></p>
<p style="color:#666;font-size:13px">O link vale por 1 hora. Se não foi você, ignore este e-mail — sua senha continua a mesma.</p></div>`,
  };
}
