import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Clock, Calendar, Target } from 'lucide-react';

const Achievements = () => {
  // Example achievements (replace with your actual data)
  const achievements = [
    {
      id: 1,
      title: "Early Bird",
      description: "Complete 5 tasks before 9 AM",
      icon: <Clock className="h-8 w-8 text-amber-500" />,
      progress: 3,
      total: 5,
      unlocked: false
    },
    {
      id: 2,
      title: "Fitness Fanatic",
      description: "Complete 20 fitness quests",
      icon: <Trophy className="h-8 w-8 text-amber-500" />,
      progress: 20,
      total: 20,
      unlocked: true
    },
    {
      id: 3,
      title: "Consistency King",
      description: "Log in for 30 consecutive days",
      icon: <Calendar className="h-8 w-8 text-amber-500" />,
      progress: 14,
      total: 30,
      unlocked: false
    },
    {
      id: 4,
      title: "Goal Crusher",
      description: "Complete all daily goals for a week",
      icon: <Target className="h-8 w-8 text-amber-500" />,
      progress: 5,
      total: 7,
      unlocked: false
    },
    {
      id: 5,
      title: "Knowledge Seeker",
      description: "Complete 50 education quests",
      icon: <Star className="h-8 w-8 text-amber-500" />,
      progress: 50,
      total: 50,
      unlocked: true
    }
  ];

  return (
    <section id="achievements">
      <div className="flex flex-col items-center text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Achievements</h2>
        <p className="mt-4 text-muted-foreground md:text-xl max-w-[700px]">
          Unlock special achievements by completing quests and challenges
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className={!achievement.unlocked ? "opacity-70" : ""}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="rounded-full p-2 bg-muted/50">
                  {achievement.icon}
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {achievement.title}
                    {achievement.unlocked && (
                      <Badge variant="default" className="bg-amber-500">Unlocked</Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{achievement.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.total}</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all" 
                      style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Achievements; 