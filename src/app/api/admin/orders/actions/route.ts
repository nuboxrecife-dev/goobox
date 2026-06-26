import { NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { action, orderId, status } = await request.json().catch(() => ({}));

    if (!action || !orderId) {
      return NextResponse.json(
        { error: 'Ação e ID do pedido são obrigatórios.' },
        { status: 400 }
      );
    }

    if (action === 'refund') {
      const success = await dbHelper.refundOrder(orderId);
      if (!success) {
        return NextResponse.json(
          { error: 'Não foi possível reembolsar o pedido. Verifique se ele existe ou se já foi cancelado/reembolsado.' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Pedido reembolsado e cancelado com sucesso!'
      });
    }

    if (action === 'update_status') {
      if (!status) {
        return NextResponse.json(
          { error: 'Status é obrigatório para atualização.' },
          { status: 400 }
        );
      }

      const allowedStatuses = ['Pendente', 'Processando', 'Concluido', 'Cancelado', 'Parcial'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status inválido.' },
          { status: 400 }
        );
      }

      // If updating to Cancelado from another status, we might want to refund?
      // But let's keep status update separate from direct refund so admins have flexibility.
      // E.g., they can just cancel without refunding, or refund explicitly.
      await dbHelper.updateOrderStatus(orderId, status);
      return NextResponse.json({
        success: true,
        message: `Status do pedido atualizado para "${status}" com sucesso!`
      });
    }

    return NextResponse.json(
      { error: 'Ação inválida.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in admin orders actions:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar ação do pedido.' },
      { status: 500 }
    );
  }
}
