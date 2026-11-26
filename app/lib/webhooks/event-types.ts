export const WEBHOOK_EVENTS = {
  // Lead events
  'lead.created': 'Triggered when a new lead is created',
  'lead.updated': 'Triggered when a lead is updated',
  'lead.status_changed': 'Triggered when lead status changes',
  'lead.assigned': 'Triggered when lead is assigned to team member',

  // Site visit events
  'site_visit.scheduled': 'Triggered when a site visit is scheduled',
  'site_visit.confirmed': 'Triggered when a site visit is confirmed',
  'site_visit.completed': 'Triggered when a site visit is completed',
  'site_visit.cancelled': 'Triggered when a site visit is cancelled',

  // Property events
  'property.created': 'Triggered when a new property is created',
  'property.published': 'Triggered when a property is published',
  'property.updated': 'Triggered when a property is updated',

  // Message events
  'message.received': 'Triggered when a new message is received',

  // Subscription events
  'subscription.created': 'Triggered when a new subscription is created',
  'subscription.renewed': 'Triggered when a subscription is renewed',
  'subscription.cancelled': 'Triggered when a subscription is cancelled',
} as const;

export type WebhookEventType = keyof typeof WEBHOOK_EVENTS;











