import '../globals.css'

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-color-mode="light">
      <body className="font-ui bg-white min-h-screen text-fg" style={{ background: '#ffffff' }}>
        {children}
      </body>
    </html>
  )
}
