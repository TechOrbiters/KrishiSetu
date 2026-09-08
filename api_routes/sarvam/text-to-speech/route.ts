import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/sarvam/tts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text, speaker = 'aditya', target_language_code = 'hi-IN' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      );
    }

    // Attempt to synthesize speech using Sarvam Bulbul
    const result = await generateSpeech({
      text,
      targetLanguageCode: target_language_code,
      speaker: speaker as any,
    });

    return NextResponse.json({
      success: true,
      audioBase64: result.audioBase64,
      format: result.format,
      fallbackUsed: result.fallbackUsed,
      notes: result.notes,
    });
  } catch (err: any) {
    console.warn('Sarvam TTS API route fallback:', err?.message || err);
    // Return 200 with fallback flag so client browser speech synthesis takes over smoothly
    return NextResponse.json({
      success: true,
      audioBase64: null,
      format: 'audio/wav',
      fallbackUsed: true,
      notes: 'Browser SpeechSynthesis fallback enabled',
    });
  }
}
