import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Utiliser une importation conditionnelle ou créer une version simplifiée
// import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Composant Progress simplifié si le composant original n'est pas disponible
const SimpleProgress = ({ value }: { value: number }) => {
  return (
    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
      <div 
        className="h-full bg-primary transition-all" 
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

const Profile = () => {
  // Example profile data (replace with your actual data)
  const profile = {
    username: "Adventurer",
    level: 12,
    xp: 1250,
    xpToNextLevel: 2000,
    rank: "Explorer",
    stats: {
      strength: 8,
      intelligence: 15,
      endurance: 10,
      discipline: 12
    },
    achievements: [
      "7 consecutive days of training",
      "Ate 5 balanced meals this week",
      "Studied for 10 hours"
    ]
  };

  return (
    <section id="profile">
      <div className="flex flex-col items-center text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Your Profile</h2>
        <p className="mt-4 text-muted-foreground md:text-xl max-w-[700px]">
          Track your progress and achievements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="md:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle>Level and Rank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h3 className="text-4xl font-bold">{profile.username}</h3>
                <Badge className="mt-2" variant="secondary">Level {profile.level}</Badge>
                <Badge className="mt-2 ml-2">{profile.rank}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>XP</span>
                  <span>{profile.xp} / {profile.xpToNextLevel}</span>
                </div>
                <SimpleProgress value={(profile.xp / profile.xpToNextLevel) * 100} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(profile.stats).map(([stat, value], index) => (
                <div key={stat} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{stat}</span>
                    <span>{value}/20</span>
                  </div>
                  <SimpleProgress value={(value / 20) * 100} />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {profile.achievements.map((achievement, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default Profile; 