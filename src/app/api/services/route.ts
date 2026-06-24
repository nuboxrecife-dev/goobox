import { NextResponse } from 'next/server';
import { supplierClient } from '@/lib/supplier';
import { dbHelper } from '@/lib/db';

export async function GET() {
  try {
    const rawServices = await supplierClient.getServices();
    
    // Buscar margem de lucro configurada (padrão 20%)
    const markupStr = await dbHelper.getSetting('service_markup_percent', '20');
    const markupPercent = parseFloat(markupStr);

    // Mapeia os serviços retornados da API real aplicando a margem de lucro
    const services = rawServices.map(srv => {
      const baseRate = parseFloat(srv.rate);
      const sellingRate = baseRate * (1 + markupPercent / 100);

      return {
        id: srv.service.toString(),
        name: `${srv.name} - R$ ${sellingRate.toFixed(2)} por 1000`,
        category: srv.category,
        ratePer1000: sellingRate,
        min: srv.min,
        max: srv.max,
        description: `Serviço de alta velocidade de tipo: ${srv.type}. Pedido mínimo de ${srv.min} e máximo de ${srv.max} unidades.`
      };
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching live services:', error);
    return NextResponse.json({ error: 'Erro ao carregar serviços da API real.' }, { status: 500 });
  }
}
