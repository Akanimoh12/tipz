import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';

export function CTABanner() {
  return (
    <section className="py-2xl bg-primary">
      <div className="container mx-auto px-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card variant="elevated" padding="lg" className="bg-secondary p-xl">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-h1 font-bold mb-md text-primary">
                Tokenize Your X Influence Today
              </h2>
              
              <p className="text-body-lg text-primary/70 mb-xl">
                Join the movement bringing 100M+ X users into Web3. Your influence becomes portable on-chain reputation.
              </p>

              <div className="flex flex-col sm:flex-row gap-md justify-center items-center">
                <Link to="/register">
                  <Button variant="brand" size="lg" className="group">
                    <Zap className="w-5 h-5 mr-2xs" />
                    Connect X Account
                    <ArrowRight className="w-5 h-5 ml-2xs group-hover:translate-x-[2px] transition-transform" />
                  </Button>
                </Link>

                <Link to="/leaderboard">
                  <Button variant="primary" size="lg">
                    Explore Creators
                  </Button>
                </Link>
              </div>

              <p className="text-body-sm text-primary/50 mt-lg">
                No credit card · 30-second setup · 98% to creators · Live on Somnia Testnet
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
