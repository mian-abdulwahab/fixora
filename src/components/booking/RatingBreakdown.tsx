import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Review {
  rating: number;
  punctuality_rating?: number | null;
  quality_rating?: number | null;
  value_rating?: number | null;
  communication_rating?: number | null;
}

interface RatingBreakdownProps {
  reviews: Review[];
}

const SUB_RATINGS = [
  { key: "punctuality_rating" as const, label: "Punctuality" },
  { key: "quality_rating" as const, label: "Quality" },
  { key: "value_rating" as const, label: "Value for Money" },
  { key: "communication_rating" as const, label: "Communication" },
];

const RatingBreakdown = ({ reviews }: RatingBreakdownProps) => {
  if (reviews.length === 0) return null;

  const overallAvg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  // Star distribution (5, 4, 3, 2, 1)
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: (reviews.filter((r) => r.rating === star).length / reviews.length) * 100,
  }));

  // Sub-rating averages
  const subAverages = SUB_RATINGS.map(({ key, label }) => {
    const rated = reviews.filter((r) => r[key] != null && r[key]! > 0);
    const avg = rated.length > 0 ? rated.reduce((s, r) => s + (r[key] || 0), 0) / rated.length : null;
    return { label, avg, count: rated.length };
  });

  const hasSubRatings = subAverages.some((s) => s.avg !== null);

  return (
    <div className="space-y-6">
      {/* Overall rating summary */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground">{overallAvg.toFixed(1)}</div>
          <div className="flex items-center gap-0.5 mt-1 justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i <= Math.round(overallAvg) ? "text-accent fill-accent" : "text-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{reviews.length} reviews</p>
        </div>

        {/* Star distribution bars */}
        <div className="flex-1 space-y-1.5">
          {distribution.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-3">{star}</span>
              <Star className="w-3 h-3 text-accent fill-accent shrink-0" />
              <Progress value={pct} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-rating breakdown */}
      {hasSubRatings && (
        <div className="grid grid-cols-2 gap-3">
          {subAverages
            .filter((s) => s.avg !== null)
            .map(({ label, avg }) => (
              <div key={label} className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{label}</span>
                  <span className="text-xs font-bold text-foreground">{avg!.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i <= Math.round(avg!) ? "text-accent fill-accent" : "text-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default RatingBreakdown;
