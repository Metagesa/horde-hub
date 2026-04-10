import type { GameConfig, GameTable, ParsedMatch } from "@/types";
import { RegistrationForm } from "@/components/RegistrationForm";

interface MatchEditorModalProps {
  match: ParsedMatch;
  gameId: string;
  config: GameConfig;
  factions: Array<{ faction: string }>;
  tables: GameTable[];
  timeSlots: string[];
  allMatches: Record<string, ParsedMatch[]>;
  onClose: () => void;
  onSuccess: () => void;
}

export function MatchEditorModal({
  match,
  gameId,
  config,
  factions,
  tables,
  timeSlots,
  allMatches,
  onClose,
  onSuccess,
}: MatchEditorModalProps) {
  const filteredMatches = Object.fromEntries(
    Object.entries(allMatches).map(([currentGameId, matches]) => [
      currentGameId,
      matches.filter((item) => item.id !== match.id),
    ])
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-t-[28px] sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <RegistrationForm
          gameId={gameId}
          config={config}
          factions={factions}
          tables={tables}
          timeSlots={timeSlots}
          allMatches={filteredMatches}
          initialMatch={match}
          title="EDITAR PARTIDO"
          submitLabel="GUARDAR CAMBIOS"
          onCancel={onClose}
          onSuccess={onSuccess}
          className="max-h-[100dvh] overflow-y-auto rounded-t-[28px] pb-4 sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px]"
          stickyActions
        />
      </div>
    </div>
  );
}
