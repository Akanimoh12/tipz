import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/molecules/Card';
import { Shield, Zap, TrendingUp, Users, Lock, Globe } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Real-Time Everything',
    description: 'Tips arrive in 2-3 seconds via Somnia Streams. Live leaderboards. Instant notifications. Feels like social media, but it\'s blockchain.',
  },
  {
    icon: TrendingUp,
    title: 'Tokenized Influence',
    description: 'Your X followers, engagement, and account age become on-chain credit score (0-1000). Verifiable reputation across Web3.',
  },
  {
    icon: Shield,
    title: '100% Transparent',
    description: 'Every tip, every transaction, every score calculation is on-chain. No hidden algorithms. View complete history anytime.',
  },
  {
    icon: Users,
    title: 'Supporter Reputation',
    description: 'Active tippers earn credit scores too. Build on-chain reputation by supporting creators you love. Everyone wins.',
  },
  {
    icon: Lock,
    title: 'Non-Custodial',
    description: 'Your keys, your funds. We never hold your crypto. Smart contracts handle everything. No middlemen, ever.',
  },
  {
    icon: Globe,
    title: 'Borderless Support',
    description: 'Support anyone, anywhere, instantly. No bank accounts, no payment processors. Just wallet-to-wallet value transfer.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function FeaturesSection() {
  return (
    <section className="py-2xl bg-accent">
      <div className="container mx-auto px-md">
        <div className="text-center mb-xl">
          <h2 className="text-h1 font-bold mb-sm">Not Just Tipping. Portable Reputation.</h2>
          <p className="text-body-lg text-primary/70 max-w-2xl mx-auto">
            Your Web2 influence becomes Web3 reputation. Unlock opportunities beyond social media.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md md:gap-lg"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card variant="default" padding="md" hoverable className="h-full">
                  <CardContent>
                    <div className="flex flex-col space-y-sm">
                      <div className="w-12 h-12 bg-primary border-3 border-primary rounded-brutalist flex items-center justify-center">
                        <Icon className="w-6 h-6 text-secondary" />
                      </div>

                      <h3 className="text-h4 font-bold">{feature.title}</h3>

                      <p className="text-body text-primary/70">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
