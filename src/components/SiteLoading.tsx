interface SiteLoadingProps {
  message?: string;
}

export function SiteLoading({ message }: SiteLoadingProps) {
  return (
    <div className="min-h-screen w-full px-6 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <div className="glass-surface-strong site-panel relative w-full max-w-xl overflow-hidden p-8 text-center sm:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] border border-red-500/30 bg-black/40 shadow-[0_0_40px_rgba(180,28,36,0.18)]">
            <img
              src="/images/logoclub.png"
              alt="Horda de Plata"
              className="h-12 w-12 object-contain"
            />
          </div>

          <p className="text-sm font-heading tracking-[0.45em] text-red-300/80 sm:text-base">
            CARGANDO...
          </p>

          {message ? (
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              {message}
            </p>
          ) : null}

          <div className="mx-auto mt-8 flex max-w-[220px] items-center gap-3">
            <span className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-red-500/60" />
            <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_14px_rgba(212,162,67,0.9)] animate-pulse" />
            <span className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-red-500/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
