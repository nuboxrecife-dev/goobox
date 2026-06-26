import { NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, currentPassword, newPassword } = await request.json();

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Por favor, preencha todos os campos.' },
        { status: 400 }
      );
    }

    const user = await dbHelper.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    // Verify current password
    if (user.passwordHash) {
      const isValid = verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Senha atual incorreta.' },
          { status: 400 }
        );
      }
    }

    // Hash the new password
    const newPasswordHash = hashPassword(newPassword);

    // Update user's password in database
    const success = await dbHelper.updateUserPassword(email, newPasswordHash);

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao atualizar a senha no banco de dados.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sua senha foi alterada com sucesso!'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao alterar sua senha.' },
      { status: 500 }
    );
  }
}
