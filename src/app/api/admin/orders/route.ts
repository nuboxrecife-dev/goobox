import { NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';

export async function GET() {
  try {
    const orders = await dbHelper.getAllOrdersAdmin();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ error: 'Erro ao carregar todos os pedidos.' }, { status: 500 });
  }
}
