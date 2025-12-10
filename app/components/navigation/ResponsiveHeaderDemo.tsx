'use client'

import ResponsiveHeader from './ResponsiveHeader'
import { useState } from 'react'

/**
 * Demo page showcasing the ResponsiveHeader component
 *
 * This demonstrates:
 * - Basic navigation items
 * - Nested submenu items
 * - User icon interaction
 * - Custom logo options
 * - Mobile responsiveness
 */
export default function ResponsiveHeaderDemo() {
  const [userMessage, setUserMessage] = useState<string>('')

  // Example navigation structure
  const navItems = [
    { label: 'Home', href: '/' },
    {
      label: 'Properties',
      href: '/properties',
      subItems: [
        { label: 'For Sale', href: '/properties/sale' },
        { label: 'For Rent', href: '/properties/rent' },
        { label: 'Commercial', href: '/properties/commercial' }
      ]
    },
    {
      label: 'Services',
      href: '/services',
      subItems: [
        { label: 'Property Management', href: '/services/management' },
        { label: 'Consultation', href: '/services/consultation' },
        { label: 'Valuation', href: '/services/valuation' }
      ]
    },
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ]

  const handleUserIconClick = () => {
    setUserMessage('User icon clicked! Opening user profile...')
    setTimeout(() => setUserMessage(''), 3000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Demo Header */}
      <ResponsiveHeader
        logoText="Tharaga"
        logoHref="/"
        navItems={navItems}
        onUserIconClick={handleUserIconClick}
        showUserIcon={true}
      />

      {/* Demo Content */}
      <main className="container mx-auto px-4 py-12">
        {/* User Message */}
        {userMessage && (
          <div className="mb-8 p-4 bg-blue-100 border border-blue-300 rounded-lg text-blue-800 text-center animate-pulse">
            {userMessage}
          </div>
        )}

        {/* Hero Section */}
        <section className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            ResponsiveHeader Demo
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            This page demonstrates the fully responsive navigation header with mobile-first design,
            advanced animations, and accessibility features.
          </p>
        </section>

        {/* Features Grid */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </section>

        {/* Instructions */}
        <section className="mb-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Test Instructions</h2>
          <div className="space-y-4 text-slate-700">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </span>
              <div>
                <h3 className="font-semibold mb-1">Resize Your Browser</h3>
                <p>Shrink your browser window below 768px to see mobile layout activate</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </span>
              <div>
                <h3 className="font-semibold mb-1">Click the Hamburger Menu</h3>
                <p>On mobile, tap the gold hamburger icon (≡) in the top-right corner</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </span>
              <div>
                <h3 className="font-semibold mb-1">Test Interactions</h3>
                <p>Try expanding submenus, clicking items, and closing the menu via backdrop or X button</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">
                4
              </span>
              <div>
                <h3 className="font-semibold mb-1">Click User Icon</h3>
                <p>Test the user account icon to see the callback in action</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">
                5
              </span>
              <div>
                <h3 className="font-semibold mb-1">Test Accessibility</h3>
                <p>Use Tab key to navigate, Enter to activate, and test with a screen reader</p>
              </div>
            </div>
          </div>
        </section>

        {/* Specifications */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Design Specifications</h2>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold mb-3 text-amber-500">Layout</h3>
                <ul className="space-y-2 text-slate-200">
                  <li>• Left section: 20% width (Logo)</li>
                  <li>• Right section: 40% width (Utilities)</li>
                  <li>• Breakpoint: 768px</li>
                  <li>• Full-screen mobile menu</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-amber-500">Typography</h3>
                <ul className="space-y-2 text-slate-200">
                  <li>• Logo: 24-28px, bold</li>
                  <li>• Nav items: 14-16px, regular</li>
                  <li>• WCAG AA compliant contrast</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-amber-500">Animations</h3>
                <ul className="space-y-2 text-slate-200">
                  <li>• Slide-in: 300-400ms ease-out</li>
                  <li>• Backdrop: 300ms fade</li>
                  <li>• Item stagger: 50ms delay</li>
                  <li>• Icon rotation: 200ms</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-amber-500">Accessibility</h3>
                <ul className="space-y-2 text-slate-200">
                  <li>• 44x44px touch targets</li>
                  <li>• ARIA labels & roles</li>
                  <li>• Keyboard navigation</li>
                  <li>• Focus indicators</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Code Example */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Usage Example</h2>
          <div className="bg-slate-900 rounded-xl shadow-lg p-6 overflow-x-auto">
            <pre className="text-sm text-slate-200">
              <code>{`import ResponsiveHeader from '@/components/navigation/ResponsiveHeader'

const navItems = [
  { label: 'Home', href: '/' },
  {
    label: 'Products',
    href: '/products',
    subItems: [
      { label: 'Category A', href: '/products/a' },
      { label: 'Category B', href: '/products/b' }
    ]
  },
  { label: 'About', href: '/about' }
]

export default function MyPage() {
  return (
    <ResponsiveHeader
      logoText="MyBrand"
      logoHref="/"
      navItems={navItems}
      onUserIconClick={() => console.log('User clicked')}
      showUserIcon={true}
    />
  )
}`}</code>
            </pre>
          </div>
        </section>

        {/* Dummy Content for Scrolling */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-slate-900">Scroll Test</h2>
          <p className="text-slate-600">
            Scroll down to test the sticky header behavior. The header should remain fixed at the top
            as you scroll through the page content.
          </p>

          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Section {i + 1}
              </h3>
              <p className="text-slate-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 ResponsiveHeader Demo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

// Feature Card Component
interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  )
}

// Feature Data
const features = [
  {
    icon: '📱',
    title: 'Mobile-First Design',
    description: 'Fully responsive with breakpoint at 768px. Hamburger menu activates on mobile devices.'
  },
  {
    icon: '✨',
    title: 'Smooth Animations',
    description: 'Slide-in menu from right, backdrop fade, and staggered item animations using Framer Motion.'
  },
  {
    icon: '♿',
    title: 'WCAG AA Compliant',
    description: 'Full accessibility support with ARIA labels, keyboard navigation, and focus indicators.'
  },
  {
    icon: '🎨',
    title: 'Customizable',
    description: 'Flexible props for logo, navigation items, colors, and user interaction callbacks.'
  },
  {
    icon: '🚀',
    title: 'Performance',
    description: 'Optimized animations, lazy loading, and efficient re-renders for smooth experience.'
  },
  {
    icon: '🔧',
    title: 'Easy Integration',
    description: 'Simple prop-based API. Drop it into any Next.js project with minimal setup.'
  }
]
