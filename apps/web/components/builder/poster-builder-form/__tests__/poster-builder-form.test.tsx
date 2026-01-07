import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosterBuilderForm } from '../poster-builder-form';

// Mock all child components
vi.mock('@/components/builder', () => ({
  PhotoUploadZone: () => <div data-testid="photo-upload-zone">Photo Upload</div>,
  AthleteInfoFields: () => <div data-testid="athlete-info-fields">Athlete Info</div>,
  TournamentInfoFields: () => <div data-testid="tournament-info-fields">Tournament Info</div>,
  TemplateSelector: () => <div data-testid="template-selector">Template Selector</div>,
}));

vi.mock('../generate-button', () => ({
  GenerateButton: () => <div data-testid="generate-button">Generate Button</div>,
}));

vi.mock('../floating-preview-button', () => ({
  FloatingPreviewButton: () => <div data-testid="floating-preview-button">Preview Button</div>,
}));

vi.mock('../preview-modal', () => ({
  PreviewModal: () => <div data-testid="preview-modal">Preview Modal</div>,
}));

describe('PosterBuilderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PhotoUploadZone', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('photo-upload-zone')).toBeInTheDocument();
  });

  it('renders AthleteInfoFields', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('athlete-info-fields')).toBeInTheDocument();
  });

  it('renders TournamentInfoFields', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('tournament-info-fields')).toBeInTheDocument();
  });

  it('renders TemplateSelector', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('template-selector')).toBeInTheDocument();
  });

  it('renders GenerateButton', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('generate-button')).toBeInTheDocument();
  });

  it('renders FloatingPreviewButton', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('floating-preview-button')).toBeInTheDocument();
  });

  it('renders PreviewModal', () => {
    render(<PosterBuilderForm />);
    expect(screen.getByTestId('preview-modal')).toBeInTheDocument();
  });

  it('has sticky bottom container for generate button on mobile', () => {
    render(<PosterBuilderForm />);

    const generateButtonWrapper = screen.getByTestId('generate-button-wrapper');
    expect(generateButtonWrapper).toHaveClass('sticky');
    expect(generateButtonWrapper).toHaveClass('bottom-0');
  });
});
