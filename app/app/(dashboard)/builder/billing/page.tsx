'use client';

import { motion } from 'framer-motion';
import { BuilderPageWrapper } from '../_components/BuilderPageWrapper';
import BillingManagement from './_components/BillingManagement';

export default function BillingPage() {
  return (
    <BuilderPageWrapper
      title="Billing & Subscription"
      description="Manage your subscription, view invoices, and track usage"
      emoji="💳"
    >
      <BillingManagement />
    </BuilderPageWrapper>
  );
}


