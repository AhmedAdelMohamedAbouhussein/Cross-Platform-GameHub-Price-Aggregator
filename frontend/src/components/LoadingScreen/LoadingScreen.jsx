export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-midnight-900/95 backdrop-blur-md">
            {/* Spinner */}
            <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-midnight-600"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent animate-spin"></div>
            </div>
            {/* Brand */}
            <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent animate-pulse">
                My GameHub
            </h2>
            <p className="text-sm text-text-muted mt-2">Loading your game universe...</p>
        </div>
    );
}
