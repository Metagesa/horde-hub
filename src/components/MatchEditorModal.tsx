import type { GameConfig, GameTable, ParsedMatch } from "@/types";
import { RegistrationForm } from "@/components/RegistrationForm";

interface MatchEditorModalProps {
  match: ParsedMatch;
  gameId: string;
  config: GameConfig;
  factions: Array<{ faction: string }>;
  tables: GameTable[];
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <RegistrationForm
          gameId={gameId}
          config={config}
          factions={factions}
          tables={tables}
          allMatches={filteredMatches}
          initialMatch={match}
          title="EDITAR PARTIDO"
          submitLabel="GUARDAR CAMBIOS"
          onCancel={onClose}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
}
