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
    <section className="relative py-3xl md:py-4xl overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2xl items-center">
          {/* LEFT COLUMN - Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-xl"
          >
            <motion.div variants={itemVariants} className="space-y-lg">
              <motion.h1
                className="text-h1 md:text-display font-bold leading-tight"
                variants={itemVariants}
              >
                Turn Your X Influence Into{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">On-Chain Reputation</span>
                  <motion.span
                    className="absolute bottom-0 left-0 w-full h-4 bg-brand/30 -z-10"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </span>
              </motion.h1>
              
              <motion.p
                variants={itemVariants}
                className="text-h4 md:text-h3 text-primary/70"
              >
                Tokenize your X (Twitter) social presence and receive instant support from your community. Built on Somnia's real-time blockchain.
              </motion.p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-sm"
            >
              <Link to={getCtaDestination()}>
                <Button size="lg" variant="brand" className="font-bold w-full sm:w-auto">
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
                <Button size="lg" variant="primary" className="font-bold w-full sm:w-auto">
                  <Zap className="w-5 h-5 mr-2xs" />
                  View Platform Stats
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-md p-sm bg-accent border-3 border-primary rounded-brutalist"
            >
              <div className="flex items-center gap-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-body-sm font-medium">Live on Somnia Network</span>
              </div>
              <span className="text-body-sm text-primary/70">|</span>
              <span className="text-body-sm text-primary/70">2% platform fee</span>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN - Animated Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative h-[500px] lg:h-[600px] hidden lg:block"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Card Stack with Rotation Effect */}
              {features.map((feature, index) => {
                const rotation = (index - 1) * 8; // -8deg, 0deg, 8deg
                const zIndex = features.length - index;
                const yOffset = index * 20;

                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 50, rotateZ: 0 }}
                    animate={{ 
                      opacity: 1, 
                      y: yOffset, 
                      rotateZ: rotation,
                    }}
                    transition={{
                      duration: 0.6,
                      delay: 0.4 + index * 0.15,
                      type: "spring",
                      stiffness: 100,
                    }}
                    whileHover={{
                      rotateZ: 0,
                      y: yOffset - 10,
                      scale: 1.05,
                      zIndex: 999,
                      transition: { duration: 0.3 }
                    }}
                    className="absolute w-[320px]"
                    style={{ zIndex }}
                  >
                    <Card
                      variant="elevated"
                      padding="lg"
                      className="backdrop-blur-sm bg-secondary/95 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                    >
                      <div className="flex flex-col items-center text-center space-y-md">
                        <motion.div 
                          className="w-20 h-20 bg-brand border-3 border-primary rounded-brutalist flex items-center justify-center"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <feature.icon className="w-10 h-10 text-primary" />
                        </motion.div>
                        
                        <h3 className="text-h3 font-bold">{feature.title}</h3>
                        
                        <p className="text-body text-primary/70">
                          {feature.description}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* MOBILE - Cards Below Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-md lg:hidden"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card
                  variant="elevated"
                  padding="md"
                  className="hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-200"
                >
                  <div className="flex items-start gap-md">
                    <div className="w-14 h-14 bg-brand border-3 border-primary rounded-brutalist flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-h4 font-bold mb-xs">{feature.title}</h3>
                      <p className="text-body text-primary/70">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
