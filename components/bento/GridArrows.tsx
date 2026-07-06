'use client';

type Props = {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
};

export function GridArrows({ onPrev, onNext, canPrev }: Props) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Previous set of project photos"
        className="rounded-full border border-ink/20 px-4 py-2 text-sm transition-opacity disabled:opacity-30"
      >
        &larr;
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next set of project photos"
        className="rounded-full border border-ink/20 px-4 py-2 text-sm"
      >
        &rarr;
      </button>
    </div>
  );
}
