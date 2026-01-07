import { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import { CookieConsentBanner } from '@/components/legal/CookieConsentBanner';

export const metadata: Metadata = {
  title: 'Legal Documents | Tharaga',
  description: 'Legal documents including Privacy Policy, Terms of Service, and Refund Policy',
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      {/* Background - similar to pricing but without animated glow */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Legal' }
        ]} />
        {children}
      </div>

      <CookieConsentBanner />
    </div>
  );
}







































































