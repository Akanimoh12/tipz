import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/molecules/Card';
import { Zap, Users, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Connect Wallet',
    description: 'Connect your wallet with RainbowKit. Support for MetaMask, WalletConnect, and more.',
    icon: Zap,
  },
  {
    number: '02',
    title: 'Find Creators',
    description: 'Browse profiles, check credit scores, and discover amazing creators to support.',
    icon: Users,
  },
  {
    number: '03',
    title: 'Send Tips',
    description: 'Send tips in seconds. 98% goes to creators, 2% platform fee. Instant confirmation.',
    icon: TrendingUp,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function HowItWorksSection() {
  return (
    <section className="py-2xl bg-secondary">
      <div className="container mx-auto px-md">
        <div className="text-center mb-xl">
          <h2 className="text-h1 font-bold mb-sm">How It Works</h2>
          <p className="text-body-lg text-primary/70 max-w-2xl mx-auto">
            Get started with Tipz in three simple steps. No complex setup required.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-lg"
        >
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.number} variants={itemVariants}>
                <Card
                  variant="elevated"
                  padding="lg"
                  className="h-full hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-200"
                >
                  <CardContent>
                    <div className="flex flex-col items-center text-center space-y-md">
                      <div className="w-16 h-16 bg-primary border-3 border-primary rounded-brutalist flex items-center justify-center">
                        <Icon className="w-8 h-8 text-secondary" />
                      </div>

                      <span className="text-h3 font-bold text-primary/30">{step.number}</span>

                      <h3 className="text-h3 font-bold">{step.title}</h3>

                      <p className="text-body text-primary/70">{step.description}</p>
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
