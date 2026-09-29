import { Suspense } from 'react';
import { Shell } from '@/components/Shell';
import { LoadingScreen } from '@/components/LoadingScreen';
import ClassroomView from './ClassroomView';

export default function ClassroomPage() {
  return (
    <Suspense
      fallback={
        <Shell activePath="/classroom">
          <LoadingScreen />
        </Shell>
      }
    >
      <ClassroomView />
    </Suspense>
  );
}
