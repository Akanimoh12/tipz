import { Link } from 'react-router-dom';
import { Zap, Twitter, Github, MessageCircle } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API', href: '/api' },
    { label: 'Support', href: '/support' },
    { label: 'Blog', href: '/blog' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
  social: [
    { label: 'Twitter', href: 'https://twitter.com/tipz', icon: Twitter },
    { label: 'GitHub', href: 'https://github.com/tipz', icon: Github },
    { label: 'Discord', href: 'https://discord.gg/tipz', icon: MessageCircle },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary border-t-3 border-primary">
      <div className="container mx-auto px-md py-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-lg lg:gap-xl">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-xs mb-sm group">
              <div className="w-10 h-10 bg-primary border-3 border-primary rounded-brutalist flex items-center justify-center group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-transform">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <span className="text-h3 font-bold">Tipz</span>
            </Link>
            
            <p className="text-body text-primary/70 mb-md max-w-sm">
              Decentralized tipping platform on Somnia Network. Support creators instantly with blockchain transparency.
            </p>

            <div className="flex gap-sm">
              {footerLinks.social.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border-3 border-primary rounded-brutalist flex items-center justify-center hover:bg-primary hover:text-secondary transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
                  aria-label={link.label}
                >
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-body font-bold mb-sm uppercase tracking-wide">
              Product
            </h3>
            <ul className="space-y-xs">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-body text-primary/70 hover:text-primary transition-colors inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-body font-bold mb-sm uppercase tracking-wide">
              Resources
            </h3>
            <ul className="space-y-xs">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-body text-primary/70 hover:text-primary transition-colors inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-body font-bold mb-sm uppercase tracking-wide">
              Legal
            </h3>
            <ul className="space-y-xs">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-body text-primary/70 hover:text-primary transition-colors inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-xl pt-md border-t-3 border-primary">
          <div className="flex flex-col md:flex-row justify-between items-center gap-sm">
            <p className="text-body-sm text-primary/70">
              © {currentYear} Tipz. Built on Somnia Network.
            </p>
            
            <p className="text-body-sm text-primary/70">
              Made with ❤️ for creators
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
