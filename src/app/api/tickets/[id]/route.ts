import { NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/tickets/[id]?email=user@example.com
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
    }

    const user = await dbHelper.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const ticketData = await dbHelper.getTicketById(id);
    if (!ticketData) {
      return NextResponse.json({ error: 'Ticket não encontrado.' }, { status: 404 });
    }

    // Security Check: Users can only see their own tickets, Admin can see all
    if (user.role !== 'admin' && ticketData.ticket.userEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    return NextResponse.json(ticketData);
  } catch (error) {
    console.error('Error fetching ticket messages:', error);
    return NextResponse.json({ error: 'Erro ao carregar mensagens do ticket.' }, { status: 500 });
  }
}

// POST /api/tickets/[id]
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { email, message, action } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
    }

    const user = await dbHelper.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const ticketData = await dbHelper.getTicketById(id);
    if (!ticketData) {
      return NextResponse.json({ error: 'Ticket não encontrado.' }, { status: 404 });
    }

    // Security Check: Users can only interact with their own tickets, Admin can interact with all
    if (user.role !== 'admin' && ticketData.ticket.userEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Handle closing the ticket
    if (action === 'close') {
      await dbHelper.updateTicketStatus(id, 'fechado');
      
      // Log a system message that the ticket was closed
      const closerName = user.role === 'admin' ? 'Administrador' : 'Usuário';
      await dbHelper.addTicketMessage(id, user.role === 'admin' ? 'admin' : 'user', `[Sistema] Ticket encerrado pelo ${closerName}.`);

      return NextResponse.json({
        success: true,
        message: 'Ticket encerrado com sucesso.'
      });
    }

    // Handle posting a message
    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'A mensagem não pode ser vazia.' }, { status: 400 });
    }

    const sender = user.role === 'admin' ? 'admin' : 'user';
    const newMsg = await dbHelper.addTicketMessage(id, sender, message);

    return NextResponse.json({
      success: true,
      message: newMsg
    });
  } catch (error) {
    console.error('Error posting ticket message / action:', error);
    return NextResponse.json({ error: 'Erro ao enviar mensagem / ação.' }, { status: 500 });
  }
}
