import { NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos. Token e nova senha são obrigatórios.' },
        { status: 400 }
      );
    }

    // Retrieve token data from settings
    const tokenKey = `reset_token:${token}`;
    const rawData = await dbHelper.getSetting(tokenKey, '');

    if (!rawData) {
      return NextResponse.json(
        { error: 'Token inválido ou já utilizado.' },
        { status: 400 }
      );
    }

    let tokenData;
    try {
      tokenData = JSON.parse(rawData);
    } catch (e) {
      return NextResponse.json(
        { error: 'Erro ao processar dados de validação do token.' },
        { status: 500 }
      );
    }

    const { email, expiresAt } = tokenData;

    // Check expiration
    if (Date.now() > expiresAt) {
      // Clean up expired token
      await dbHelper.deleteSetting(tokenKey);
      return NextResponse.json(
        { error: 'Token de recuperação expirou. Por favor, solicite uma nova redefinição.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const newPasswordHash = hashPassword(password);

    // Update user's password in database
    const success = await dbHelper.updateUserPassword(email, newPasswordHash);

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao atualizar a senha do usuário.' },
        { status: 500 }
      );
    }

    // Delete token to prevent reuse
    await dbHelper.deleteSetting(tokenKey);

    return NextResponse.json({
      success: true,
      message: 'Sua senha foi redefinida com sucesso! Agora você já pode fazer login.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao redefinir sua senha.' },
      { status: 500 }
    );
  }
}
