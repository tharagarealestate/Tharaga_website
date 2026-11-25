import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { ALLOWED_TYPES, LISTING_BUCKET, MAX_FILES, MAX_FILE_BYTES, safeFileName, serviceClient } from '@/lib/server/listings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Hands the browser one-time signed upload URLs so photos and videos go straight to
 * private storage (no size limits from the web server, nothing public).
 */
export async function POST(req: Request) {
  try {
    const { files } = (await req.json()) as { files?: { name: string; type: string; size: number }[] }
    if (!Array.isArray(files) || !files.length) return NextResponse.json({ error: 'No files' }, { status: 400 })
    if (files.length > MAX_FILES) return NextResponse.json({ error: `Up to ${MAX_FILES} files per listing.` }, { status: 400 })
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) return NextResponse.json({ error: `${f.name}: photos, videos or PDFs only.` }, { status: 400 })
      if (!(f.size > 0) || f.size > MAX_FILE_BYTES) return NextResponse.json({ error: `${f.name} is larger than 100 MB.` }, { status: 400 })
    }
    const folder = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}`
    const storage = serviceClient().storage.from(LISTING_BUCKET)
    const uploads = await Promise.all(
      files.map(async (f, i) => {
        const path = `${folder}/${String(i + 1).padStart(2, '0')}-${safeFileName(f.name)}`
        const { data, error } = await storage.createSignedUploadUrl(path)
        if (error || !data) throw new Error(error?.message || 'Could not prepare upload')
        return { path, token: data.token, signedUrl: data.signedUrl }
      }),
    )
    return NextResponse.json({ folder, uploads })
  } catch (e: any) {
    console.error('listing upload-url error', e?.message)
    return NextResponse.json({ error: 'Uploads are unavailable right now. You can still submit and send photos on WhatsApp.' }, { status: 500 })
  }
}
