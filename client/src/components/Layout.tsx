import { ReactNode } from 'react'
import LeftNavigation from './LeftNavigation'

interface LayoutProps {
  children: ReactNode
  showNavigation?: boolean
}

export default function Layout({ children, showNavigation = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {showNavigation && <LeftNavigation />}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}

