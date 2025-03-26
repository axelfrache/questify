import { Github, Mail, Heart } from "lucide-react"
import { motion } from "framer-motion"

export function Footer() {
  return (
    <footer className="border-t border-muted mt-32">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-6"
          >
            <a
              href="https://github.com/axelfrache/questify"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-6 w-6" />
              <span className="sr-only">GitHub</span>
            </a>
            <a
              href="mailto:contact@questify.app"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-6 w-6" />
              <span className="sr-only">Email</span>
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground text-center flex items-center justify-center gap-1"
          >
            Developed with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by Axel Frache
          </motion.p>
        </div>
      </div>
    </footer>
  )
} 