import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { Header } from "@/components/layout/Header"
import { AnimatedLayout } from "@/components/layout/AnimatedLayout"
import Hero from "@/components/sections/Hero"
import QuestList from "@/components/sections/Projects"
import { Footer } from "@/components/layout/Footer"
import { AnimatedBackground } from "@/components/ui/animated-background"
import Profile from "@/components/sections/Contact"
import Achievements from "@/components/sections/Achievements"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="questify-theme">
      <div className="min-h-screen bg-background text-foreground">
        <AnimatedBackground />
        <Header />
        <AnimatedLayout>
          <main>
            {/* Hero section prend toute la hauteur de l'écran */}
            <Hero />
            
            <div className="container mx-auto px-4 md:px-6 space-y-20">
              <div id="quests">
                <QuestList />
              </div>
              <div id="profile">
                <Profile />
              </div>
              <div id="achievements">
                <Achievements />
              </div>
            </div>
          </main>
        </AnimatedLayout>
        <Footer />
      </div>
    </ThemeProvider>
  )
}

export default App
