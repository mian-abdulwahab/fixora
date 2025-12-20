import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PAKISTAN_CITIES } from "@/lib/pakistanCities";

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CitySelect = ({ 
  value, 
  onChange, 
  placeholder = "Select city...", 
  className,
  disabled = false 
}: CitySelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    const lowerSearch = search.toLowerCase().trim();
    
    if (!lowerSearch) {
      return PAKISTAN_CITIES;
    }

    const filtered: Record<string, string[]> = {};
    
    for (const [province, cities] of Object.entries(PAKISTAN_CITIES)) {
      const matchingCities = cities.filter(city => 
        city.toLowerCase().includes(lowerSearch)
      );
      if (matchingCities.length > 0) {
        filtered[province] = matchingCities;
      }
    }
    
    return filtered;
  }, [search]);

  const hasResults = Object.keys(filteredCities).length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-12 font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate">
              {value || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-50" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search city..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {!hasResults && (
              <CommandEmpty>No city found.</CommandEmpty>
            )}
            {Object.entries(filteredCities).map(([province, cities]) => (
              <CommandGroup key={province} heading={province}>
                {cities.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={() => {
                      onChange(city);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === city ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {city}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CitySelect;
