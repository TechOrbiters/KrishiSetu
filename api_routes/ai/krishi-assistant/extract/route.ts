import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { voiceText = '' } = body;

    // Extract crop, quantity, and price from voiceText (Hindi / English)
    const lower = voiceText.toLowerCase();

    let cropName = 'टमाटर';
    if (/आलू|potato/i.test(lower)) cropName = 'आलू';
    if (/प्याज|onion/i.test(lower)) cropName = 'प्याज';
    if (/गेहूँ|wheat/i.test(lower)) cropName = 'गेहूँ';
    if (/धान|चावल|rice|paddy/i.test(lower)) cropName = 'धान';
    if (/मिर्च|chilli/i.test(lower)) cropName = 'हरी मिर्च';

    // Quantity regex
    const qtyMatch = voiceText.match(/(\d+)\s*(किलो|kg|क्विंटल|quintal|टन|ton)/i);
    let quantityKg = 500;
    if (qtyMatch) {
      const num = parseInt(qtyMatch[1], 10);
      const unit = qtyMatch[2].toLowerCase();
      if (unit.includes('क्विंटल') || unit.includes('quintal')) quantityKg = num * 100;
      else if (unit.includes('टन') || unit.includes('ton')) quantityKg = num * 1000;
      else quantityKg = num;
    }

    // Price regex
    const priceMatch = voiceText.match(/(\d+)\s*(रुपये|रुपए|रु|rs|inr)/i);
    let pricePerKg = 25;
    if (priceMatch) {
      pricePerKg = parseInt(priceMatch[1], 10);
    }

    return NextResponse.json({
      success: true,
      data: {
        cropName,
        quantityKg,
        pricePerKg,
        harvestDate: new Date().toISOString().split('T')[0],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
