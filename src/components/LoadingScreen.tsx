/** Centered spinning Buzz coin. The JPEG has a white background around the
 * coin, so it is cropped to a circle just inside the coin's edge (the coin
 * fills ~83% of the image width) — no white ring in light or dark mode. */
export function LoadingScreen({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      role="status"
      aria-label="Ачаалж байна"
      className={
        fullScreen
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-paper'
          : 'flex min-h-[calc(100vh-8rem)] items-center justify-center'
      }
    >
      <div className="coin-spin flex h-24 w-24 items-center justify-center overflow-hidden rounded-full">
        <img
          src="/buzz-coin.jpeg"
          alt=""
          className="max-w-none shrink-0"
          style={{ width: '122%', height: '122%' }}
        />
      </div>
    </div>
  );
}
