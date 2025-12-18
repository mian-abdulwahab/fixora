import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search, MapPin, Star, SlidersHorizontal, Filter, X } from "lucide-react";

export interface SearchFiltersState {
  searchQuery: string;
  category: string;
  location: string;
  minRating: number;
  priceRange: [number, number];
  sortBy: string;
  verifiedOnly: boolean;
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
  categories: { id: string; name: string }[];
}

const SearchFilters = ({ filters, onFiltersChange, categories }: SearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof SearchFiltersState>(
    key: K,
    value: SearchFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      searchQuery: "",
      category: "all",
      location: "",
      minRating: 0,
      priceRange: [0, 500],
      sortBy: "rating",
      verifiedOnly: false,
    });
  };

  const activeFiltersCount = [
    filters.category !== "all",
    filters.location !== "",
    filters.minRating > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 500,
    filters.verifiedOnly,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search services or providers..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="pl-12 h-12 bg-card"
          />
        </div>
        
        <div className="relative flex-1 md:flex-none md:w-64">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter location..."
            value={filters.location}
            onChange={(e) => updateFilter("location", e.target.value)}
            className="pl-12 h-12 bg-card"
          />
        </div>

        <div className="flex gap-3">
          <Select value={filters.category} onValueChange={(v) => updateFilter("category", v)}>
            <SelectTrigger className="w-full md:w-[180px] h-12 bg-card">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.sortBy} onValueChange={(v) => updateFilter("sortBy", v)}>
            <SelectTrigger className="w-full md:w-[160px] h-12 bg-card">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
              <SelectItem value="jobs">Most Jobs</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters Sheet */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="lg" className="h-12 relative">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Advanced Filters</SheetTitle>
                <SheetDescription>
                  Refine your search with more options
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Minimum Rating */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent" />
                    Minimum Rating
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[filters.minRating]}
                      onValueChange={([value]) => updateFilter("minRating", value)}
                      max={5}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm font-medium">
                      {filters.minRating > 0 ? `${filters.minRating}+` : "Any"}
                    </span>
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <Label>Price Range</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => updateFilter("priceRange", value as [number, number])}
                      max={500}
                      step={10}
                      className="flex-1"
                    />
                    <span className="w-24 text-sm font-medium">
                      ${filters.priceRange[0]} - ${filters.priceRange[1]}
                    </span>
                  </div>
                </div>

                {/* Verified Only Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="verified" className="cursor-pointer">
                    Verified providers only
                  </Label>
                  <button
                    id="verified"
                    onClick={() => updateFilter("verifiedOnly", !filters.verifiedOnly)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      filters.verifiedOnly ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        filters.verifiedOnly ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Reset Button */}
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  <X className="w-4 h-4 mr-2" />
                  Reset All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filters Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category !== "all" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              {categories.find((c) => c.id === filters.category)?.name}
              <button onClick={() => updateFilter("category", "all")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <MapPin className="w-3 h-3" />
              {filters.location}
              <button onClick={() => updateFilter("location", "")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.minRating > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <Star className="w-3 h-3" />
              {filters.minRating}+ stars
              <button onClick={() => updateFilter("minRating", 0)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.verifiedOnly && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              Verified only
              <button onClick={() => updateFilter("verifiedOnly", false)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={resetFilters}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;