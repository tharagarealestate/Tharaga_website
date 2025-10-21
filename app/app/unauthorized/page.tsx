export default function UnauthorizedPage(){
  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Unauthorized</h1>
      <p className="mt-2 text-gray-600">You do not have access to this page.</p>
      <a href="/" className="mt-6 inline-block text-primary-600 hover:text-primary-700">Go Home</a>
    </main>
  )
}
