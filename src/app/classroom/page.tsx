import { Suspense } from 'react';
import ClassroomView from './ClassroomView';

export default function ClassroomPage() {
  return (
    <Suspense fallback={null}>
      <ClassroomView />
    </Suspense>
  );
}
