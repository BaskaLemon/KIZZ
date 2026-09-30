const THICKNESS = 16; // px, front face to back face
const EDGE_LAYERS = 12; // stacked discs that form the coin's rim

/** Centered spinning Kizz coin, built as a real 3D disc: front and back faces
 * (the JPEG cropped to a circle — the coin fills ~83% of the image, so 122%
 * scale hides its white background) with a stack of gold discs between them
 * forming the rim, so it has thickness instead of looking like flat paper. */
export function LoadingScreen({ fullScreen = false }: { fullScreen?: boolean }) {
  const half = THICKNESS / 2;
  const face = (
    <img
      src="/kizz-coin.jpeg"
      alt=""
      className="max-w-none shrink-0"
      style={{ width: '122%', height: '122%' }}
    />
  );

  return (
    <div
      role="status"
      aria-label="Ачаалж байна"
      className={
        fullScreen
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-paper'
          : 'flex min-h-[calc(100vh-8rem)] items-center justify-center'
      }
      style={{ perspective: '900px' }}
    >
      <div className="coin3d relative h-24 w-24">
        {/* rim */}
        {Array.from({ length: EDGE_LAYERS }, (_, i) => {
          const z = -half + ((i + 1) * THICKNESS) / (EDGE_LAYERS + 1);
          return (
            <div
              key={i}
              className="absolute inset-0 rounded-full"
              style={{
                transform: `translateZ(${z}px)`,
                background: i % 2 ? '#c8961c' : '#deaa25',
              }}
            />
          );
        })}
        {/* front */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full"
          style={{ transform: `translateZ(${half}px)`, backfaceVisibility: 'hidden' }}
        >
          {face}
        </div>
        {/* back */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full"
          style={{
            transform: `rotateY(180deg) translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
          }}
        >
          {face}
        </div>
      </div>
    </div>
  );
}
