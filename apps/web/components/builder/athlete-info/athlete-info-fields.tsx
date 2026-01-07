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

  // Handler for athlete name input
  const handleAthleteNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAthleteName(e.target.value);
    },
    []
  );

  // Handler for team input
  const handleTeamChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTeam(e.target.value);
    },
    []
  );

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
          maxLength={50}
          value={athleteName}
          onChange={handleAthleteNameChange}
        />
      </div>

      {/* Belt Rank */}
      <div className="space-y-2">
        <Label htmlFor="belt-rank">
          Belt Rank <span className="text-destructive">*</span>
        </Label>
        <Select value={beltRank} onValueChange={handleBeltRankChange}>
          <SelectTrigger id="belt-rank">
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
          maxLength={50}
          value={team}
          onChange={handleTeamChange}
        />
      </div>
    </div>
  );
}
