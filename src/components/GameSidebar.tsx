import { Link, useLocation, useParams } from "react-router-dom";
import { useConfigs } from "@/hooks/useGameData";
import { ArrowLeft, Heart, Swords, X } from "lucide-react";
import { useEffect, useState } from "react";

export function GameSidebar() {
  const { data: configs } = useConfigs();
  const { gameId } = useParams();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdminRoute = location.pathname === "/gestion";

  useEffect(() => {
    const handleOpenSidebar = () => setMobileOpen(true);
    window.addEventListener("open-mobile-sidebar", handleOpenSidebar);

    return () => {
      window.removeEventListener("open-mobile-sidebar", handleOpenSidebar);
    };
  }, []);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[19rem] border-r border-sidebar-border/80 bg-[linear-gradient(180deg,rgba(12,15,24,0.97),rgba(7,8,14,0.94))] shadow-[0_0_90px_rgba(0,0,0,0.35)] transition-transform duration-300 lg:relative lg:z-auto lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:flex`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(180,28,36,0.2),transparent_26%),linear-gradient(180deg,transparent,rgba(0,0,0,0.2))]" />

        <div className="relative flex h-full w-full flex-col">
          <div className="border-b border-sidebar-border/80 px-4 pb-5 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-red-500/30 bg-black/35 shadow-[0_0_24px_rgba(180,28,36,0.18)]">
                  <img
                    src="/images/logoclub.webp"
                    alt="Horda de Plata"
                    className="h-8 w-8 object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <p className="font-heading text-[11px] tracking-[0.35em] text-red-300/80">
                    HORDA DE PLATA
                  </p>
                  <h1 className="font-heading text-lg tracking-[0.18em] text-gold-light">
                    {isAdminRoute ? "GESTION" : "WARGAMES"}
                  </h1>
                </div>
              </div>

              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-white/10 p-2 text-muted-foreground transition-colors hover:text-white lg:hidden"
                aria-label="Cerrar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            {isAdminRoute ? (
              <div className="space-y-3">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="site-panel group flex items-center gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] px-3 py-3 transition-all duration-200 hover:border-red-400/30 hover:bg-white/[0.05]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-black/35">
                    <ArrowLeft className="h-5 w-5 text-gold-light" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm tracking-[0.18em] text-white">
                      Volver al sitio principal
                    </p>
                  </div>

                  <div className="h-10 w-1 rounded-full bg-transparent transition-colors group-hover:bg-red-400/40" />
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-3 px-2">
                  <p className="font-heading text-[11px] tracking-[0.34em] text-muted-foreground">
                    JUEGOS
                  </p>
                </div>

                <nav className="space-y-3">
                  {configs?.map((config) => {
                    const active = gameId === config.gameId;

                    return (
                      <Link
                        key={config.gameId}
                        to={`/game/${config.gameId}`}
                        onClick={() => setMobileOpen(false)}
                        className={`site-panel group flex items-center gap-4 rounded-[24px] border px-3 py-3 transition-all duration-200 ${
                          active
                            ? "border-gold/50 bg-gradient-to-r from-red-950/60 via-black/55 to-black/45 shadow-[0_18px_38px_rgba(0,0,0,0.28)]"
                            : "border-white/8 bg-white/[0.03] hover:border-red-400/30 hover:bg-white/[0.05]"
                        }`}
                      >
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border ${
                            active
                              ? "border-gold/50 bg-black/45"
                              : "border-white/10 bg-black/35"
                          }`}
                        >
                          {config.logo ? (
                            <img
                              src={config.logo}
                              alt={config.displayName}
                              className="h-10 w-10 object-contain"
                            />
                          ) : (
                            <Swords className="h-5 w-5 text-gold-light" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate font-heading text-sm tracking-[0.18em] ${
                              active ? "text-gold-light" : "text-white"
                            }`}
                          >
                            {config.displayName}
                          </p>
                        </div>

                        <div
                          className={`h-10 w-1 rounded-full transition-colors ${
                            active
                              ? "bg-gold-light"
                              : "bg-transparent group-hover:bg-red-400/40"
                          }`}
                        />
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
          </div>

          <div className="border-t border-sidebar-border/80 px-4 py-4">
            <div className="site-panel rounded-[22px] border border-red-500/20 bg-red-950/10 px-4 py-3 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <span>Hecho con</span>
                <Heart className="h-3.5 w-3.5 fill-current text-red-300" />
                <span>por Metagesa</span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
