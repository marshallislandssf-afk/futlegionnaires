'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Globe, Users, Telescope, UserPlus } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',       label: 'World Map',      Icon: Globe },
  { href: '/players', label: 'Players',       Icon: Users },
  { href: '/scout',   label: 'Scout View',    Icon: Telescope },
  { href: '/submit',  label: 'Submit Profile', Icon: UserPlus },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-auto">
          <span className="text-lg font-semibold tracking-tight">
            Fut<span className="text-[#1D9E75]">Legionnaires</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors
                  ${active
                    ? 'bg-[#1D9E75]/15 text-[#1D9E75]'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }
                `}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
