import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const VerifiedBadge = ({ className, size = "md", showText = false }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 text-emerald-600", className)}>
      <CheckCircle className={cn(sizeClasses[size], "fill-emerald-100")} />
      {showText && <span className="text-xs font-medium">Verified</span>}
    </span>
  );
};

export default VerifiedBadge;