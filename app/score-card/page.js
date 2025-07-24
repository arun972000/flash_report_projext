// app/score-card/page.tsx
import { Suspense } from 'react';
import ScoreCard from './ScoreCard';

export default function ScoreCardPage() {
  return (
    <Suspense fallback={<div>Loading score card…</div>}>
      <ScoreCard />
    </Suspense>
  );
}
