# Skill: React Component Creation

Use this skill when creating React components for the BJJ Poster App frontend.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Hook Form + Zod for forms

## Component Template

```tsx
// apps/web/src/components/poster-builder/athlete-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const BELT_RANKS = ['white', 'blue', 'purple', 'brown', 'black'] as const;

const athleteFormSchema = z.object({
  athleteName: z.string().min(2, 'Name must be at least 2 characters'),
  teamName: z.string().optional(),
  beltRank: z.enum(BELT_RANKS, { required_error: 'Please select a belt rank' }),
});

type AthleteFormValues = z.infer<typeof athleteFormSchema>;

interface AthleteFormProps {
  onSubmit: (values: AthleteFormValues) => void;
  defaultValues?: Partial<AthleteFormValues>;
  isLoading?: boolean;
}

export function AthleteForm({ onSubmit, defaultValues, isLoading }: AthleteFormProps) {
  const form = useForm<AthleteFormValues>({
    resolver: zodResolver(athleteFormSchema),
    defaultValues: {
      athleteName: '',
      teamName: '',
      beltRank: undefined,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="athleteName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Athlete Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter athlete name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="teamName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter team name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="beltRank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Belt Rank</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select belt rank" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BELT_RANKS.map((belt) => (
                    <SelectItem key={belt} value={belt}>
                      {belt.charAt(0).toUpperCase() + belt.slice(1)} Belt
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </Form>
  );
}
```

## File Structure

```
apps/web/src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth route group
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/       # Authenticated route group
│   │   ├── layout.tsx
│   │   ├── page.tsx       # Dashboard home
│   │   ├── posters/
│   │   └── settings/
│   └── layout.tsx
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── poster-builder/    # Feature: poster creation
│   ├── dashboard/         # Feature: user dashboard
│   └── shared/            # Cross-feature components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities, API client
└── types/                 # TypeScript types
```

## Custom Hook Pattern

```tsx
// apps/web/src/hooks/use-posters.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Poster, CreatePosterInput } from '@/types';

export function usePosters() {
  return useQuery({
    queryKey: ['posters'],
    queryFn: () => api.posters.list(),
  });
}

export function usePoster(posterId: string) {
  return useQuery({
    queryKey: ['posters', posterId],
    queryFn: () => api.posters.get(posterId),
    enabled: !!posterId,
    refetchInterval: (data) => {
      // Poll while processing
      return data?.status === 'PROCESSING' ? 2000 : false;
    },
  });
}

export function useCreatePoster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePosterInput) => api.posters.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posters'] });
    },
  });
}
```

## API Client Pattern

```tsx
// apps/web/src/lib/api.ts
import { getSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const session = await getSession();
  
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken && {
        Authorization: `Bearer ${session.accessToken}`,
      }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

export const api = {
  posters: {
    list: () => fetchWithAuth('/api/posters'),
    get: (id: string) => fetchWithAuth(`/api/posters/${id}`),
    create: (input: CreatePosterInput) =>
      fetchWithAuth('/api/posters', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  },
  templates: {
    list: () => fetchWithAuth('/api/templates'),
  },
  uploads: {
    getPresignedUrl: (filename: string, contentType: string) =>
      fetchWithAuth('/api/uploads/presigned-url', {
        method: 'POST',
        body: JSON.stringify({ filename, contentType }),
      }),
  },
};
```

## Image Upload Component

```tsx
// apps/web/src/components/poster-builder/image-upload.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onUploadComplete: (imageKey: string) => void;
  maxSizeMB?: number;
}

export function ImageUpload({ onUploadComplete, maxSizeMB = 10 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      // Get presigned URL
      const { uploadUrl, imageKey } = await api.uploads.getPresignedUrl(
        file.name,
        file.type
      );

      // Upload directly to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Set preview and notify parent
      setPreview(URL.createObjectURL(file));
      onUploadComplete(imageKey);
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    disabled: uploading,
  });

  const clearPreview = () => {
    setPreview(null);
  };

  if (preview) {
    return (
      <div className="relative">
        <img
          src={preview}
          alt="Preview"
          className="w-full h-64 object-cover rounded-lg"
        />
        <button
          onClick={clearPreview}
          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
        uploading && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />
      
      {uploading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="mt-2 text-sm text-gray-600">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Upload className="h-10 w-10 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Drop the image here'
              : 'Drag & drop an image, or click to select'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PNG or JPG up to {maxSizeMB}MB
          </p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

## Checklist

- [ ] Use TypeScript with strict types
- [ ] Define prop interface with JSDoc if complex
- [ ] Use Zod for form validation
- [ ] Handle loading and error states
- [ ] Use shadcn/ui components for consistency
- [ ] Extract reusable logic into custom hooks
- [ ] Add `'use client'` directive for client components
- [ ] Follow file naming convention (kebab-case)
