import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages = [], userRole = 'TRANSPORTER' } = body;

    const lastMessage = messages[messages.length - 1]?.content || '';

    // Quick role-appropriate Indic AI response
    let responseText = '';

    if (/किराया|कमाई|पैसा|पेमेंट|निकासी|earning/i.test(lastMessage)) {
      responseText =
        'कृषिसेतु नियम R-003 के तहत आपकी पूरी डिलीवरी फीस (100%) सीधे आपके खाते में क्रेडिट होती है। डिलीवरी पूर्ण होने पर व्यापारी से OTP लें और तत्काल UPI निकासी करें।';
    } else if (/मंडी|रूट|नेविगेशन|रास्ता|ट्रैफिक/i.test(lastMessage)) {
      responseText =
        'FreshRoute नेविगेशन लखनऊ-अयोध्या NH-27 पर सुचारू है। आपकी फसल की गुणवत्ता बनाए रखने हेतु समय पर मंडी गेट पहुंचना सुनिश्चित करें।';
    } else if (/फसल|सब्जी|टमाटर|आलू|लोड/i.test(lastMessage)) {
      responseText =
        'वाहन में कृषि उपज की सुरक्षा हेतु क्रेट्स को अच्छी तरह बांधें और ताजी उपज को धूप व नमी से सुरक्षित रखें।';
    } else {
      responseText = `नमस्ते! मैं आपका कृषिसेतु AI सहायक हूँ। आपकी सक्रिय भूमिका ${userRole} है। आप ट्रिप स्थिति, मंडी नेविगेशन, या आय से संबंधित कोई भी प्रश्न पूछ सकते हैं।`;
    }

    return NextResponse.json({
      success: true,
      text: responseText,
      reply: responseText,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: true,
        text: 'कृषिसेतु AI सहायक उपलब्ध है। कृपया अपना प्रश्न दोबारा पूछें।',
        reply: 'कृषिसेतु AI सहायक उपलब्ध है। कृपया अपना प्रश्न दोबारा पूछें।',
      },
      { status: 200 }
    );
  }
}
