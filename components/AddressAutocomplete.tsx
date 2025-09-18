'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { getAutocompleteData } from '@/app/helpers/routingApi';

interface AutocompleteResult {
  formatted: string;
  lat: number;
  lon: number;
  place_id: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: AutocompleteResult) => void;
  placeholder?: string;
  label?: string;
  debounceMs?: number;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter an address...',
  label,
  debounceMs = 750,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isSelectingRef = useRef(false); // Use ref instead of state to prevent re-renders

  // Debounced search function
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search if we're currently selecting from suggestions
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    // Don't search for very short queries
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Set up new timeout
    debounceRef.current = setTimeout(async () => {
      // Double check that we're not selecting (in case the timeout fired after selection)
      if (isSelectingRef.current) {
        isSelectingRef.current = false;
        return;
      }

      setIsLoading(true);
      try {
        const data = await getAutocompleteData(value, {
          limit: 5,
          filter: 'rect:-124.848974,45.543541,-116.91558,49.002494', // Washington state bounding box
          bias: 'proximity:-122.3321,47.6062', // Seattle downtown coordinates
        });

        if (data.results) {
          const formattedResults: AutocompleteResult[] = data.results.map((result: Record<string, unknown>) => ({
            formatted: result.formatted as string,
            lat: result.lat as number,
            lon: result.lon as number,
            place_id: (result.place_id as string) || `${result.lat}-${result.lon}`,
          }));

          setSuggestions(formattedResults);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    // Cleanup function
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, debounceMs]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AutocompleteResult) => {
    isSelectingRef.current = true; // Prevent search from triggering
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSuggestions([]);

    if (onSelect) {
      onSelect(suggestion);
    }

    // Return focus to input
    inputRef.current?.focus();

    // Reset the selecting flag after a short delay to ensure the effect doesn't run
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Update refs when selected index changes
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='relative'>
      {label && <label className='text-sm font-medium block mb-2'>{label}</label>}

      <div className='relative'>
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={placeholder}
          className='pr-10'
        />

        <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
          {isLoading ? (
            <Loader2 className='h-4 w-4 animate-spin text-gray-400' />
          ) : (
            <MapPin className='h-4 w-4 text-gray-400' />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto'>
          {suggestions.map((suggestion, index) => (
            <Button
              key={suggestion.place_id}
              ref={(el) => {
                suggestionRefs.current[index] = el;
              }}
              variant='ghost'
              className={`w-full justify-start text-left p-3 h-auto whitespace-normal ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSuggestionSelect(suggestion);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSuggestionSelect(suggestion);
              }}
            >
              <div className='flex items-start gap-2'>
                <MapPin className='h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0' />
                <div className='text-sm'>
                  <div className='font-medium'>{suggestion.formatted}</div>
                  <div className='text-xs text-gray-500'>
                    {suggestion.lat.toFixed(4)}, {suggestion.lon.toFixed(4)}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && value.length >= 3 && suggestions.length === 0 && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3'>
          <div className='text-sm text-gray-500 text-center'>No addresses found for &ldquo;{value}&rdquo;</div>
        </div>
      )}
    </div>
  );
}
