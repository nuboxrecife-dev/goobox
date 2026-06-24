import { NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';

export async function GET() {
  try {
    const markup = await dbHelper.getSetting('service_markup_percent', '20');
    const whatsapp = await dbHelper.getSetting('support_whatsapp_number', '5511999999999');
    return NextResponse.json({ 
      serviceMarkupPercent: parseFloat(markup),
      supportWhatsappNumber: whatsapp
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json({ error: 'Erro ao carregar configurações.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { serviceMarkupPercent, supportWhatsappNumber } = await request.json();

    if (serviceMarkupPercent !== undefined) {
      if (isNaN(parseFloat(serviceMarkupPercent)) || parseFloat(serviceMarkupPercent) < 0) {
        return NextResponse.json({ error: 'Porcentagem de lucro inválida.' }, { status: 400 });
      }
      await dbHelper.updateSetting('service_markup_percent', parseFloat(serviceMarkupPercent).toString());
    }

    if (supportWhatsappNumber !== undefined) {
      const cleaned = supportWhatsappNumber.replace(/\D/g, '');
      if (cleaned.length < 8 || cleaned.length > 15) {
        return NextResponse.json({ error: 'Número de WhatsApp inválido. Insira apenas números com DDI + DDD (ex: 5511999999999).' }, { status: 400 });
      }
      await dbHelper.updateSetting('support_whatsapp_number', cleaned);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configurações atualizadas com sucesso!' 
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
