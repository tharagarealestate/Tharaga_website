/**
 * Root loading state — intentionally silent.
 * A plain ivory canvas (the site background) so route transitions never flash
 * a spinner, skeleton or a dark frame.
 */
export default function PropertyListingLoading() {
  return <div className="min-h-screen bg-[#FAF8F5]" aria-hidden />
}
