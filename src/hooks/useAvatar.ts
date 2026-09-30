'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  AvatarOptions,
  DEFAULT_AVATAR_OPTIONS,
  avatarOptionsForUser,
  avatarSrcFor,
  generateAvatarUri,
} from '../lib/avatar';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';
import { ApiError } from '../lib/types';

export function useAvatar() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  // Server-backed (users.avatar_options) so it follows the account across
  // devices — not per-browser localStorage. Falls back to a deterministic
  // per-account look (not the shared default) for accounts that never
  // customized, so they still look distinct from one another.
  const options = useMemo(
    () => user?.avatarOptions ?? (user ? avatarOptionsForUser(user.id) : DEFAULT_AVATAR_OPTIONS),
    [user],
  );

  const saveOptions = useCallback(
    async (next: AvatarOptions) => {
      if (!user) return;
      setSaving(true);
      try {
        const { avatarOptions } = await api.updateAvatar(next);
        // Customizing means wearing your own avatar again.
        updateUser({ avatarOptions, equippedItemId: null });
      } catch (err) {
        toast(
          err instanceof ApiError ? err.message : 'Аватар хадгалахад алдаа гарлаа',
          'error',
        );
      } finally {
        setSaving(false);
      }
    },
    [user, updateUser, toast],
  );

  // Show the account's avatar only while actually logged in — logging out
  // reverts the nav avatar to the plain shared default.
  const avatarUri = useMemo(
    () => (user ? avatarSrcFor(user) : generateAvatarUri(DEFAULT_AVATAR_OPTIONS)),
    [user],
  );

  return { options, avatarUri, saveOptions, saving };
}
