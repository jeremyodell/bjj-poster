import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from '../page';

describe('Landing Page', () => {
  describe('Hero Section', () => {
    it('renders the main headline', () => {
      render(<Home />);
      expect(
        screen.getByRole('heading', { level: 1, name: /create tournament posters in minutes/i })
      ).toBeInTheDocument();
    });

    it('renders the subheadline', () => {
      render(<Home />);
      expect(screen.getByText(/design professional bjj competition posters/i)).toBeInTheDocument();
    });

    it('renders the primary CTA button linking to signup', () => {
      render(<Home />);
      const ctaButtons = screen.getAllByRole('link', { name: /get started free/i });
      expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
      expect(ctaButtons[0]).toHaveAttribute('href', '/auth/signup');
    });

    it('renders the free badge', () => {
      render(<Home />);
      expect(screen.getByText(/free to use/i)).toBeInTheDocument();
    });

    it('renders 3 example poster images', () => {
      render(<Home />);
      const posterImages = screen.getAllByRole('img', { name: /example.*poster/i });
      expect(posterImages).toHaveLength(3);
    });
  });

  describe('How It Works Section', () => {
    it('renders the section heading', () => {
      render(<Home />);
      expect(screen.getByRole('heading', { level: 2, name: /how it works/i })).toBeInTheDocument();
    });

    it('renders all 3 steps', () => {
      render(<Home />);
      expect(screen.getByText(/upload photo/i)).toBeInTheDocument();
      expect(screen.getByText(/choose template/i)).toBeInTheDocument();
      expect(screen.getByText(/download.*share/i)).toBeInTheDocument();
    });
  });

  describe('Footer CTA Section', () => {
    it('renders the footer CTA heading', () => {
      render(<Home />);
      expect(screen.getByText(/ready to create your first poster/i)).toBeInTheDocument();
    });

    it('renders secondary CTA button linking to signup', () => {
      render(<Home />);
      const ctaButtons = screen.getAllByRole('link', { name: /get started free/i });
      expect(ctaButtons.length).toBeGreaterThanOrEqual(2);
      ctaButtons.forEach((button) => {
        expect(button).toHaveAttribute('href', '/auth/signup');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<Home />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThanOrEqual(1);
    });

    it('renders main landmark', () => {
      render(<Home />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('all images have alt text', () => {
      render(<Home />);
      const images = screen.getAllByRole('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });
});
