import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/molecules/Card';
import { Shield, Zap, TrendingUp, Users, Lock, Globe } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Instant Tips',
    description: 'Send tips in seconds. Built on Somnia for lightning-fast transactions with minimal fees.',
  },
  {
    icon: TrendingUp,
    title: 'Credit Scores',
    description: 'On-chain reputation system based on X (Twitter) metrics. Build trust with supporters.',
  },
  {
    icon: Shield,
    title: 'Transparent',
    description: 'All tips are on-chain. View complete transaction history. No hidden fees.',
  },
  {
    icon: Users,
    title: 'Real-time Feed',
    description: 'See tips as they happen via Somnia Data Streams. Live activity updates.',
  },
  {
    icon: Lock,
    title: 'Secure',
    description: 'Non-custodial. Your keys, your funds. Smart contracts audited and battle-tested.',
  },
  {
    icon: Globe,
    title: 'Global',
    description: 'Support creators worldwide. No borders, no intermediaries. Just peer-to-peer value.',
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
          <h2 className="text-h1 font-bold mb-sm">Why Choose Tipz?</h2>
          <p className="text-body-lg text-primary/70 max-w-2xl mx-auto">
            Built on Somnia blockchain with creator-first features and supporter rewards.
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
