import { motion } from "framer-motion"

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-grid-primary/5 bg-[size:32px_32px] [mask-image:radial-gradient(white,transparent_85%)]"
      />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]" />
    </div>
  )
} 