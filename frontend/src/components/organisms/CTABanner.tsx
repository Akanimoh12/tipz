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
                Ready to Start Tipping?
              </h2>
              
              <p className="text-body-lg text-primary/70 mb-xl">
                Join thousands of creators and supporters on Tipz. Send your first tip in seconds.
              </p>

              <div className="flex flex-col sm:flex-row gap-md justify-center items-center">
                <Link to="/register">
                  <Button variant="brand" size="lg" className="group">
                    <Zap className="w-5 h-5 mr-2xs" />
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2xs group-hover:translate-x-[2px] transition-transform" />
                  </Button>
                </Link>

                <Link to="/leaderboard">
                  <Button variant="primary" size="lg">
                    View Leaderboard
                  </Button>
                </Link>
              </div>

              <p className="text-body-sm text-primary/50 mt-lg">
                No credit card required · Connect wallet to start · 2% platform fee
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
