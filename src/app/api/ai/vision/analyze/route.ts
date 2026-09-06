import { NextRequest, NextResponse } from 'next/server';
import { analyzeProduceImage } from '@/lib/google/vision';
import { supabaseAdmin } from '@/lib/supabase/server';
import { VisionAnalysisOutputSchema } from '@/lib/domain/aiSchemas';

export async function POST(req: NextRequest) {
  try {
    let imageSource = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No image file provided.' },
          { status: 400 }
        );
      }

      // Check max size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'File size exceeds 10MB limit.' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      imageSource = `data:${file.type};base64,${buffer.toString('base64')}`;

      // Persist to Supabase Storage if available
      try {
        if (supabaseAdmin) {
          const filename = `vision-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
          await supabaseAdmin.storage
            .from('produce-photos')
            .upload(filename, buffer, { contentType: file.type, upsert: true });
        }
      } catch (storageErr: any) {
        console.warn('[Vision] Storage upload notice:', storageErr.message);
      }
    } else {
      const body = await req.json().catch(() => ({}));
      imageSource = body.imageUrl || body.imageBase64 || '';
    }

    if (!imageSource) {
      return NextResponse.json(
        { success: false, error: 'Image base64 or URL is required.' },
        { status: 400 }
      );
    }

    const result = await analyzeProduceImage(imageSource);
    const validResult = VisionAnalysisOutputSchema.parse(result);

    return NextResponse.json({
      success: true,
      data: validResult,
    });
  } catch (err: any) {
    console.error('[Vision API Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to process vision analysis request.' },
      { status: 500 }
    );
  }
}
