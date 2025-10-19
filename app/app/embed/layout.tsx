import '../globals.css'

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-color-mode="light">
      {/* Important: avoid min-h-screen so the iframe can auto-size to content */}
      <body className="font-ui bg-white text-fg" style={{ background: '#ffffff' }}>
        {children}
      </body>
    </html>
  )
}
