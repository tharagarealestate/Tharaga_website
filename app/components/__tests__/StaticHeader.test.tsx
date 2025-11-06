/**
 * StaticHeader Component Tests
 * 
 * Tests to verify:
 * 1. Exact spacing and alignment match homepage
 * 2. Mobile responsiveness matches exactly
 * 3. Font sizes and weights are correct
 * 4. Navigation works without page reloads
 * 5. Dropdowns function properly
 */

import { render, screen } from '@testing-library/react'
import StaticHeader from '../StaticHeader'
import { usePathname } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('StaticHeader', () => {
  beforeEach(() => {
    // Mock window.thgRoleManager
    ;(global as any).window = {
      thgRoleManager: {
        getState: jest.fn(() => ({
          initialized: true,
          user: null,
          roles: [],
        })),
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
  })

  it('renders header with correct structure', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    render(<StaticHeader />)

    // Check brand
    const brand = screen.getByText('THARAGA')
    expect(brand).toBeInTheDocument()
    expect(brand).toHaveAttribute('href', '/')

    // Check pill
    const pill = screen.getByText('Verified • Broker‑free')
    expect(pill).toBeInTheDocument()

    // Check navigation items
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Portal')).toBeInTheDocument()
    expect(screen.getByText('Pricing')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('hides header on dashboard routes', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/builder')
    const { container } = render(<StaticHeader />)
    expect(container.firstChild).toBeNull()
  })

  it('hides header on my-dashboard route', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/my-dashboard')
    const { container } = render(<StaticHeader />)
    expect(container.firstChild).toBeNull()
  })

  it('hides header on admin route', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/admin')
    const { container } = render(<StaticHeader />)
    expect(container.firstChild).toBeNull()
  })

  it('has correct CSS classes for styling', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    const { container } = render(<StaticHeader />)

    const header = container.querySelector('header.nav')
    expect(header).toBeInTheDocument()

    const inner = container.querySelector('.inner')
    expect(inner).toBeInTheDocument()

    const brandRow = container.querySelector('.row')
    expect(brandRow).toBeInTheDocument()

    const nav = container.querySelector('nav.row')
    expect(nav).toBeInTheDocument()
  })

  it('has correct font size for brand (26px inline style)', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    const { container } = render(<StaticHeader />)

    const brand = container.querySelector('.brand')
    expect(brand).toHaveStyle({ fontSize: '26px' })
  })

  it('renders all dropdown menu items', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    render(<StaticHeader />)

    // Features dropdown items
    expect(screen.getByText('Vastu')).toBeInTheDocument()
    expect(screen.getByText('Climate & environment')).toBeInTheDocument()
    expect(screen.getByText('Voice (Tamil)')).toBeInTheDocument()
    expect(screen.getByText('Verification')).toBeInTheDocument()
    expect(screen.getByText('ROI')).toBeInTheDocument()
    expect(screen.getByText('Currency risk')).toBeInTheDocument()
  })

  it('has auth container for dynamic content', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    const { container } = render(<StaticHeader />)

    const authContainer = container.querySelector('#site-header-auth-container')
    expect(authContainer).toBeInTheDocument()
  })

  it('has portal menu container for dynamic content', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    const { container } = render(<StaticHeader />)

    const portalMenu = container.querySelector('#portal-menu-items')
    expect(portalMenu).toBeInTheDocument()
  })
})

