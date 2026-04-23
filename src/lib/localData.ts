import type { GameConfig, GameTable } from "@/types";

export interface LocalFaction {
  gameId: string;
  faction: string;
  image: string;
  color: string;
}

type RawGame = {
  gameId: string;
  displayName?: string;
  logo?: string;
  backgroundImage?: string;
  matchSize?: string;
  estimatedDuration?: string;
};

const FALLBACK_KILL_TEAM_GAME_ID = "kill-team";

const FALLBACK_KILL_TEAM_GAME: RawGame = {
  gameId: FALLBACK_KILL_TEAM_GAME_ID,
  displayName: "Kill Team",
  logo: "",
  backgroundImage: "",
  matchSize: "76x56",
  estimatedDuration: "02:00",
};

const FALLBACK_KILL_TEAM_FACTIONS: LocalFaction[] = [
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Kommandos", image: "", color: "#15803d" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Death Korps", image: "", color: "#6b7280" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Novitiates", image: "", color: "#991b1b" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Pathfinders", image: "", color: "#0f766e" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Legionaries", image: "", color: "#7f1d1d" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Corsair Voidscarred", image: "", color: "#4338ca" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Blooded", image: "", color: "#b91c1c" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Phobos Strike Team", image: "", color: "#1d4ed8" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Void-dancer Troupe", image: "", color: "#7c3aed" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Warpcoven", image: "", color: "#0369a1" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Wyrmblade", image: "", color: "#9333ea" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Hunter Clade", image: "", color: "#b91c1c" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Gellerpox Infected", image: "", color: "#4d7c0f" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Elucidian Starstriders", image: "", color: "#0284c7" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Angels of Death", image: "", color: "#1e3a8a" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Imperial Navy Breachers", image: "", color: "#0f172a" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Farstalker Kinband", image: "", color: "#65a30d" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Kasrkin", image: "", color: "#4d7c0f" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Hierotek Circle", image: "", color: "#16a34a" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Exaction Squad", image: "", color: "#475569" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Hand of the Archon", image: "", color: "#4c1d95" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Fellgor Ravagers", image: "", color: "#78350f" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Hearthkyn Salvagers", image: "", color: "#0f766e" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Chaos Cult", image: "", color: "#7f1d1d" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Inquisitorial Agents", image: "", color: "#ca8a04" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Blades of Khaine", image: "", color: "#eab308" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Scout Squad", image: "", color: "#1d4ed8" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Nemesis Claw", image: "", color: "#111827" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Mandrakes", image: "", color: "#1e1b4b" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Brood Brothers", image: "", color: "#a21caf" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Hernkyn Yaegirs", image: "", color: "#0f766e" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Tempestus Aquilons", image: "", color: "#1d4ed8" },
  { gameId: FALLBACK_KILL_TEAM_GAME_ID, faction: "Vespid Stingwings", image: "", color: "#d97706" },
];

const RAW_GAMES: RawGame[] = [
  {
    gameId: "guild-ball",
    displayName: "Guild Ball",
    logo: "/images/games/GuildBall/logo.png",
    backgroundImage: "/images/games/GuildBall/background.jpg",
    matchSize: "90x90",
    estimatedDuration: "02:00",
  },
  {
    gameId: "test",
    displayName: "Testeame esta",
    logo: "https://img.freepik.com/vector-gratis/lindo-pato-blanco_1308-41058.jpg?semt=ais_hybrid&w=740&q=80",
    backgroundImage: "https://kinderlandar.vtexassets.com/arquivos/ids/196930/D_NQ_NP_2X_777427-MLA80653265765_112024-F.webp.webp?v=638723923388670000",
    matchSize: "50x50",
    estimatedDuration: "00:30",
  },
  {
    gameId: "warhammer-40k",
    displayName: "Warhammer 40,000",
    logo: "https://1000logos.net/wp-content/uploads/2022/11/Warhammer-logo.png",
    backgroundImage: "https://i.pinimg.com/736x/ae/81/22/ae81228b6228a8ff51db9c8240078532.jpg",
    matchSize: "180x90",
    estimatedDuration: "04:00",
  },
];

const RAW_FACTIONS: LocalFaction[] = [
  { gameId: "guild-ball", faction: "Alchemists", image: "/images/factions/GuildBall/alchemists.png", color: "#d97706" },
  { gameId: "guild-ball", faction: "Blacksmiths", image: "/images/factions/GuildBall/blacksmiths.png", color: "#6b7280" },
  { gameId: "guild-ball", faction: "Brewers", image: "/images/factions/GuildBall/brewers.png", color: "#92400e" },
  { gameId: "guild-ball", faction: "Butchers", image: "/images/factions/GuildBall/butchers.png", color: "#991b1b" },
  { gameId: "guild-ball", faction: "Cooks", image: "/images/factions/GuildBall/cooks.png", color: "#b45309" },
  { gameId: "guild-ball", faction: "Engineers", image: "/images/factions/GuildBall/engineers.png", color: "#0ea5e9" },
  { gameId: "guild-ball", faction: "Falconers", image: "/images/factions/GuildBall/falconers.png", color: "#16a34a" },
  { gameId: "guild-ball", faction: "Farmers", image: "/images/factions/GuildBall/farmers.png", color: "#65a30d" },
  { gameId: "guild-ball", faction: "Fishermen", image: "/images/factions/GuildBall/fishermen.png", color: "#2563eb" },
  { gameId: "guild-ball", faction: "Hunters", image: "/images/factions/GuildBall/hunters.png", color: "#15803d" },
  { gameId: "guild-ball", faction: "Lamplighters", image: "/images/factions/GuildBall/lamplighters.png", color: "#f59e0b" },
  { gameId: "guild-ball", faction: "Masons", image: "/images/factions/GuildBall/masons.png", color: "#eab308" },
  { gameId: "guild-ball", faction: "Miners", image: "/images/factions/GuildBall/miners.png", color: "#57534e" },
  { gameId: "guild-ball", faction: "Morticians", image: "/images/factions/GuildBall/morticians.png", color: "#7c3aed" },
  { gameId: "guild-ball", faction: "Navigators", image: "/images/factions/GuildBall/navigators.png", color: "#0891b2" },
  { gameId: "guild-ball", faction: "Order Of Solthecius", image: "/images/factions/GuildBall/order.png", color: "#dc2626" },
  { gameId: "guild-ball", faction: "Ratcatchers", image: "/images/factions/GuildBall/ratcatchers.png", color: "#4b5563" },
  { gameId: "guild-ball", faction: "Shepherds", image: "/images/factions/GuildBall/shepherds.png", color: "#a3a3a3" },
  { gameId: "guild-ball", faction: "The Union", image: "/images/factions/GuildBall/union.png", color: "#9ca3af" },
  { gameId: "warhammer-40k", faction: "Adepta Sororitas", image: "https://wahapedia.ru/wh40k9ed/img/factions/Adepta-Sororitas.png", color: "#991b1b" },
  { gameId: "warhammer-40k", faction: "Adeptus Custodes", image: "https://wahapedia.ru/wh40k9ed/img/factions/Adeptus-Custodes.png", color: "#ca8a04" },
  { gameId: "warhammer-40k", faction: "Adeptus Mechanicus", image: "https://wahapedia.ru/wh40k9ed/img/factions/Adeptus-Mechanicus.png", color: "#b91c1c" },
  { gameId: "warhammer-40k", faction: "Aeldari", image: "https://wahapedia.ru/wh40k9ed/img/factions/Aeldari.png", color: "#eab308" },
  { gameId: "warhammer-40k", faction: "Agents of the Imperium", image: "https://wahapedia.ru/wh40k9ed/img/factions/Agents-of-the-Imperium.png", color: "#374151" },
  { gameId: "warhammer-40k", faction: "Astra Militarum", image: "https://wahapedia.ru/wh40k9ed/img/factions/Astra-Militarum.png", color: "#4d7c0f" },
  { gameId: "warhammer-40k", faction: "Black Templars", image: "https://wahapedia.ru/wh40k9ed/img/factions/Black-Templars.png", color: "#171717" },
  { gameId: "warhammer-40k", faction: "Blood Angels", image: "https://wahapedia.ru/wh40k9ed/img/factions/Blood-Angels.png", color: "#dc2626" },
  { gameId: "warhammer-40k", faction: "Chaos Daemons", image: "https://wahapedia.ru/wh40k9ed/img/factions/Chaos-Daemons.png", color: "#7f1d1d" },
  { gameId: "warhammer-40k", faction: "Chaos Knights", image: "https://wahapedia.ru/wh40k9ed/img/factions/Chaos-Knights.png", color: "#451a03" },
  { gameId: "warhammer-40k", faction: "Chaos Space Marines", image: "https://wahapedia.ru/wh40k9ed/img/factions/Chaos-Space-Marines.png", color: "#1f2937" },
  { gameId: "warhammer-40k", faction: "Dark Angels", image: "https://wahapedia.ru/wh40k9ed/img/factions/Dark-Angels.png", color: "#14532d" },
  { gameId: "warhammer-40k", faction: "Death Guard", image: "https://wahapedia.ru/wh40k9ed/img/factions/Death-Guard.png", color: "#65a30d" },
  { gameId: "warhammer-40k", faction: "Deathwatch", image: "https://wahapedia.ru/wh40k9ed/img/factions/Deathwatch.png", color: "#111827" },
  { gameId: "warhammer-40k", faction: "Drukhari", image: "https://wahapedia.ru/wh40k9ed/img/factions/Drukhari.png", color: "#4c1d95" },
  { gameId: "warhammer-40k", faction: "Genestealer Cults", image: "https://wahapedia.ru/wh40k9ed/img/factions/Genestealer-Cults.png", color: "#9333ea" },
  { gameId: "warhammer-40k", faction: "Grey Knights", image: "https://wahapedia.ru/wh40k9ed/img/factions/Grey-Knights.png", color: "#94a3b8" },
  { gameId: "warhammer-40k", faction: "Imperial Knights", image: "https://wahapedia.ru/wh40k9ed/img/factions/Imperial-Knights.png", color: "#0369a1" },
  { gameId: "warhammer-40k", faction: "Leagues of Votann", image: "https://wahapedia.ru/wh40k9ed/img/factions/Leagues-of-Votann.png", color: "#0f766e" },
  { gameId: "warhammer-40k", faction: "Necrons", image: "https://wahapedia.ru/wh40k9ed/img/factions/Necrons.png", color: "#16a34a" },
  { gameId: "warhammer-40k", faction: "Orks", image: "https://wahapedia.ru/wh40k9ed/img/factions/Orks.png", color: "#15803d" },
  { gameId: "warhammer-40k", faction: "Space Marines", image: "https://wahapedia.ru/wh40k9ed/img/factions/Space-Marines.png", color: "#1d4ed8" },
  { gameId: "warhammer-40k", faction: "Space Wolves", image: "https://wahapedia.ru/wh40k9ed/img/factions/Space-Wolves.png", color: "#64748b" },
  { gameId: "warhammer-40k", faction: "T'au Empire", image: "https://wahapedia.ru/wh40k9ed/img/factions/Tau-Empire.png", color: "#d97706" },
  { gameId: "warhammer-40k", faction: "Thousand Sons", image: "https://wahapedia.ru/wh40k9ed/img/factions/Thousand-Sons.png", color: "#0284c7" },
  { gameId: "warhammer-40k", faction: "Tyranids", image: "https://wahapedia.ru/wh40k9ed/img/factions/Tyranids.png", color: "#7c3aed" },
  { gameId: "warhammer-40k", faction: "World Eaters", image: "https://wahapedia.ru/wh40k9ed/img/factions/World-Eaters.png", color: "#7f1d1d" },
];

const RAW_TABLES: Array<Omit<GameTable, "label">> = [
  { tableId: "B", size: "90x90", columnIndex: 2, enabled: true },
  { tableId: "C", size: "90x90", columnIndex: 3, enabled: true },
  { tableId: "D", size: "180x90", columnIndex: 4, enabled: true },
  { tableId: "E", size: "180x90", columnIndex: 5, enabled: true },
  { tableId: "F", size: "220x90", columnIndex: 6, enabled: true },
  { tableId: "G", size: "220x90", columnIndex: 7, enabled: true },
];

const RAW_TABLE_TIME_SLOTS = [
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

function normalizeLocalImagePath(value?: string): string {
  if (!value) {
    return "";
  }

  if (!value.startsWith("/images/")) {
    return value;
  }

  return value.replace(/\.(png|jpe?g)(?=([?#].*)?$)/i, ".webp");
}

function buildTableLabels(tables: Array<Omit<GameTable, "label">>): GameTable[] {
  const counters: Record<string, number> = {};

  return tables.map((table) => {
    const nextCount = (counters[table.size] || 0) + 1;
    counters[table.size] = nextCount;

    return {
      ...table,
      label: `${table.size} #${nextCount}`,
    };
  });
}

function mergeGamesWithFallback(games: RawGame[]): RawGame[] {
  if (games.some((game) => game.gameId === FALLBACK_KILL_TEAM_GAME_ID)) {
    return games;
  }

  return [...games, FALLBACK_KILL_TEAM_GAME];
}

function mergeFactionsWithFallback(factions: LocalFaction[]): LocalFaction[] {
  const existingKillTeamFactions = new Set(
    factions
      .filter((faction) => faction.gameId === FALLBACK_KILL_TEAM_GAME_ID)
      .map((faction) => faction.faction)
  );

  const missingFallbackFactions = FALLBACK_KILL_TEAM_FACTIONS.filter(
    (faction) => !existingKillTeamFactions.has(faction.faction)
  );

  return [...factions, ...missingFallbackFactions];
}

const LOCAL_FACTIONS = mergeFactionsWithFallback(RAW_FACTIONS).map((faction) => ({
  ...faction,
  image: normalizeLocalImagePath(faction.image),
}));

export const GAME_CONFIGS: GameConfig[] = mergeGamesWithFallback(RAW_GAMES).map(
  (game) => {
    const gameFactions = LOCAL_FACTIONS.filter((faction) => faction.gameId === game.gameId);

    return {
      gameId: game.gameId,
      displayName: game.displayName || game.gameId,
      logo: normalizeLocalImagePath(game.logo),
      matchSize: game.matchSize || "",
      estimatedDuration: game.estimatedDuration || "01:30",
      backgroundImage: normalizeLocalImagePath(game.backgroundImage),
      factions: gameFactions.map((faction) => faction.faction),
      factionImages: Object.fromEntries(
        gameFactions.map((faction) => [faction.faction, faction.image])
      ),
      factionColors: Object.fromEntries(
        gameFactions.map((faction) => [faction.faction, faction.color])
      ),
    };
  }
);

export const TABLES: GameTable[] = buildTableLabels(RAW_TABLES);

export const TABLE_TIME_SLOTS = [...RAW_TABLE_TIME_SLOTS];

export function getGameConfig(gameId?: string) {
  return GAME_CONFIGS.find((config) => config.gameId === gameId);
}

export function getGameFactions(gameId?: string): LocalFaction[] {
  if (!gameId) {
    return [];
  }

  return LOCAL_FACTIONS.filter((faction) => faction.gameId === gameId);
}
