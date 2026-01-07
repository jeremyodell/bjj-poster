'use client';

interface TemplateSkeletonProps {
  count?: number;
}

export function TemplateSkeleton({ count = 1 }: TemplateSkeletonProps): JSX.Element {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          data-testid="template-skeleton"
          className="animate-pulse rounded-lg bg-gray-700"
        >
          <div className="aspect-[3/4] w-full rounded-t-lg bg-gray-600" />
          <div className="p-3">
            <div className="h-4 w-3/4 rounded bg-gray-600" />
          </div>
        </div>
      ))}
    </>
  );
}
