import { PosterBuilderForm } from '@/components/builder';

export default function BuilderPage(): JSX.Element {
  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-3xl text-white">Create Your Poster</h1>
      <p className="mt-2 text-primary-300">Fill in the details and generate your poster</p>

      <div className="mt-8">
        <PosterBuilderForm />
      </div>
    </div>
  );
}
