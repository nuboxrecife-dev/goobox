import { NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';

// GET /api/tickets?email=user@example.com
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
    }

    const user = await dbHelper.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    let tickets;
    if (user.role === 'admin') {
      // Admin sees all tickets
      tickets = await dbHelper.getTickets();
    } else {
      // User only sees their own tickets
      tickets = await dbHelper.getTickets(email);
    }

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Erro ao carregar tickets.' }, { status: 500 });
  }
}

// POST /api/tickets
export async function POST(request: Request) {
  try {
    const { email, subject, message } = await request.json();

    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos os campos (email, assunto, mensagem) são obrigatórios.' },
        { status: 400 }
      );
    }

    const user = await dbHelper.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const newTicket = await dbHelper.createTicket(email, subject, message);
    
    // Also create initial ticket message automatically
    await dbHelper.addTicketMessage(newTicket.id, 'user', message);

    return NextResponse.json({
      success: true,
      ticket: newTicket
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Erro ao criar ticket de suporte.' }, { status: 500 });
  }
}
