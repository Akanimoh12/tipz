import { motion } from 'framer-motion';
import { ArrowRight, Zap, TrendingUp, Shield } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { useIsRegistered } from '@/hooks/useProfile';

const features = [
  {
    icon: Zap,
    title: 'Instant Tips',
    description: 'Real-time support in 2-3 seconds via Somnia Streams',
  },
  {
    icon: TrendingUp,
    title: 'On-Chain Credit Score',
    description: 'Your X influence tokenized as verifiable reputation',
  },
  {
    icon: Shield,
    title: '100% Transparent',
    description: 'All transactions and reputation on-chain forever',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export function HeroSection() {
  const { isConnected, address } = useAccount();
  const { isRegistered } = useIsRegistered(address);

  // Determine CTA destination - Don't force registration, allow exploration
  const getCtaDestination = () => {
    if (isConnected && isRegistered) return '/dashboard';
    return '/leaderboard'; // Let everyone explore creators first
  };

  const getCtaText = () => {
    if (isConnected && isRegistered) return 'Go to Dashboard';
    return 'Explore Creators'; // More inviting, less pushy
  };

  return (
    <section className="relative py-2xl md:py-3xl overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-md">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-xl">
            <motion.h1
              className="text-h1 md:text-display font-bold mb-md"
              variants={itemVariants}
            >
              Turn Your X Influence Into{' '}
              <span className="relative inline-block">
                <span className="relative z-10">On-Chain Reputation</span>
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-4 bg-primary/20 -z-10"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </span>
            </motion.h1>
            
            <motion.p
              variants={itemVariants}
              className="text-h4 md:text-h3 text-primary/70 mb-lg max-w-2xl mx-auto"
            >
              Tokenize your X (Twitter) social presence and receive instant support from your community. Built on Somnia's real-time blockchain.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-sm justify-center"
            >
              <Link to={getCtaDestination()}>
                <Button size="lg" variant="brand" className="font-bold">
                  {isConnected && isRegistered ? (
                    <>
                      <Zap className="w-5 h-5 mr-2xs" />
                      {getCtaText()}
                      <ArrowRight className="w-5 h-5 ml-2xs" />
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5 mr-2xs" />
                      {getCtaText()}
                      <ArrowRight className="w-5 h-5 ml-2xs" />
                    </>
                  )}
                </Button>
              </Link>
              
              <Link to="/dashboard">
                <Button size="lg" variant="primary" className="font-bold">
                  <Zap className="w-5 h-5 mr-2xs" />
                  View Platform Stats
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-md md:gap-lg"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card
                  variant="elevated"
                  padding="md"
                  className="h-full hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-200"
                >
                  <div className="flex flex-col items-center text-center space-y-sm">
                    <div className="w-16 h-16 bg-primary border-3 border-primary rounded-brutalist flex items-center justify-center">
                      <feature.icon className="w-8 h-8 text-secondary" />
                    </div>
                    
                    <h3 className="text-h4 font-bold">{feature.title}</h3>
                    
                    <p className="text-body text-primary/70">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-xl text-center"
          >
            <div className="inline-flex items-center gap-md p-sm bg-accent border-3 border-primary rounded-brutalist">
              <div className="flex items-center gap-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-body-sm font-medium">Live on Somnia Network</span>
              </div>
              <span className="text-body-sm text-primary/70">|</span>
              <span className="text-body-sm text-primary/70">2% platform fee</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
