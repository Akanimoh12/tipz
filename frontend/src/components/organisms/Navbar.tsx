import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Zap } from 'lucide-react';
import { WalletButton } from '@/components/molecules/WalletButton';

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Profile', href: '/profile' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-secondary border-b-3 border-primary">
      <div className="container mx-auto px-md py-sm">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-xs group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 bg-primary border-3 border-primary rounded-brutalist flex items-center justify-center group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-transform">
              <Zap className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-h3 font-bold">Tipz</span>
          </Link>

          <div className="hidden md:flex items-center gap-lg">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-body font-medium hover:text-primary/70 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-2xs left-0 w-0 h-[3px] bg-primary group-hover:w-full transition-all duration-200" />
              </Link>
            ))}
          </div>

          <div className="hidden md:block">
            <WalletButton showBalance showNetwork />
          </div>

          <button
            type="button"
            className="md:hidden p-xs border-3 border-primary rounded-brutalist hover:bg-accent transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pt-md mt-md border-t-3 border-primary space-y-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block py-xs text-body font-medium hover:text-primary/70 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="pt-sm">
              <WalletButton showBalance showNetwork className="w-full" />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
