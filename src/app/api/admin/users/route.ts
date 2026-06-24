import { NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';

export async function GET() {
  try {
    const users = await dbHelper.getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Erro ao carregar usuários.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, amount } = await request.json();

    if (!email || amount === undefined || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
    }

    await dbHelper.adjustUserBalance(email, parseFloat(amount));
    
    return NextResponse.json({ 
      success: true, 
      message: `Saldo do usuário ${email} atualizado em R$ ${parseFloat(amount).toFixed(2)}.` 
    });
  } catch (error) {
    console.error('Error adjusting user balance:', error);
    return NextResponse.json({ error: 'Erro ao ajustar saldo do usuário.' }, { status: 500 });
  }
}
