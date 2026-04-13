import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient.js";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen.jsx";

const fetchTopSellers = async () => {
  const response = await apiClient.get(`/games/landingpage`);
  return response.data;
};

function LandingPage() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const {
    data: games = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["landingGames"],
    queryFn: fetchTopSellers,
    staleTime: 1000 * 60 * 5,
    retry: 2
  });

  // Auto-scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollSpeed = 1;

    const interval = setInterval(() => {
      if (!container) return;

      if (
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth - 1
      ) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft += scrollSpeed;
      }
    }, 20);

    return () => clearInterval(interval);
  }, [games]);

  if (isLoading) return <LoadingScreen />;

  if (isError) {
    return (
      <div className="page-container">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="card-surface p-8 text-center animate-fade-in">
            <p className="text-text-secondary text-lg">
              {error?.message || "Failed to load games"}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />

      <main className="flex-1">

        {/* HERO SECTION */}
        <section className="relative bg-gradient-to-b from-midnight-900 via-midnight-800 to-midnight-800 py-10 sm:py-14 lg:py-18 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* CAROUSEL */}
            <div
              ref={scrollRef}
              className="
                flex gap-8 sm:gap-8
                overflow-x-auto overflow-y-hidden
                pb-4
                scrollbar-hide
                items-stretch
                relative
              "
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {games.map(([src, redirect], index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/games/${redirect}`)}
                  className="
                    group relative flex-shrink-0
                    w-32 sm:w-36 md:w-44 lg:w-48
                    hover:w-56 sm:hover:w-64 md:hover:w-72 lg:hover:w-80
                    transition-all duration-500 ease-out
                    cursor-pointer
                    overflow-visible
                  "
                  style={{
                    marginRight: "-20px", // 👈 creates overlap / peek effect
                  }}
                >
                  {/* Glow border */}
                  <div
                    className="
                      absolute -inset-[2px] rounded-xl
                      bg-gradient-to-r from-accent via-accent-glow to-blue-400
                      opacity-0 group-hover:opacity-100
                      blur-sm transition-all duration-500
                    "
                  />

                  {/* Card */}
                  <div
                    className="
                      relative rounded-xl overflow-hidden
                      border border-midnight-500/40
                      bg-midnight-900
                      transition-all duration-500
                      group-hover:border-accent/40
                      shadow-lg
                    "
                  >
                    {/* IMAGE (fixed height only) */}
                    <div className="h-64 sm:h-72 md:h-80 lg:h-96 w-full overflow-hidden">
                      <img
                        src={src}
                        alt={`Game ${index + 1}`}
                        loading="lazy"
                        className="
                          w-full h-full object-cover
                          transition-transform duration-500 ease-out
                          group-hover:scale-110
                        "
                      />
                    </div>

                    {/* overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* CONTENT SECTION */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 animate-slide-up">

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-accent via-accent-glow to-blue-300 bg-clip-text text-transparent">
                Welcome to My GameHub
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Manage your games and explore their features across all platforms
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto pt-4">

              {/* Library */}
              <div
                className="group card-surface p-6 sm:p-8 cursor-pointer text-center
                           hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1
                           transition-all duration-300"
                onClick={() => navigate("/library")}
              >
                <div className="text-4xl mb-4">📚</div>
                <h2 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors mb-2">
                  My Library
                </h2>
                <p className="text-sm text-text-secondary">
                  View and manage your owned games in a personalized hub
                </p>
              </div>

              {/* Browse */}
              <div
                className="group card-surface p-6 sm:p-8 cursor-pointer text-center
                           hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1
                           transition-all duration-300"
                onClick={() => navigate("/games")}
              >
                <div className="text-4xl mb-4">🎮</div>
                <h2 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors mb-2">
                  Browse Games
                </h2>
                <p className="text-sm text-text-secondary">
                  Browse games across platforms and compare prices
                </p>
              </div>

            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;