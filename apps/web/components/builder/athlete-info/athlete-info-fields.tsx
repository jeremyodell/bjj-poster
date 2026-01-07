'use client';

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

export function AthleteInfoFields(): React.ReactElement {
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
        />
      </div>

      {/* Belt Rank */}
      <div className="space-y-2">
        <Label htmlFor="belt-rank">
          Belt Rank <span className="text-destructive">*</span>
        </Label>
        <Select defaultValue="white">
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
        />
      </div>
    </div>
  );
}
