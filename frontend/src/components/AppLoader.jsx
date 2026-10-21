import BrandName from "./BrandName";

// Full-screen loader while the app waits for its first data (the Render backend can take ~50 s to wake up).
export default function AppLoader() {
  return (
    <div className="app-loader" role="status">
      <img className="app-loader-logo" src="/icons/logo-transparent.png" alt="" />
      <BrandName className="app-loader-title" shimmer />
      <p className="app-loader-text">Ładowanie aplikacji...</p>
    </div>
  );
}
