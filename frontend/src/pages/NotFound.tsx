import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Home, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';

export function NotFound() {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | Tipz</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="min-h-screen bg-accent flex items-center justify-center px-md py-xl">
        <Card variant="elevated" padding="lg" className="max-w-2xl w-full text-center">
          <div className="space-y-lg">
            {/* 404 Number */}
            <div className="relative">
              <h1 className="text-[120px] md:text-[180px] font-bold leading-none text-primary/10">
                404
              </h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-16 h-16 md:w-24 md:h-24 text-primary/30" />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-sm">
              <h2 className="text-h2 font-bold">Page Not Found</h2>
              <p className="text-body text-primary/70 max-w-md mx-auto">
                Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-sm justify-center pt-md">
              <Link to="/">
                <Button variant="primary" size="lg">
                  <Home className="w-5 h-5 mr-2xs" />
                  Back to Home
                </Button>
              </Link>
              
              <Link to="/leaderboard">
                <Button variant="secondary" size="lg">
                  <TrendingUp className="w-5 h-5 mr-2xs" />
                  Explore Creators
                </Button>
              </Link>
            </div>

            {/* Helpful Links */}
            <div className="pt-lg border-t-2 border-primary/20">
              <p className="text-body-sm text-primary/70 mb-sm">
                Looking for something specific?
              </p>
              <div className="flex flex-wrap gap-xs justify-center">
                <Link to="/dashboard" className="text-body-sm text-primary hover:underline">
                  Dashboard
                </Link>
                <span className="text-primary/30">•</span>
                <Link to="/leaderboard" className="text-body-sm text-primary hover:underline">
                  Leaderboard
                </Link>
                <span className="text-primary/30">•</span>
                <Link to="/register" className="text-body-sm text-primary hover:underline">
                  Register
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
