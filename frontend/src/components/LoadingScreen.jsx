const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center auth-bg">
    <div className="text-center text-white">
      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-xl font-medium">Loading SnapShare...</p>
    </div>
  </div>
);

export default LoadingScreen;
