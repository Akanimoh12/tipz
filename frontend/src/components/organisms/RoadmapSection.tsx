import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Card } from '@/components/molecules/Card';

interface Milestone {
  title: string;
  status: 'completed' | 'active' | 'upcoming';
}

interface Quarter {
  quarter: string;
  phase: string;
  status: 'completed' | 'active' | 'upcoming';
  milestones: Milestone[];
}

const roadmapData: Quarter[] = [
  {
    quarter: 'Q1 2025',
    phase: 'MVP Launch',
    status: 'completed',
    milestones: [
      { title: 'Profile creation & registration', status: 'completed' },
      { title: 'Basic tipping functionality', status: 'completed' },
      { title: 'Credit score system', status: 'completed' },
      { title: 'X (Twitter) integration', status: 'completed' },
    ],
  },
  {
    quarter: 'Q2 2025',
    phase: 'Advanced Features',
    status: 'active',
    milestones: [
      { title: 'Real-time Somnia Streams', status: 'completed' },
      { title: 'Dynamic leaderboards', status: 'completed' },
      { title: 'Withdrawal system', status: 'active' },
      { title: 'Enhanced analytics dashboard', status: 'upcoming' },
    ],
  },
  {
    quarter: 'Q3 2025',
    phase: 'Platform Integrations',
    status: 'upcoming',
    milestones: [
      { title: 'Multi-token support (USDC, custom)', status: 'upcoming' },
      { title: 'Public API access', status: 'upcoming' },
      { title: 'Mobile app (iOS & Android)', status: 'upcoming' },
      { title: 'Browser extension', status: 'upcoming' },
    ],
  },
  {
    quarter: 'Q4 2025',
    phase: 'Scale & Growth',
    status: 'upcoming',
    milestones: [
      { title: 'Advanced creator analytics', status: 'upcoming' },
      { title: 'Team accounts & multi-sig', status: 'upcoming' },
      { title: 'Subscription tipping model', status: 'upcoming' },
      { title: 'Cross-chain bridge integration', status: 'upcoming' },
    ],
  },
];

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-600',
    label: 'Completed',
  },
  active: {
    icon: Clock,
    color: 'text-brand',
    bgColor: 'bg-brand/10',
    borderColor: 'border-brand',
    label: 'In Progress',
  },
  upcoming: {
    icon: Circle,
    color: 'text-primary/40',
    bgColor: 'bg-accent',
    borderColor: 'border-primary/20',
    label: 'Upcoming',
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function RoadmapSection() {
  return (
    <section className="py-2xl bg-accent">
      <div className="container mx-auto px-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-xl"
        >
          <h2 className="text-h2 font-bold mb-sm">Platform Roadmap</h2>
          <p className="text-body-lg text-primary/70 max-w-2xl mx-auto">
            Building the future of creator tipping on Somnia Network
          </p>
        </motion.div>

        {/* Desktop Timeline (Horizontal) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="hidden lg:block relative"
        >
          {/* Timeline connector line */}
          <div className="absolute top-[120px] left-0 right-0 h-[3px] bg-primary" />

          <div className="grid grid-cols-4 gap-md relative">
            {roadmapData.map((quarter) => {
              const StatusIcon = statusConfig[quarter.status].icon;

              return (
                <motion.div key={quarter.quarter} variants={itemVariants}>
                  <Card
                    variant="elevated"
                    padding="md"
                    className="relative bg-secondary h-full"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -top-[40px] left-1/2 -translate-x-1/2">
                      <div
                        className={`w-12 h-12 rounded-full border-3 ${statusConfig[quarter.status].borderColor} ${statusConfig[quarter.status].bgColor} flex items-center justify-center`}
                      >
                        <StatusIcon
                          className={`w-6 h-6 ${statusConfig[quarter.status].color}`}
                        />
                      </div>
                    </div>

                    {/* Quarter badge */}
                    <div
                      className={`inline-flex items-center gap-xs px-xs py-2xs border-2 ${statusConfig[quarter.status].borderColor} rounded-brutalist mb-sm text-body-sm font-medium ${statusConfig[quarter.status].color}`}
                    >
                      {quarter.quarter}
                    </div>

                    {/* Phase title */}
                    <h3 className="text-h4 font-bold mb-sm">{quarter.phase}</h3>

                    {/* Status label */}
                    <div
                      className={`inline-block px-xs py-2xs text-caption font-medium rounded-brutalist mb-md ${statusConfig[quarter.status].bgColor} ${statusConfig[quarter.status].color}`}
                    >
                      {statusConfig[quarter.status].label}
                    </div>

                    {/* Milestones */}
                    <ul className="space-y-xs">
                      {quarter.milestones.map((milestone) => {
                        const MilestoneIcon = statusConfig[milestone.status].icon;

                        return (
                          <li
                            key={milestone.title}
                            className="flex items-start gap-2xs text-body-sm"
                          >
                            <MilestoneIcon
                              className={`w-4 h-4 mt-[2px] flex-shrink-0 ${statusConfig[milestone.status].color}`}
                            />
                            <span className="text-primary/80">
                              {milestone.title}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Mobile Timeline (Vertical) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="lg:hidden relative pl-lg"
        >
          {/* Vertical timeline line */}
          <div className="absolute top-0 bottom-0 left-[24px] w-[3px] bg-primary" />

          <div className="space-y-lg">
            {roadmapData.map((quarter) => {
              const StatusIcon = statusConfig[quarter.status].icon;

              return (
                <motion.div
                  key={quarter.quarter}
                  variants={itemVariants}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[44px] top-[8px]">
                    <div
                      className={`w-10 h-10 rounded-full border-3 ${statusConfig[quarter.status].borderColor} ${statusConfig[quarter.status].bgColor} flex items-center justify-center`}
                    >
                      <StatusIcon
                        className={`w-5 h-5 ${statusConfig[quarter.status].color}`}
                      />
                    </div>
                  </div>

                  <Card
                    variant="elevated"
                    padding="md"
                    className="bg-secondary"
                  >
                    {/* Quarter badge */}
                    <div
                      className={`inline-flex items-center gap-xs px-xs py-2xs border-2 ${statusConfig[quarter.status].borderColor} rounded-brutalist mb-sm text-body-sm font-medium ${statusConfig[quarter.status].color}`}
                    >
                      {quarter.quarter}
                    </div>

                    {/* Phase title */}
                    <h3 className="text-h4 font-bold mb-sm">{quarter.phase}</h3>

                    {/* Status label */}
                    <div
                      className={`inline-block px-xs py-2xs text-caption font-medium rounded-brutalist mb-md ${statusConfig[quarter.status].bgColor} ${statusConfig[quarter.status].color}`}
                    >
                      {statusConfig[quarter.status].label}
                    </div>

                    {/* Milestones */}
                    <ul className="space-y-xs">
                      {quarter.milestones.map((milestone) => {
                        const MilestoneIcon = statusConfig[milestone.status].icon;

                        return (
                          <li
                            key={milestone.title}
                            className="flex items-start gap-2xs text-body-sm"
                          >
                            <MilestoneIcon
                              className={`w-4 h-4 mt-[2px] flex-shrink-0 ${statusConfig[milestone.status].color}`}
                            />
                            <span className="text-primary/80">
                              {milestone.title}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
