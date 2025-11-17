import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/molecules/Card';
import { Zap, Users, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Tokenize Your X Account',
    description: 'Connect wallet and X account. Your followers, engagement, and influence become an instant on-chain credit score (0-1000 points).',
    icon: Zap,
  },
  {
    number: '02',
    title: 'Share Your Profile',
    description: 'Get your unique Tipz username (tipz.app/@you). Share it anywhere. Build verifiable on-chain reputation as you receive support.',
    icon: Users,
  },
  {
    number: '03',
    title: 'Receive & Send Tips',
    description: 'Supporters send tips instantly. You receive 98% (2% platform fee). See everything in real-time via Somnia Streams. Support others too!',
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
          <h2 className="text-h1 font-bold mb-sm">From X to Web3 in 30 Seconds</h2>
          <p className="text-body-lg text-primary/70 max-w-2xl mx-auto">
            No complex setup. Just connect, tokenize, and start building portable on-chain reputation.
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
