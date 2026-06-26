import { NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Por favor, informe o seu e-mail.' },
        { status: 400 }
      );
    }

    const user = await dbHelper.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'E-mail não cadastrado em nossa base.' },
        { status: 404 }
      );
    }

    // Generate a secure reset token
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour expiry

    // Save token mapping in settings
    const tokenData = {
      email: user.email,
      expiresAt
    };
    await dbHelper.updateSetting(`reset_token:${token}`, JSON.stringify(tokenData));

    console.log(`[SIMULAÇÃO] Email de recuperação enviado para: ${email}`);
    console.log(`[SIMULAÇÃO] Token: ${token}`);

    // Return the token and a simulated URL link for easy local testing
    return NextResponse.json({
      success: true,
      message: 'Instruções de redefinição de senha enviadas para o e-mail informado!',
      token,
      simulatedLink: `/?token=${token}`
    });
  } catch (error) {
    console.error('Password recovery error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a recuperação de senha.' },
      { status: 500 }
    );
  }
}
