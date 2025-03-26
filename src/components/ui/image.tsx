import { cn } from "@/lib/utils"

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: string
}

export default function Image({
  aspectRatio = "aspect-[1.91/1]",
  className,
  alt = "",
  ...props
}: ImageProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg", aspectRatio)}>
      <img
        className={cn("object-cover w-full h-full", className)}
        alt={alt}
        {...props}
      />
    </div>
  )
} 