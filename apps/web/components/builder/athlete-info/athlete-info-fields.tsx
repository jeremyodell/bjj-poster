'use client';

import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
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
import { useDebouncedStoreSync } from '@/lib/hooks/use-debounced-store-sync';
import {
  athleteInfoSchema,
  MAX_NAME_LENGTH,
  MAX_TEAM_LENGTH,
} from '@/lib/validations';

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

/**
 * Form fields for athlete information (name, belt rank, team).
 * Features debounced auto-save, real-time validation, and accessibility support.
 */
export function AthleteInfoFields(): React.ReactElement {
  // Get state and actions from store with shallow comparison
  const { storeAthleteName, storeBeltRank, storeTeam, setField } = usePosterBuilderStore(
    useShallow((state) => ({
      storeAthleteName: state.athleteName,
      storeBeltRank: state.beltRank,
      storeTeam: state.team,
      setField: state.setField,
    }))
  );

  // Local state for immediate UI updates
  const [athleteName, setAthleteName] = useState(storeAthleteName);
  const [team, setTeam] = useState(storeTeam);
  const [beltRank, setBeltRank] = useState<BeltRank>(storeBeltRank);

  // Validation state
  const [errors, setErrors] = useState<FieldErrors>({});

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
  useDebouncedStoreSync(
    athleteName,
    storeAthleteName,
    useCallback((value: string) => setField('athleteName', value), [setField]),
    {
      delayMs: DEBOUNCE_MS,
      validate: useCallback((value: string) => validateField('athleteName', value), [validateField]),
    }
  );

  // Debounced sync to store for team
  useDebouncedStoreSync(
    team,
    storeTeam,
    useCallback((value: string) => setField('team', value), [setField]),
    {
      delayMs: DEBOUNCE_MS,
      validate: useCallback((value: string) => validateField('team', value), [validateField]),
    }
  );

  // Optimistically clear error for valid input
  const handleAthleteNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setAthleteName(value);
      if (errors.athleteName && value.trim().length > 0 && value.length <= MAX_NAME_LENGTH) {
        setErrors((prev) => ({ ...prev, athleteName: undefined }));
      }
    },
    [errors.athleteName]
  );

  // Validate on blur
  const handleAthleteNameBlur = useCallback(() => {
    const error = validateField('athleteName', athleteName);
    setErrors((prev) => ({ ...prev, athleteName: error }));
  }, [athleteName, validateField]);

  // Team is optional, so we only check length for optimistic error clearing.
  // Whitespace-only input is valid for team (unlike athleteName which requires content).
  const handleTeamChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTeam(value);
      if (errors.team && value.length <= MAX_TEAM_LENGTH) {
        setErrors((prev) => ({ ...prev, team: undefined }));
      }
    },
    [errors.team]
  );

  // Validate on blur
  const handleTeamBlur = useCallback(() => {
    const error = validateField('team', team);
    setErrors((prev) => ({ ...prev, team: error }));
  }, [team, validateField]);

  // Belt rank updates immediately (no debounce)
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
