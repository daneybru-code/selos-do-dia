import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SELOS_BUCKET } from '@/lib/storage/selos';
import { ImageData } from '@/types';

export const dynamic = 'force-dynamic';

interface SeloRow {
  filename: string;
  name: string;
  storage_path: string;
  uploaded_at: string;
}

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('selos')
    .select('filename, name, storage_path, uploaded_at')
    .order('position', { ascending: true, nullsFirst: false })
    .order('uploaded_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const images: ImageData[] = (data as SeloRow[]).map((row) => {
    const { data: publicUrl } = supabase.storage.from(SELOS_BUCKET).getPublicUrl(row.storage_path);
    return {
      filename: row.filename,
      name: row.name,
      src: publicUrl.publicUrl,
      uploadedAt: row.uploaded_at,
    };
  });

  return NextResponse.json({ images });
}
