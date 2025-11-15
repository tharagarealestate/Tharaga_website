import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// GET: View RERA snapshot HTML
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snapshotId = params.id
    if (!snapshotId) {
      return NextResponse.json({ error: 'Snapshot ID required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: snapshot, error } = await supabase
      .from('rera_snapshots')
      .select('*')
      .eq('id', snapshotId)
      .single()

    if (error || !snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
    }

    // Return HTML snapshot in a readable format
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RERA Snapshot - ${snapshot.rera_id}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .snapshot-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 4px;
        }
        .metadata-item {
            display: flex;
            flex-direction: column;
        }
        .metadata-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
        }
        .metadata-value {
            font-weight: 600;
            color: #333;
        }
        .disclaimer {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
            font-size: 12px;
            color: #856404;
        }
        iframe {
            width: 100%;
            height: 600px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>RERA Verification Snapshot</h1>
        <div class="metadata">
            <div class="metadata-item">
                <span class="metadata-label">RERA ID</span>
                <span class="metadata-value">${snapshot.rera_id}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">State</span>
                <span class="metadata-value">${snapshot.state}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Project Name</span>
                <span class="metadata-value">${snapshot.project_name || 'N/A'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Developer</span>
                <span class="metadata-value">${snapshot.developer_name || 'N/A'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Status</span>
                <span class="metadata-value">${snapshot.status || 'N/A'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Collected At</span>
                <span class="metadata-value">${new Date(snapshot.collected_at).toLocaleString()}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Data Source</span>
                <span class="metadata-value">${snapshot.data_source}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Snapshot Hash</span>
                <span class="metadata-value" style="font-family: monospace; font-size: 11px;">${snapshot.snapshot_hash.substring(0, 32)}...</span>
            </div>
        </div>
    </div>
    
    <div class="snapshot-content">
        <h2>Raw HTML Snapshot</h2>
        <iframe srcdoc="${snapshot.raw_html.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}"></iframe>
    </div>
    
    <div class="disclaimer">
        <strong>Legal Disclaimer:</strong> The information and verification artifacts provided on this page are automated snapshots of public records and uploaded documents as of the timestamp shown. These artifacts are intended for informational purposes only and do not constitute legal advice, title insurance, or a guarantee of property ownership or transferability. For formal legal confirmation and title transfer, consult a licensed property lawyer or the appropriate government registry.
    </div>
</body>
</html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error: any) {
    console.error('RERA snapshot error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}


