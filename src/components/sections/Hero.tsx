import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8 -mt-16">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold tracking-tighter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Questify
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground max-w-[700px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Transform your daily tasks into epic quests and level up your personal journey
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button size="lg" className="gap-2">
              Start your adventure <ArrowRight size={16} />
            </Button>
            <Button size="lg" variant="outline">
              Learn more
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 