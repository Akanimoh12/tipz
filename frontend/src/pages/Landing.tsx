import { Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { HeroSection } from '@/components/organisms/HeroSection';
import { LiveTickerSection } from '@/components/organisms/LiveTickerSection';
import { Skeleton } from '@/components/atoms/Skeleton';

const HowItWorksSection = lazy(() => import('@/components/organisms/HowItWorksSection').then(m => ({ default: m.HowItWorksSection })));
const TopCreatorsSection = lazy(() => import('@/components/organisms/TopCreatorsSection').then(m => ({ default: m.TopCreatorsSection })));
const FeaturesSection = lazy(() => import('@/components/organisms/FeaturesSection').then(m => ({ default: m.FeaturesSection })));
const RoadmapSection = lazy(() => import('@/components/organisms/RoadmapSection').then(m => ({ default: m.RoadmapSection })));
const CTABanner = lazy(() => import('@/components/organisms/CTABanner').then(m => ({ default: m.CTABanner })));

function SectionSkeleton() {
  return (
    <div className="py-2xl">
      <div className="container mx-auto px-md">
        <Skeleton variant="rectangular" height="400px" />
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <>
      <Helmet>
        <title>Tipz - Decentralized Tipping for Creators on Somnia</title>
        <meta
          name="description"
          content="Support your favorite creators with instant tips on Somnia blockchain. Fast, transparent, and creator-friendly. 98% goes to creators, 2% platform fee."
        />
        <meta name="keywords" content="tipping, crypto, blockchain, creators, Somnia, web3, decentralized" />
        <meta property="og:title" content="Tipz - Decentralized Tipping for Creators" />
        <meta
          property="og:description"
          content="Support your favorite creators with instant tips on Somnia blockchain. Fast, transparent, and creator-friendly."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tipz.app" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tipz - Decentralized Tipping for Creators" />
        <meta
          name="twitter:description"
          content="Support your favorite creators with instant tips on Somnia blockchain."
        />
        <link rel="canonical" href="https://tipz.app" />
      </Helmet>

      <main className="min-h-screen">
        <HeroSection />

        <LiveTickerSection />

        <Suspense fallback={<SectionSkeleton />}>
          <HowItWorksSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <TopCreatorsSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <FeaturesSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <RoadmapSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <CTABanner />
        </Suspense>
      </main>
    </>
  );
}
