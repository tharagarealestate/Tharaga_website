export default function BuilderOverviewPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
      <p className="text-gray-600">Welcome to the Builder Dashboard. Use the sidebar to navigate.</p>
      <div className="flex items-center gap-3">
        <a id="add-property-button" href="/builders/add-property" className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm">
          Add Property
        </a>
      </div>
    </div>
  )
}
