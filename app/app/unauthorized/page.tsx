export default function UnauthorizedPage(){
  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Access restricted</h1>
      <p className="mt-2 text-gray-600">Your account does not have admin permissions for this area.</p>
      <div className="mt-6 flex items-center justify-center gap-6">
        <a href="/" className="inline-block text-primary-600 hover:text-primary-700">Go Home</a>
        <a href="/login?next=/admin" className="inline-block text-primary-600 hover:text-primary-700">Sign in with admin</a>
      </div>
    </main>
  )
}
