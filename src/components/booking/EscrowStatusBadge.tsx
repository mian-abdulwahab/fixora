import { Shield, Lock, AlertTriangle, CheckCircle } from "lucide-react";

interface EscrowStatusBadgeProps {
  escrowStatus?: string;
  workerShare?: number;
  platformFee?: number;
  compact?: boolean;
}

const EscrowStatusBadge = ({ escrowStatus, workerShare, platformFee, compact = false }: EscrowStatusBadgeProps) => {
  if (!escrowStatus || escrowStatus === "none") return null;

  const config: Record<string, { icon: any; label: string; color: string; bg: string }> = {
    held: {
      icon: Lock,
      label: "Escrow: Funds Held",
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
    },
    released: {
      icon: CheckCircle,
      label: "Escrow: Funds Released",
      color: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200",
    },
    disputed: {
      icon: AlertTriangle,
      label: "Escrow: Disputed",
      color: "text-destructive",
      bg: "bg-destructive/5 border-destructive/20",
    },
    refunded: {
      icon: Shield,
      label: "Escrow: Refunded",
      color: "text-blue-700",
      bg: "bg-blue-50 border-blue-200",
    },
  };

  const current = config[escrowStatus] || config.held;
  const Icon = current.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${current.bg} ${current.color}`}>
        <Icon className="w-3 h-3" />
        {current.label.replace("Escrow: ", "")}
      </span>
    );
  }

  return (
    <div className={`rounded-lg border p-3 ${current.bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${current.color}`} />
        <span className={`text-sm font-medium ${current.color}`}>{current.label}</span>
      </div>
      {(workerShare || platformFee) && (
        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
          {workerShare && <p>Provider Share (90%): Rs. {Number(workerShare).toLocaleString()}</p>}
          {platformFee && <p>Platform Fee (10%): Rs. {Number(platformFee).toLocaleString()}</p>}
        </div>
      )}
    </div>
  );
};

export default EscrowStatusBadge;
