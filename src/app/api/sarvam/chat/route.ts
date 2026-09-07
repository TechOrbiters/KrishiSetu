import { NextRequest, NextResponse } from 'next/server';
import { generateChatCompletion, ChatMessage } from '@/lib/sarvam/chat';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages = [], userRole = 'FARMER' } = body;

    const lastMessage = messages[messages.length - 1]?.content || '';
    if (!lastMessage && messages.length === 0) {
      return NextResponse.json({
        success: true,
        text: 'नमस्ते! मैं आपका कृषिसेतु AI सहायक हूँ। आप मुझसे मंडी भाव, फसल सलाह, या परिवहन से संबंधित प्रश्न पूछ सकते हैं।',
        reply: 'नमस्ते! मैं आपका कृषिसेतु AI सहायक हूँ। आप मुझसे मंडी भाव, फसल सलाह, या परिवहन से संबंधित प्रश्न पूछ सकते हैं।',
      });
    }

    const systemPrompt: ChatMessage = {
      role: 'system',
      content:
        `Aap KrishiSetu ke visheshagya Krishi AI Sahayak (Agricultural AI Assistant) hain. ` +
        `User ki bhumika: ${userRole}. ` +
        `Kisan, Vyapari aur Transporter ke fasal utpadan, mandi bhav, demand, transport, ` +
        `aur munafa se jude sawalon ka spasht, saral aur labhkari uttar dein. Bhasha Hindi/Hinglish ya user ki bhasha me honi chahiye.`,
    };

    const formattedMessages: ChatMessage[] = [
      systemPrompt,
      ...messages.slice(-8).map((m: any) => ({
        role: m.role === 'assistant' || m.sender === 'ai' ? ('assistant' as const) : ('user' as const),
        content: String(m.content || m.text || ''),
      })),
    ];

    try {
      const reply = await generateChatCompletion(formattedMessages, {
        maxTokens: 400,
        temperature: 0.7,
      });

      if (reply) {
        return NextResponse.json({
          success: true,
          text: reply,
          reply,
          source: 'sarvam-105b-conversations',
        });
      }
    } catch (llmErr: any) {
      console.warn('[Sarvam Chat API] Live LLM error, using smart rule fallback:', llmErr?.message || llmErr);
    }

    // Role-appropriate fallback if LLM is unreachable
    let fallbackText = '';
    if (/किराया|कमाई|पैसा|पेमेंट|निकासी|earning/i.test(lastMessage)) {
      fallbackText =
        'कृषिसेतु नियम R-003 के तहत आपकी पूरी डिलीवरी फीस (100%) सीधे आपके खाते में क्रेडिट होती है। डिलीवरी पूर्ण होने पर व्यापारी से OTP लें और तत्काल UPI निकासी करें।';
    } else if (/मंडी|रूट|नेविगेशन|रास्ता|ट्रैफिक/i.test(lastMessage)) {
      fallbackText =
        'FreshRoute नेविगेशन लखनऊ-अयोध्या NH-27 पर सुचारू है। आपकी फसल की गुणवत्ता बनाए रखने हेतु समय पर मंडी गेट पहुंचना सुनिश्चित करें।';
    } else if (/फसल|सब्जी|टमाटर|आलू|लोड/i.test(lastMessage)) {
      fallbackText =
        'वाहन में कृषि उपज की सुरक्षा हेतु क्रेट्स को अच्छी तरह बांधें और ताजी उपज को धूप व नमी से सुरक्षित रखें।';
    } else {
      fallbackText = `नमस्ते! मैं आपका कृषिसेतु AI सहायक हूँ। आपकी सक्रिय भूमिका ${userRole} है। आप ट्रिप स्थिति, मंडी नेविगेशन, या आय से संबंधित कोई भी प्रश्न पूछ सकते हैं।`;
    }

    return NextResponse.json({
      success: true,
      text: fallbackText,
      reply: fallbackText,
      source: 'fallback',
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
