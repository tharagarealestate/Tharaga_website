import '../globals.css'

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-ui bg-white text-fg">
        {children}
      </body>
    </html>
  )
}
