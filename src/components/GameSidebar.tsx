import { Link, useParams } from "react-router-dom";
import { useConfigs } from "@/hooks/useGameData";
import { Swords, Menu, X } from "lucide-react";
import { useState } from "react";

export function GameSidebar() {
  const { data: configs, isLoading } = useConfigs();
  const { gameId } = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden glass-surface p-2"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5 text-gold" />
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 glass-surface-strong flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:z-auto`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-gold" />
            <h1 className="text-gold font-heading text-lg tracking-widest">WARGAMES</h1>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Game list */}
        <nav className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            configs?.map((config) => {
              const active = gameId === config.gameId;
              return (
                <Link
                  key={config.gameId}
                  to={`/game/${config.gameId}`}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 mb-1 font-heading text-sm tracking-wider uppercase transition-all duration-200 ${
                    active
                      ? "bg-gold/20 text-gold border-l-2 border-gold"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Swords className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {config.displayName}
                  </span>
                </Link>
              );
            })
          )}
        </nav>

        {/* Credits */}
        <div className="p-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Hecho por Metagesa ❤️ para la Horda de Plata
          </p>
        </div>
      </aside>
    </>
  );
}
