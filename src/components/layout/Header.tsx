import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Menu, X, Trophy, User, ListTodo } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navigation = [
  { name: "Quests", href: "#quests", icon: <ListTodo className="h-4 w-4 mr-2" /> },
  { name: "Profile", href: "#profile", icon: <User className="h-4 w-4 mr-2" /> },
  { name: "Achievements", href: "#achievements", icon: <Trophy className="h-4 w-4 mr-2" /> },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const element = document.querySelector(href)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
      setIsMenuOpen(false)
    }
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-16 items-center justify-between">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <a href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Questify</span>
          </a>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-1">
            {navigation.map((item) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: item.name === "Quests" ? 0.1 : item.name === "Profile" ? 0.2 : 0.3 }}
              >
                <Button
                  variant="ghost"
                  className="relative group px-4"
                  asChild
                >
                  <a
                    href={item.href}
                    onClick={(e) => handleScroll(e, item.href)}
                    className={cn(
                      "cursor-pointer transition-colors hover:text-foreground/80",
                      "text-foreground/60 flex items-center"
                    )}
                  >
                    {item.icon}
                    {item.name}
                    <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out" />
                  </a>
                </Button>
              </motion.div>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="w-px h-6 bg-border/60" />
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-x-0 top-[64px] border-t border-border bg-background shadow-lg md:hidden"
        >
          <div className="container py-4 space-y-4">
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleScroll(e, item.href)}
                  className="px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted text-foreground transition-colors flex items-center"
                >
                  {item.icon}
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
} 