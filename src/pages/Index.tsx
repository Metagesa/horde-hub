import { Navigate } from "react-router-dom";
import { useConfigs } from "@/hooks/useGameData";

export default function Index() {
  const { data: configs } = useConfigs();

  if (configs && configs.length > 0) {
    return <Navigate to={`/game/${configs[0].gameId}`} replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground font-heading uppercase tracking-widest">
        NO HAY JUEGOS CONFIGURADOS
      </p>
    </div>
  );
}
