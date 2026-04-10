import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deleteMatch, saveMatch } from "@/lib/api";
import {
  clearAdminSession,
  decodeGoogleCredential,
  getAdminEmails,
  getGoogleClientId,
  getStoredAdminSession,
  isAllowedAdminEmail,
  loadGoogleIdentityScript,
  storeAdminSession,
  type AdminSession,
} from "@/lib/adminAuth";
import {
  useAllMatches,
  useConfigs,
  useFactions,
  useTableTimeSlots,
  useTables,
} from "@/hooks/useGameData";
import { MatchEditorModal } from "@/components/MatchEditorModal";
import { ResultModal } from "@/components/ResultModal";
import { SiteLoading } from "@/components/SiteLoading";
import { useToast } from "@/hooks/use-toast";
import type { ParsedMatch } from "@/types";

function formatDuration(duration: string) {
  return duration === "TODO_EL_DIA" ? "TODO EL DIA" : duration || "Sin duracion";
}

function formatDateLabel(value: string) {
  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

interface MatchContext {
  gameId: string;
  match: ParsedMatch;
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: configs, isLoading: configsLoading } = useConfigs();
  const { data: tables = [] } = useTables();
  const { data: tableTimeSlots = [] } = useTableTimeSlots();
  const { data: allMatches = {} } = useAllMatches(
    configs?.map((config) => config.gameId) || []
  );
  const [session, setSession] = useState<AdminSession | null>(() =>
    getStoredAdminSession()
  );
  const [selectedEditContext, setSelectedEditContext] =
    useState<MatchContext | null>(null);
  const [selectedResultContext, setSelectedResultContext] =
    useState<MatchContext | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [loginState, setLoginState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [loginError, setLoginError] = useState("");
  const [loginNonce, setLoginNonce] = useState(0);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (googleButtonRef.current) {
      setLoginNonce((v) => v + 1);
    }
  }, []);

  const clientId = getGoogleClientId();
  const adminEmails = getAdminEmails();
  const selectedEditGameId = selectedEditContext?.gameId;
  const currentEditConfig = configs?.find(
    (config) => config.gameId === selectedEditGameId
  );
  const { data: factions = [] } = useFactions(selectedEditGameId || undefined);

  useEffect(() => {
    if (session && !isAllowedAdminEmail(session.email)) {
      clearAdminSession();
      setSession(null);
    }
  }, [session]);

  useEffect(() => {
    if (!clientId || session) {
      return;
    }

    let cancelled = false;
    let renderAttempts = 0;
    setLoginState("loading");
    setLoginError("");

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled) {
          return;
        }

        if (!window.google?.accounts?.id || !googleButtonRef.current) {
          setLoginState("error");
          setLoginError(
            "Google Identity Services no quedo disponible en el navegador."
          );
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const parsed = response.credential
              ? decodeGoogleCredential(response.credential)
              : null;

            if (!parsed) {
              toast({
                title: "Login invalido",
                description: "No se pudo leer la cuenta de Google.",
                variant: "destructive",
              });
              setLoginState("error");
              setLoginError("Google devolvio una credencial invalida.");
              return;
            }

            if (!isAllowedAdminEmail(parsed.email)) {
              toast({
                title: "Acceso denegado",
                description: "Esta cuenta no esta autorizada para gestion.",
                variant: "destructive",
              });
              setLoginState("error");
              setLoginError("La cuenta de Google no esta autorizada para gestion.");
              return;
            }

            storeAdminSession(parsed);
            setSession(parsed);
          },
        });

        const renderButton = () => {
          if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) {
            return;
          }

          googleButtonRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "outline",
            size: "large",
            width: 280,
            text: "signin_with",
            shape: "pill",
          });

          window.setTimeout(() => {
            if (cancelled || !googleButtonRef.current) {
              return;
            }

            if (googleButtonRef.current.childElementCount > 0) {
              setLoginState("ready");
              return;
            }

            renderAttempts += 1;
            if (renderAttempts < 6) {
              renderButton();
              return;
            }

            setLoginState("error");
            setLoginError("Google cargo, pero no pudo dibujar el boton de acceso.");
          }, 180);
        };

        renderButton();
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo cargar el login de Google.";
        setLoginState("error");
        setLoginError(message);
        toast({
          title: "Google no disponible",
          description: message,
          variant: "destructive",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, loginNonce, session, toast]);

  const effectiveTimeSlots = useMemo(() => {
    if (tableTimeSlots.length > 0) {
      return tableTimeSlots;
    }

    return Array.from(
      new Set(
        Object.values(allMatches)
          .flat()
          .map((match) => match.time)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
      )
    );
  }, [allMatches, tableTimeSlots]);

  const gameSections = useMemo(
    () =>
      (configs || []).map((config) => ({
        config,
        matches: [...(allMatches[config.gameId] || [])].sort((a, b) => {
          const dateComparison = a.date.localeCompare(b.date);
          if (dateComparison !== 0) {
            return dateComparison;
          }

          return a.time.localeCompare(b.time);
        }),
      })),
    [allMatches, configs]
  );

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["allMatches"] });
    queryClient.invalidateQueries({ queryKey: ["matches"] });
  }, [queryClient]);

  const handleDelete = useCallback(
    async (gameId: string, match: ParsedMatch) => {
      if (!window.confirm("Eliminar partido?")) {
        return;
      }

      const key = `${gameId}-${match.id}`;
      setBusyKey(key);
      const success = await deleteMatch(gameId, match.id);
      setBusyKey(null);

      if (success) {
        toast({ title: "Partido eliminado" });
        refresh();
        return;
      }

      toast({
        title: "Error",
        description: "No se pudo eliminar el partido",
        variant: "destructive",
      });
    },
    [refresh, toast]
  );

  const handleCancelReservation = useCallback(
    async (gameId: string, match: ParsedMatch) => {
      const key = `${gameId}-${match.id}`;
      setBusyKey(key);
      const success = await saveMatch(gameId, {
        ...match,
        tableId: "",
        tableSize: "",
        reserveTable: false,
      });
      setBusyKey(null);

      if (success) {
        toast({ title: "Reserva cancelada" });
        refresh();
        return;
      }

      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva",
        variant: "destructive",
      });
    },
    [refresh, toast]
  );

  if (configsLoading) {
    return <SiteLoading message="Cargando gestion..." />;
  }

  if (!clientId || adminEmails.length === 0) {
    return (
      <div className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-6 text-amber-100">
          <h1 className="font-heading text-lg tracking-[0.18em] text-gold-light">
            GESTION
          </h1>
          <p className="mt-3 text-sm leading-6">
            Falta configurar `VITE_GOOGLE_CLIENT_ID` y `VITE_ADMIN_EMAILS`.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-black/25 p-6">
          <h1 className="font-heading text-lg tracking-[0.18em] text-gold-light">
            GESTION
          </h1>
          <div className="mt-5 rounded-[24px] border border-white/8 bg-black/20 p-5">
            <p className="text-sm text-foreground">
              Inicia sesion con Google para entrar al panel de gestion.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Solo entran las cuentas listadas en `VITE_ADMIN_EMAILS`.
            </p>

            <div className="mt-5 rounded-[20px] border border-gold/15 bg-black/30 p-4">
              <div
                className="flex min-h-[52px] items-center justify-center"
                ref={googleButtonRef}
              />

              {loginState === "loading" && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Cargando acceso de Google...
                </p>
              )}

              {loginState === "ready" &&
                googleButtonRef.current?.childElementCount === 0 && (
                  <div className="mt-3 space-y-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      Google respondio, pero el boton no se mostro todavia.
                    </p>
                    <button
                      type="button"
                      onClick={() => setLoginNonce((value) => value + 1)}
                      className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-heading tracking-[0.16em] text-white"
                    >
                      VOLVER A INTENTAR
                    </button>
                  </div>
                )}

              {loginState === "error" && (
                <div className="mt-3 space-y-3 text-center">
                  <p className="text-xs text-red-200">
                    {loginError || "No se pudo mostrar el acceso con Google."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setLoginNonce((value) => value + 1)}
                    className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-heading tracking-[0.16em] text-white"
                  >
                    REINTENTAR
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* <div className="mt-4 rounded-[22px] border border-amber-500/15 bg-amber-500/10 p-4 text-xs text-amber-100">
            Si acabas de agregar `VITE_GOOGLE_CLIENT_ID` o `VITE_ADMIN_EMAILS` en
            `.env`, reinicia `npm run dev`.
          </div> */}

          <p className="mt-4 text-xs text-muted-foreground">
            Este acceso usa login de Google del lado cliente. No es un login real y tus datos no se guardan en ningun lado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[28px] border border-white/10 bg-black/25 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-heading text-lg tracking-[0.18em] text-gold-light">
                GESTION
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Conectado como {session.email}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                clearAdminSession();
                setSession(null);
              }}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-heading tracking-[0.18em] text-muted-foreground transition-colors hover:text-white"
            >
              CERRAR SESION
            </button>
          </div>
        </section>

        {gameSections.map(({ config, matches }) => (
          <section
            key={config.gameId}
            className="rounded-[28px] border border-white/10 bg-black/25 p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-sm tracking-[0.24em] text-gold-light">
                  {config.displayName}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {matches.length} {matches.length === 1 ? "partido" : "partidos"}
                </p>
              </div>
            </div>

            {matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay partidos cargados para este juego.
              </p>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => {
                  const key = `${config.gameId}-${match.id}`;

                  return (
                    <div
                      key={key}
                      className="rounded-[24px] border border-white/8 bg-black/20 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-heading tracking-[0.16em] text-white">
                            {match.playerA}
                            {match.playerB ? ` vs ${match.playerB}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateLabel(match.date)} | {match.time} |{" "}
                            {formatDuration(match.duration)} |{" "}
                            {match.tableSize || "Sin reserva"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedResultContext({
                                gameId: config.gameId,
                                match,
                              })
                            }
                            className="rounded-full border border-amber-500/30 bg-black/30 px-3 py-1.5 text-xs font-heading tracking-[0.16em] text-amber-200"
                          >
                            RESULTADO
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedEditContext({
                                gameId: config.gameId,
                                match,
                              })
                            }
                            className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-heading tracking-[0.16em] text-white"
                          >
                            EDITAR
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelReservation(config.gameId, match)}
                            disabled={!match.tableId || busyKey === key}
                            className="rounded-full border border-red-500/25 bg-black/30 px-3 py-1.5 text-xs font-heading tracking-[0.16em] text-red-200 disabled:opacity-40"
                          >
                            QUITAR RESERVA
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(config.gameId, match)}
                            disabled={busyKey === key}
                            className="rounded-full border border-red-500/40 bg-red-950/20 px-3 py-1.5 text-xs font-heading tracking-[0.16em] text-red-200 disabled:opacity-40"
                          >
                            ELIMINAR
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}

        {selectedEditContext && currentEditConfig && (
          <MatchEditorModal
            match={selectedEditContext.match}
            gameId={selectedEditContext.gameId}
            config={currentEditConfig}
            factions={factions}
            tables={tables}
            timeSlots={effectiveTimeSlots}
            allMatches={allMatches}
            onClose={() => setSelectedEditContext(null)}
            onSuccess={refresh}
          />
        )}

        {selectedResultContext && (
          <ResultModal
            match={selectedResultContext.match}
            gameId={selectedResultContext.gameId}
            onClose={() => setSelectedResultContext(null)}
            onSuccess={refresh}
          />
        )}
      </div>
    </div>
  );
}
