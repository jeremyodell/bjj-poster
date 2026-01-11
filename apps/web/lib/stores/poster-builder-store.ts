import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import {
  generatePoster as generatePosterApi,
  type GeneratePosterResponse,
} from '@/lib/api/generate-poster';

/** Valid BJJ belt ranks */
export type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'red-black' | 'red';

/** Data structure for loading a poster into the builder */
export interface LoadFromPosterData {
  templateId: string;
  athleteName: string;
  tournament: string;
  beltRank: BeltRank;
  team?: string;
  date?: string;
  location?: string;
}

/** Form fields that can be set via setField (excludes athletePhoto and UI state) */
export type PosterFormField =
  | 'athleteName'
  | 'beltRank'
  | 'team'
  | 'tournament'
  | 'date'
  | 'location';

export interface PosterBuilderState {
  /** Athlete photo file (not persisted - File objects can't be serialized) */
  athletePhoto: File | null;
  /** Athlete's display name */
  athleteName: string;
  /** BJJ belt rank */
  beltRank: BeltRank;
  /** Team/academy name */
  team: string;
  /** Tournament name */
  tournament: string;
  /** Event date (ISO string or display format) */
  date: string;
  /** Event location */
  location: string;
  /** Selected poster template ID */
  selectedTemplateId: string | null;

  /** Whether poster generation is in progress (not persisted) */
  isGenerating: boolean;
  /** Generation progress percentage 0-100 (not persisted) */
  generationProgress: number;
  /** Whether advanced options panel is shown (not persisted) */
  showAdvancedOptions: boolean;
  /** Whether preview panel is shown (not persisted) */
  showPreview: boolean;
}

export interface PosterBuilderActions {
  /**
   * Sets the athlete photo file.
   * NOTE: File objects are not persisted to localStorage.
   */
  setPhoto: (file: File | null) => void;
  /**
   * Updates a form field value. Restricted to PosterFormField type for type safety.
   * Use dedicated methods for other state:
   * - setPhoto() for athletePhoto
   * - setTemplate() for selectedTemplateId
   * - setGenerating() for isGenerating/generationProgress
   * - toggleAdvancedOptions()/togglePreview() for UI toggles
   *
   * VALIDATION NOTE: This store does not validate field values. Validation
   * should be performed in the UI layer (form components) before calling
   * this method.
   */
  setField: <K extends PosterFormField>(key: K, value: PosterBuilderState[K]) => void;
  /** Sets the selected template ID */
  setTemplate: (templateId: string | null) => void;
  /**
   * Sets generation state.
   * @param isGenerating - Whether generation is in progress
   * @param progress - Progress percentage (0-100), defaults to 0
   */
  setGenerating: (isGenerating: boolean, progress?: number) => void;
  /** Toggles the advanced options panel visibility */
  toggleAdvancedOptions: () => void;
  /** Toggles the preview panel visibility */
  togglePreview: () => void;
  /** Resets all fields to initial defaults */
  reset: () => void;
  /**
   * Generates a poster using the current form data.
   * @throws Error if required fields are missing
   * @returns The generated poster response
   */
  generatePoster: () => Promise<GeneratePosterResponse>;
  /**
   * Loads poster data into the form for duplication.
   * Clears athletePhoto since it cannot be duplicated.
   */
  loadFromPoster: (data: LoadFromPosterData) => void;
  /**
   * Initializes the form with sample data for first-time visitors.
   * Only sets fields that are currently empty/default.
   */
  initializeForFirstVisit: () => void;
}

export type PosterBuilderStore = PosterBuilderState & PosterBuilderActions;

const initialState: PosterBuilderState = {
  athletePhoto: null,
  athleteName: '',
  beltRank: 'white',
  team: '',
  tournament: '',
  date: '',
  location: '',
  selectedTemplateId: null,
  isGenerating: false,
  generationProgress: 0,
  showAdvancedOptions: false,
  showPreview: false,
};

/**
 * Poster builder form state store.
 *
 * PERSISTENCE: Form data (athleteName, beltRank, team, tournament, date,
 * location, selectedTemplateId) is persisted to localStorage under key
 * 'poster-builder-draft'. This allows users to resume drafts across sessions.
 *
 * NOT PERSISTED:
 * - athletePhoto: File objects cannot be serialized to JSON
 * - UI state: isGenerating, generationProgress, showAdvancedOptions, showPreview
 *
 * HYDRATION: Uses skipHydration to prevent Next.js SSR mismatches. Call
 * usePosterBuilderStore.persist.rehydrate() in a client-side useEffect.
 */
export const usePosterBuilderStore = create<PosterBuilderStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setPhoto: (file) => set({ athletePhoto: file }),

        setField: (key, value) => set({ [key]: value }),

        setTemplate: (templateId) => set({ selectedTemplateId: templateId }),

        setGenerating: (isGenerating, progress) =>
          set({
            isGenerating,
            generationProgress: isGenerating ? (progress ?? 0) : 0,
          }),

        toggleAdvancedOptions: () =>
          set((state) => ({ showAdvancedOptions: !state.showAdvancedOptions })),

        togglePreview: () =>
          set((state) => ({ showPreview: !state.showPreview })),

        reset: () => set(initialState),

        generatePoster: async () => {
          const state = get();

          // Validate required fields
          if (
            !state.athletePhoto ||
            !state.athleteName.trim() ||
            !state.beltRank ||
            !state.tournament.trim() ||
            !state.selectedTemplateId
          ) {
            throw new Error('Missing required fields');
          }

          set({ isGenerating: true, generationProgress: 0 });

          try {
            const result = await generatePosterApi(
              {
                athletePhoto: state.athletePhoto,
                athleteName: state.athleteName,
                beltRank: state.beltRank,
                team: state.team || undefined,
                tournament: state.tournament,
                date: state.date || undefined,
                location: state.location || undefined,
                templateId: state.selectedTemplateId,
              },
              (progress) => set({ generationProgress: progress })
            );

            set({ isGenerating: false, generationProgress: 0 });
            return result;
          } catch (error) {
            set({ isGenerating: false, generationProgress: 0 });
            throw error;
          }
        },

        loadFromPoster: (data) =>
          set({
            athletePhoto: null,
            athleteName: data.athleteName,
            beltRank: data.beltRank,
            team: data.team ?? '',
            tournament: data.tournament,
            date: data.date ?? '',
            location: data.location ?? '',
            selectedTemplateId: data.templateId,
            isGenerating: false,
            generationProgress: 0,
          }),

        initializeForFirstVisit: () => {
          const state = get();
          // Only initialize if fields are still default/empty
          if (
            state.athleteName === '' &&
            state.beltRank === 'white' &&
            state.tournament === '' &&
            state.selectedTemplateId === null
          ) {
            set({
              athleteName: 'Your Name Here',
              beltRank: 'black',
              tournament: 'Your Tournament',
              selectedTemplateId: 'template-1',
            });
          }
        },
      }),
      {
        name: 'poster-builder-draft',
        partialize: (state) => ({
          athleteName: state.athleteName,
          beltRank: state.beltRank,
          team: state.team,
          tournament: state.tournament,
          date: state.date,
          location: state.location,
          selectedTemplateId: state.selectedTemplateId,
        }),
        // skipHydration prevents SSR mismatch in Next.js.
        // Call usePosterBuilderStore.persist.rehydrate() in a client component
        // (e.g., useEffect in app/layout.tsx or a dedicated StoreHydration component)
        skipHydration: true,
      }
    ),
    { name: 'PosterBuilderStore' }
  )
);
