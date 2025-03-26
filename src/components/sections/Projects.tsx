import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const QuestList = () => {
  // Example quests (replace with your actual data)
  const quests = [
    {
      id: 1,
      title: "Daily Workout",
      description: "Complete 30 minutes of physical exercise",
      category: "Fitness",
      xp: 100,
      difficulty: "Easy",
      completed: false
    },
    {
      id: 2,
      title: "Balanced Meal",
      description: "Eat a meal containing proteins, vegetables and complex carbs",
      category: "Nutrition",
      xp: 75,
      difficulty: "Medium",
      completed: true
    },
    {
      id: 3,
      title: "Study Session",
      description: "Study for 1 hour without distractions",
      category: "Education",
      xp: 150,
      difficulty: "Hard",
      completed: false
    },
  ];

  return (
    <section id="quests">
      <div className="flex flex-col items-center text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Your Quests</h2>
        <p className="mt-4 text-muted-foreground md:text-xl max-w-[700px]">
          Complete these quests to earn XP and level up
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quests.map((quest, index) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className={quest.completed ? "opacity-70" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{quest.title}</CardTitle>
                  <Badge variant={quest.completed ? "outline" : "default"}>
                    {quest.completed ? "Completed" : `+${quest.xp} XP`}
                  </Badge>
                </div>
                <CardDescription>{quest.category} • {quest.difficulty}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{quest.description}</p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant={quest.completed ? "outline" : "default"} 
                  className="w-full"
                  disabled={quest.completed}
                >
                  {quest.completed ? "Already completed" : "Mark as completed"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default QuestList;