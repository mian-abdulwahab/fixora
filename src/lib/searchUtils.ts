// Search utility functions for fuzzy matching and stemming

// Common word endings to strip for stemming
const WORD_ENDINGS = [
  'ing', 'ed', 'er', 'ers', 's', 'es', 'ies', 'tion', 'ment', 
  'ness', 'ful', 'less', 'able', 'ible', 'ous', 'ive', 'al'
];

// Common service-related word mappings
const WORD_MAPPINGS: Record<string, string[]> = {
  'plumber': ['plumbing', 'plumb', 'pipe', 'pipes', 'piping', 'drain', 'drains', 'drainage', 'water', 'leak', 'leaks', 'leaking', 'faucet', 'faucets', 'tap', 'taps'],
  'electrician': ['electric', 'electrical', 'electricity', 'wiring', 'wire', 'wires', 'circuit', 'circuits', 'outlet', 'outlets', 'switch', 'switches', 'lighting', 'light', 'lights'],
  'carpenter': ['carpentry', 'wood', 'wooden', 'woodwork', 'furniture', 'cabinet', 'cabinets', 'door', 'doors', 'window', 'windows', 'floor', 'flooring'],
  'painter': ['painting', 'paint', 'paints', 'wall', 'walls', 'interior', 'exterior', 'color', 'colors', 'coating'],
  'cleaner': ['cleaning', 'clean', 'cleans', 'wash', 'washing', 'maid', 'housekeeping', 'janitorial', 'sanitize', 'sanitizing'],
  'hvac': ['heating', 'cooling', 'air', 'conditioning', 'ac', 'aircon', 'ventilation', 'furnace', 'heater', 'cooler'],
  'landscaper': ['landscaping', 'garden', 'gardening', 'gardener', 'lawn', 'grass', 'yard', 'tree', 'trees', 'plant', 'plants', 'outdoor'],
  'roofer': ['roofing', 'roof', 'roofs', 'shingle', 'shingles', 'gutter', 'gutters', 'leak', 'leaking'],
  'handyman': ['handywork', 'repair', 'repairs', 'fix', 'fixing', 'maintenance', 'general', 'odd', 'jobs'],
  'mover': ['moving', 'move', 'relocation', 'relocate', 'transport', 'transportation', 'packing', 'pack', 'shifting'],
  'appliance': ['appliances', 'repair', 'washer', 'dryer', 'refrigerator', 'fridge', 'oven', 'stove', 'dishwasher', 'microwave'],
  'pest': ['pests', 'pest control', 'exterminator', 'exterminating', 'bug', 'bugs', 'insect', 'insects', 'termite', 'termites', 'rodent', 'rodents'],
  'security': ['secure', 'alarm', 'alarms', 'camera', 'cameras', 'cctv', 'surveillance', 'lock', 'locks', 'locksmith'],
  'pool': ['pools', 'swimming', 'spa', 'hot tub', 'maintenance', 'cleaning'],
};

// Simple stemmer - removes common endings
export const stem = (word: string): string => {
  let stemmed = word.toLowerCase().trim();
  
  for (const ending of WORD_ENDINGS) {
    if (stemmed.length > ending.length + 2 && stemmed.endsWith(ending)) {
      stemmed = stemmed.slice(0, -ending.length);
      break;
    }
  }
  
  return stemmed;
};

// Get related terms for a search query
export const getRelatedTerms = (query: string): string[] => {
  const lowerQuery = query.toLowerCase().trim();
  const related: Set<string> = new Set([lowerQuery]);
  
  // Add stemmed version
  related.add(stem(lowerQuery));
  
  // Check if query matches any mapping key or value
  for (const [key, values] of Object.entries(WORD_MAPPINGS)) {
    // If query matches the key, add all values
    if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
      values.forEach(v => related.add(v));
      related.add(key);
    }
    
    // If query matches any value, add the key and all values
    for (const value of values) {
      if (value.includes(lowerQuery) || lowerQuery.includes(value)) {
        related.add(key);
        values.forEach(v => related.add(v));
        break;
      }
    }
  }
  
  return Array.from(related);
};

// Check if text matches any of the search terms (fuzzy match)
export const fuzzyMatch = (text: string, searchQuery: string): boolean => {
  if (!searchQuery.trim()) return true;
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  const relatedTerms = getRelatedTerms(searchQuery);
  
  // Check if any related term is found in the text
  return relatedTerms.some(term => {
    // Direct match
    if (lowerText.includes(term)) return true;
    
    // Stemmed match
    const stemmedTerm = stem(term);
    const words = lowerText.split(/\s+/);
    return words.some(word => {
      const stemmedWord = stem(word);
      return stemmedWord.includes(stemmedTerm) || stemmedTerm.includes(stemmedWord);
    });
  });
};

// Match provider against search query
export const matchProvider = (
  provider: { 
    business_name?: string | null; 
    description?: string | null; 
    skills?: string[] | null;
  },
  searchQuery: string
): boolean => {
  if (!searchQuery.trim()) return true;
  
  // Check business name
  if (fuzzyMatch(provider.business_name || '', searchQuery)) return true;
  
  // Check description
  if (fuzzyMatch(provider.description || '', searchQuery)) return true;
  
  // Check skills
  if (provider.skills && provider.skills.length > 0) {
    const skillsText = provider.skills.join(' ');
    if (fuzzyMatch(skillsText, searchQuery)) return true;
  }
  
  return false;
};

// Match category against search query
export const matchCategory = (
  category: { name?: string | null; slug?: string | null },
  searchQuery: string
): boolean => {
  if (!searchQuery.trim()) return true;
  
  return fuzzyMatch(category.name || '', searchQuery) || 
         fuzzyMatch(category.slug || '', searchQuery);
};
