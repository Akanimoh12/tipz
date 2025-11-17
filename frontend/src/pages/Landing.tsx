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
        <title>Tipz - Turn Your X Influence Into On-Chain Reputation</title>
        <meta
          name="description"
          content="Tokenize your X (Twitter) social presence and unlock Web3 opportunities. Instant peer-to-peer tipping powered by Somnia's real-time blockchain. 98% to creators, 2% platform fee."
        />
        <meta name="keywords" content="X tokenization, on-chain reputation, crypto tipping, blockchain creators, Somnia Network, web3, credit score, Twitter influence" />
        <meta property="og:title" content="Tipz - Turn Your X Influence Into On-Chain Reputation" />
        <meta
          property="og:description"
          content="Tokenize your X social presence into verifiable on-chain reputation. Support creators instantly on Somnia blockchain."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tipz.app" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tipz - Turn Your X Influence Into On-Chain Reputation" />
        <meta
          name="twitter:description"
          content="Tokenize your X influence into on-chain reputation. Instant tipping powered by Somnia Network."
        />
        <link rel="canonical" href="https://tipz.app" />
      </Helmet>

      <main className="min-h-screen">
        <HeroSection />

        <div className="py-3xl">
          <LiveTickerSection />
        </div>

        <div className="py-3xl">
          <Suspense fallback={<SectionSkeleton />}>
            <HowItWorksSection />
          </Suspense>
        </div>

        <div className="py-3xl">
          <Suspense fallback={<SectionSkeleton />}>
            <TopCreatorsSection />
          </Suspense>
        </div>

        <div className="py-3xl">
          <Suspense fallback={<SectionSkeleton />}>
            <FeaturesSection />
          </Suspense>
        </div>

        <div className="py-3xl">
          <Suspense fallback={<SectionSkeleton />}>
            <RoadmapSection />
          </Suspense>
        </div>

        <div className="py-3xl">
          <Suspense fallback={<SectionSkeleton />}>
            <CTABanner />
          </Suspense>
        </div>
      </main>
    </>
  );
}
