import { createAvatar } from '@dicebear/core';
import * as collection from '@dicebear/collection';

/** Renders a shop avatar preset to SVG on the server, so the app doesn't
 * depend on api.dicebear.com being up. A preset's `value` is a DiceBear API
 * URL (`…/<style>/svg?backgroundColor=a,b`) used purely as its config: the
 * style comes from the path, the options from the query string. `seed` makes
 * the same style look different per user. */
export function renderPresetAvatar(value: string, seed: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  // /10.x/big-ears/svg  ->  bigEars
  const styleName = url.pathname.split('/').filter(Boolean).at(-2);
  if (!styleName) return null;
  const key = styleName.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  const style = (collection as unknown as Record<string, unknown>)[key];
  if (!style) return null;

  const options: Record<string, unknown> = { seed };
  for (const [name, raw] of url.searchParams) {
    if (name === 'backgroundColorFill') {
      options.backgroundType = [raw === 'linear' ? 'gradientLinear' : 'solid'];
    } else if (name === 'backgroundColorAngle') {
      options.backgroundRotation = [Number(raw)];
    } else if (/Probability$/.test(name) || name === 'scale') {
      options[name] = Number(raw);
    } else {
      options[name] = raw.split(',');
    }
  }
  return createAvatar(style as never, options as never).toString();
}
