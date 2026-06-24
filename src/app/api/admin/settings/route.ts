import { NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';

export async function GET() {
  try {
    const markup = await dbHelper.getSetting('service_markup_percent', '20');
    return NextResponse.json({ serviceMarkupPercent: parseFloat(markup) });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json({ error: 'Erro ao carregar configurações.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { serviceMarkupPercent } = await request.json();

    if (serviceMarkupPercent === undefined || isNaN(parseFloat(serviceMarkupPercent)) || parseFloat(serviceMarkupPercent) < 0) {
      return NextResponse.json({ error: 'Porcentagem de lucro inválida.' }, { status: 400 });
    }

    await dbHelper.updateSetting('service_markup_percent', parseFloat(serviceMarkupPercent).toString());
    
    return NextResponse.json({ 
      success: true, 
      message: 'Margem de lucro atualizada com sucesso!' 
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
