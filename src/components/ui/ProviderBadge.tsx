import { Award, Shield, Trophy } from "lucide-react";

export type ProviderTier = "bronze" | "silver" | "gold" | "new";

interface TierConfig {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof Trophy;
  minJobs: number;
  minRating: number;
}

export const tierConfigs: Record<ProviderTier, TierConfig> = {
  new: {
    name: "New",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted",
    icon: Shield,
    minJobs: 0,
    minRating: 0,
  },
  bronze: {
    name: "Bronze",
    color: "text-amber-700 dark:text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    borderColor: "border-amber-300 dark:border-amber-700",
    icon: Award,
    minJobs: 5,
    minRating: 3.0,
  },
  silver: {
    name: "Silver",
    color: "text-slate-500 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800/50",
    borderColor: "border-slate-300 dark:border-slate-600",
    icon: Award,
    minJobs: 20,
    minRating: 4.0,
  },
  gold: {
    name: "Gold",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-400 dark:border-yellow-600",
    icon: Trophy,
    minJobs: 50,
    minRating: 4.5,
  },
};

export function getProviderTier(totalJobs: number, rating: number): ProviderTier {
  if (totalJobs >= 50 && rating >= 4.5) return "gold";
  if (totalJobs >= 20 && rating >= 4.0) return "silver";
  if (totalJobs >= 5 && rating >= 3.0) return "bronze";
  return "new";
}

interface ProviderBadgeProps {
  totalJobs: number;
  rating: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const ProviderBadge = ({ totalJobs, rating, size = "md", showLabel = true }: ProviderBadgeProps) => {
  const tier = getProviderTier(totalJobs, rating);
  const config = tierConfigs[tier];

  if (tier === "new") return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${config.bgColor} ${config.color} ${config.borderColor} ${sizeClasses[size]}`}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && config.name}
    </span>
  );
};

export default ProviderBadge;
