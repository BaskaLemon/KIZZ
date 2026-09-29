import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface MyStats {
  groups: number;
  notes: number;
  quizzes: number;
}

/** Real counts for the signed-in user (null while loading / signed out). */
export function useMyStats(enabled: boolean): MyStats | null {
  const [stats, setStats] = useState<MyStats | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    Promise.all([
      api.myClasses().catch(() => []),
      api.listMyNotes().catch(() => []),
      api.listMyQuizzes().catch(() => []),
    ]).then(([groups, notes, quizzes]) => {
      if (!cancelled) {
        setStats({
          groups: groups.length,
          notes: notes.length,
          quizzes: quizzes.length,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return enabled ? stats : null;
}
