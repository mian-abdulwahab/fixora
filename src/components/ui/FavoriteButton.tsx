import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface FavoriteButtonProps {
  providerId: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "ghost" | "outline" | "default";
  showLabel?: boolean;
}

const FavoriteButton = ({ providerId, size = "icon", variant = "ghost", showLabel = false }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const favorited = isFavorite(providerId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    toggleFavorite(providerId);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={favorited ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}
    >
      <Heart className={`w-5 h-5 ${favorited ? "fill-red-500" : ""}`} />
      {showLabel && (
        <span className="ml-1">{favorited ? "Saved" : "Save"}</span>
      )}
    </Button>
  );
};

export default FavoriteButton;
