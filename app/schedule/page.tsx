import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ScheduleView } from '@/components/schedule/schedule-view';

export const metadata: Metadata = {
  title: 'Schedule — Atlasat',
  description: 'Football fixtures and the channels or platforms broadcasting each match.',
};

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <ScheduleView />
    </Suspense>
  );
}
