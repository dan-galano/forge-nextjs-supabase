import {
  Apple, Bed, Bike, BookOpen, Brain, Brush, Code, Coffee, Droplets, Dumbbell,
  Footprints, Guitar, Heart, Languages, Leaf, Moon, Music, PenLine, PiggyBank,
  Salad, Smartphone, Sparkles, Sun, Wind, type LucideIcon,
} from "lucide-react"

export const HABIT_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  footprints: Footprints,
  bike: Bike,
  droplets: Droplets,
  salad: Salad,
  apple: Apple,
  brain: Brain,
  wind: Wind,
  moon: Moon,
  sun: Sun,
  bed: Bed,
  "pen-line": PenLine,
  code: Code,
  languages: Languages,
  music: Music,
  guitar: Guitar,
  brush: Brush,
  leaf: Leaf,
  heart: Heart,
  coffee: Coffee,
  smartphone: Smartphone,
  "piggy-bank": PiggyBank,
}

export function HabitIcon({ name, className }: { name: string; className?: string }) {
  const Icon = HABIT_ICONS[name] ?? Sparkles
  return <Icon className={className} />
}
