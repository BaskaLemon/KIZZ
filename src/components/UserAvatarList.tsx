import { avatarOptionsForUser, generateAvatarUri } from '../lib/avatar';

export interface Collaborator {
  id: string;
  name: string;
}

// Collaborators only carry an id/name from the API — there's no stored
// avatar per user, so derive the same deterministic per-id look used for
// the logged-in account's own avatar (see useAvatar.ts).
function avatarFor(id: string): string {
  return generateAvatarUri(avatarOptionsForUser(id));
}

export function UserAvatarList({
  collaborators,
  max = 4,
  showNames = false,
}: {
  collaborators: Collaborator[];
  max?: number;
  showNames?: boolean;
}) {
  const visible = collaborators.slice(0, max);
  const overflow = collaborators.length - visible.length;

  if (showNames) {
    return (
      <div className="flex flex-col gap-2.5">
        {collaborators.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5">
            <img
              src={avatarFor(c.id)}
              alt={c.name}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-ink">{c.name}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2.5">
        {visible.map((c) => (
          <img
            key={c.id}
            src={avatarFor(c.id)}
            alt={c.name}
            title={c.name}
            className="h-8 w-8 rounded-full border-2 border-paper-raised object-cover"
          />
        ))}
        {overflow > 0 && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-paper-raised bg-ink text-xs font-semibold text-white">
            +{overflow}
          </span>
        )}
      </div>
      <span className="ml-3 text-xs font-semibold text-ink-soft">
        {collaborators.length} гишүүн
      </span>
    </div>
  );
}
