export default function UnauthorizedPage(){
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      {/* Animated Background Elements - EXACT from pricing page */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-xl px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-white">Access restricted</h1>
          <p className="mt-2 text-gray-300">Your account does not have admin permissions for this area.</p>
          <div className="mt-6 flex items-center justify-center gap-6">
            <a href="/" className="inline-block text-gold-400 hover:text-gold-300">Go Home</a>
            <a href="/login?next=/admin" className="inline-block text-gold-400 hover:text-gold-300">Sign in with admin</a>
          </div>
        </main>
      </div>
    </div>
  )
}
