'use client';

import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { usePosterBuilderStore, type BeltRank } from '@/lib/stores';
import { athleteInfoSchema } from '@/lib/validations';

/** Type for field-specific errors */
interface FieldErrors {
  athleteName?: string;
  team?: string;
}

/** Belt rank configuration with display names and colors */
const BELT_OPTIONS = [
  { value: 'white', label: 'White', colorClass: 'bg-gray-100 border border-gray-300' },
  { value: 'blue', label: 'Blue', colorClass: 'bg-blue-600' },
  { value: 'purple', label: 'Purple', colorClass: 'bg-purple-600' },
  { value: 'brown', label: 'Brown', colorClass: 'bg-amber-800' },
  { value: 'black', label: 'Black', colorClass: 'bg-black' },
  { value: 'red-black', label: 'Red/Black', colorClass: 'bg-gradient-to-r from-red-600 to-black' },
  { value: 'red', label: 'Red', colorClass: 'bg-red-600' },
] as const;

/** Debounce delay in milliseconds for text field updates */
const DEBOUNCE_MS = 300;

export function AthleteInfoFields(): React.ReactElement {
  // Get state and actions from store
  const storeAthleteName = usePosterBuilderStore((state) => state.athleteName);
  const storeBeltRank = usePosterBuilderStore((state) => state.beltRank);
  const storeTeam = usePosterBuilderStore((state) => state.team);
  const setField = usePosterBuilderStore((state) => state.setField);

  // Local state for immediate UI updates
  const [athleteName, setAthleteName] = useState(storeAthleteName);
  const [team, setTeam] = useState(storeTeam);
  const [beltRank, setBeltRank] = useState<BeltRank>(storeBeltRank);

  // Validation state
  const [errors, setErrors] = useState<FieldErrors>({});

  // Sync local state when store changes (e.g., rehydration from localStorage)
  useEffect(() => {
    setAthleteName(storeAthleteName);
  }, [storeAthleteName]);

  useEffect(() => {
    setTeam(storeTeam);
  }, [storeTeam]);

  useEffect(() => {
    setBeltRank(storeBeltRank);
  }, [storeBeltRank]);

  // Debounced sync to store for athlete name
  useEffect(() => {
    const timer = setTimeout(() => {
      if (athleteName !== storeAthleteName) {
        setField('athleteName', athleteName);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [athleteName, storeAthleteName, setField]);

  // Debounced sync to store for team
  useEffect(() => {
    const timer = setTimeout(() => {
      if (team !== storeTeam) {
        setField('team', team);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [team, storeTeam, setField]);

  // Validate a single field using Zod schema
  const validateField = useCallback(
    (fieldName: 'athleteName' | 'team', value: string): string | undefined => {
      const fieldSchema = athleteInfoSchema.shape[fieldName];
      const result = fieldSchema.safeParse(value);
      if (!result.success) {
        return result.error.errors[0]?.message;
      }
      return undefined;
    },
    []
  );

  // Handler for athlete name input - clears error optimistically when typing
  const handleAthleteNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setAthleteName(value);
      // Clear error when user starts typing valid input
      if (errors.athleteName && value.trim().length > 0 && value.length <= 50) {
        setErrors((prev) => ({ ...prev, athleteName: undefined }));
      }
    },
    [errors.athleteName]
  );

  // Handler for athlete name blur - validates on blur
  const handleAthleteNameBlur = useCallback(() => {
    const error = validateField('athleteName', athleteName);
    setErrors((prev) => ({ ...prev, athleteName: error }));
  }, [athleteName, validateField]);

  // Handler for team input - clears error optimistically when typing
  const handleTeamChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTeam(value);
      // Clear error when user starts typing valid input (team is optional, so only max length matters)
      if (errors.team && value.length <= 50) {
        setErrors((prev) => ({ ...prev, team: undefined }));
      }
    },
    [errors.team]
  );

  // Handler for team blur - validates on blur
  const handleTeamBlur = useCallback(() => {
    const error = validateField('team', team);
    setErrors((prev) => ({ ...prev, team: error }));
  }, [team, validateField]);

  // Handler for belt rank - updates immediately (no debounce)
  const handleBeltRankChange = useCallback(
    (value: string) => {
      const beltValue = value as BeltRank;
      setBeltRank(beltValue);
      setField('beltRank', beltValue);
    },
    [setField]
  );

  return (
    <div className="space-y-4">
      {/* Athlete Name */}
      <div className="space-y-2">
        <Label htmlFor="athlete-name">
          Athlete Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="athlete-name"
          type="text"
          placeholder="Enter athlete name"
          value={athleteName}
          onChange={handleAthleteNameChange}
          onBlur={handleAthleteNameBlur}
          aria-required="true"
          aria-invalid={!!errors.athleteName}
          aria-describedby={errors.athleteName ? 'athlete-name-error' : undefined}
        />
        {errors.athleteName && (
          <p id="athlete-name-error" className="text-sm text-destructive">
            {errors.athleteName}
          </p>
        )}
      </div>

      {/* Belt Rank */}
      <div className="space-y-2">
        <Label htmlFor="belt-rank">
          Belt Rank <span className="text-destructive">*</span>
        </Label>
        <Select value={beltRank} onValueChange={handleBeltRankChange}>
          <SelectTrigger id="belt-rank" aria-required="true">
            <SelectValue placeholder="Select belt rank" />
          </SelectTrigger>
          <SelectContent>
            {BELT_OPTIONS.map((belt) => (
              <SelectItem key={belt.value} value={belt.value}>
                <div className="flex items-center gap-2">
                  <span
                    data-testid="belt-color"
                    className={cn('h-3 w-3 rounded-full shrink-0', belt.colorClass)}
                    aria-hidden="true"
                  />
                  <span>{belt.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Team */}
      <div className="space-y-2">
        <Label htmlFor="team">
          Team <span className="text-muted-foreground text-sm">(Optional)</span>
        </Label>
        <Input
          id="team"
          type="text"
          placeholder="Enter team name"
          value={team}
          onChange={handleTeamChange}
          onBlur={handleTeamBlur}
          aria-invalid={!!errors.team}
          aria-describedby={errors.team ? 'team-error' : undefined}
        />
        {errors.team && (
          <p id="team-error" className="text-sm text-destructive">
            {errors.team}
          </p>
        )}
      </div>
    </div>
  );
}
