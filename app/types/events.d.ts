// Custom event types for cross-component communication

interface Window {
  // Custom event for refreshing lead count in sidebar
  addEventListener(
    type: 'leadCountRefresh',
    listener: (event: CustomEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void
  dispatchEvent(event: CustomEvent<'leadCountRefresh'>): boolean
}

