import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
  // Always log to console for debugging
  console.log(`\n🔐 [GOOBOX PASSWORD RESET]\n   E-mail: ${email}\n   Código OTP: ${code}\n   Expira em: 15 minutos\n`);

  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY não configurado. Código exibido apenas no console.');
    return true; // Return true so the flow continues in dev
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Goobox <onboarding@resend.dev>',
      to: email,
      subject: `${code} é o seu código de recuperação - Goobox`,
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#13131f,#1a1a2e);border:1px solid rgba(124,58,237,0.3);border-radius:16px;overflow:hidden;max-width:500px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6c25e2,#7c3aed);padding:32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:12px 20px;">
                    <span style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">📦 Goobox</span>
                  </td>
                </tr>
              </table>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:12px 0 0 0;">Painel SMM de Alta Qualidade</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h2 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px 0;">🔐 Recuperação de Senha</h2>
              <p style="color:#98a2b3;font-size:15px;line-height:1.6;margin:0 0 28px 0;">
                Recebemos uma solicitação para redefinir a senha da sua conta Goobox. Use o código abaixo para continuar.
              </p>

              <!-- OTP Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:rgba(108,37,226,0.12);border:2px solid rgba(124,58,237,0.5);border-radius:12px;padding:24px;text-align:center;">
                    <p style="color:#98a2b3;font-size:13px;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Seu código de verificação</p>
                    <span style="font-size:48px;font-weight:900;color:#7c3aed;letter-spacing:12px;font-family:monospace;">${code}</span>
                  </td>
                </tr>
              </table>

              <!-- Info boxes -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:8px;padding:14px 16px;margin-bottom:8px;">
                    <span style="color:#fbbf24;font-size:13px;">⏱️ <strong>Expira em 15 minutos</strong> — Use o código rapidamente!</span>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:14px 16px;">
                    <span style="color:#10b981;font-size:13px;">🔒 <strong>Uso único</strong> — Este código é válido para uma única redefinição.</span>
                  </td>
                </tr>
              </table>

              <p style="color:#4a5568;font-size:13px;margin:28px 0 0 0;line-height:1.6;">
                Se você não solicitou a recuperação de senha, ignore este e-mail. Sua conta permanece segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid rgba(255,255,255,0.06);padding:20px 32px;text-align:center;">
              <p style="color:#4a5568;font-size:12px;margin:0;">© 2025 Goobox. Todos os direitos reservados.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }

    console.log(`✅ E-mail de recuperação enviado para: ${email}`);
    return true;
  } catch (err) {
    console.error('❌ Falha ao enviar e-mail:', err);
    return false;
  }
}
