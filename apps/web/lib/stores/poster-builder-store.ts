import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black';

export interface PosterBuilderState {
  // Form data
  athletePhoto: File | null;
  athleteName: string;
  beltRank: BeltRank;
  team: string;
  tournament: string;
  date: string;
  location: string;
  selectedTemplateId: string | null;

  // UI state (not persisted)
  isGenerating: boolean;
  generationProgress: number;
  showAdvancedOptions: boolean;
  showPreview: boolean;
}

export interface PosterBuilderActions {
  setPhoto: (file: File | null) => void;
  setField: <K extends keyof PosterBuilderState>(
    key: K,
    value: PosterBuilderState[K]
  ) => void;
  setTemplate: (templateId: string | null) => void;
  setGenerating: (isGenerating: boolean, progress?: number) => void;
  toggleAdvancedOptions: () => void;
  togglePreview: () => void;
  reset: () => void;
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

export const usePosterBuilderStore = create<PosterBuilderStore>()(
  devtools(
    persist(
      (set) => ({
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
        skipHydration: true,
      }
    ),
    { name: 'PosterBuilderStore' }
  )
);
