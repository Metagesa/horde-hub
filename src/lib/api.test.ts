import { fetchAllMatches, fetchMatches, parseMatch, saveMatch } from "@/lib/api";
import { GAME_CONFIGS, TABLES, TABLE_TIME_SLOTS, getGameFactions } from "@/lib/localData";

describe("local snapshot data", () => {
  it("provides configs without a runtime fetch and keeps kill team fallback data", () => {
    expect(GAME_CONFIGS.some((config) => config.gameId === "kill-team")).toBe(true);

    const guildBall = GAME_CONFIGS.find((config) => config.gameId === "guild-ball");
    const killTeam = GAME_CONFIGS.find((config) => config.gameId === "kill-team");

    expect(guildBall).toMatchObject({
      logo: "/images/games/GuildBall/logo.webp",
      backgroundImage: "/images/games/GuildBall/background.webp",
    });
    expect(killTeam).toMatchObject({
      displayName: "Kill Team",
      matchSize: "76x56",
      estimatedDuration: "02:00",
    });
  });

  it("provides local factions, tables, and time slots synchronously", () => {
    const guildBallFactions = getGameFactions("guild-ball");
    const killTeamFactions = getGameFactions("kill-team");

    expect(guildBallFactions.find((faction) => faction.faction === "Alchemists"))
      .toMatchObject({
        image: "/images/factions/GuildBall/alchemists.webp",
        color: "#d97706",
      });
    expect(killTeamFactions).toHaveLength(33);
    expect(TABLES.map((table) => table.label)).toEqual([
      "90x90 #1",
      "90x90 #2",
      "180x90 #1",
      "180x90 #2",
      "220x90 #1",
      "220x90 #2",
    ]);
    expect(TABLE_TIME_SLOTS).toContain("17:00");
    expect(TABLE_TIME_SLOTS).toContain("23:30");
  });
});

describe("match api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses remote matches into the normalized local shape", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 42,
          date: "2026-04-24T00:00:00.000Z",
          playerA: "Alice",
          factionA: "Alchemists",
          playerB: "Bob",
          factionB: "Butchers",
          time: "2026-04-24T19:30:00.000Z",
          duration: "02:00:00",
          scoreA: "12",
          scoreB: "4",
          playerATime: "00:34:11",
          playerBTime: "00:11:22",
        },
      ],
    } as Response);

    await expect(fetchMatches("guild-ball")).resolves.toEqual([
      expect.objectContaining({
        id: "42",
        date: "2026-04-24",
        time: "19:30",
        duration: "02:00",
        scoreA: 12,
        scoreB: 4,
        playerATime: "34:11",
        playerBTime: "11:22",
        played: true,
        status: "completed",
      }),
    ]);
  });

  it("falls back to empty arrays per game when a cross-game fetch fails", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            date: "2026-04-24",
            playerA: "Alice",
            factionA: "Alchemists",
            playerB: "Bob",
            factionB: "Butchers",
            time: "19:30",
          },
        ],
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => [],
      } as Response);

    await expect(fetchAllMatches(["guild-ball", "warhammer-40k"])).resolves.toEqual({
      "guild-ball": [
        expect.objectContaining({
          playerA: "Alice",
        }),
      ],
      "warhammer-40k": [],
    });
  });

  it("posts normalized match payloads for writes", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    await expect(
      saveMatch("guild-ball", {
        date: "2026-04-24",
        playerA: "ALICE",
        factionA: "Alchemists",
        playerB: "BOB",
        factionB: "Butchers",
        time: "19:30",
        duration: "02:00",
        tableId: "B",
        tableSize: "90x90",
        matchSize: "90x90",
        reserveTable: true,
      })
    ).resolves.toBe(true);

    const payload = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(payload).toMatchObject({
      gameId: "guild-ball",
      playerA: "ALICE",
      playerB: "BOB",
      tableId: "B",
      tableSize: "90x90",
      reserveTable: true,
      status: "scheduled",
      played: false,
    });
  });

  it("keeps parseMatch available for direct utility use", () => {
    expect(
      parseMatch({
        id: "9",
        date: "2026-04-24",
        playerA: "Alice",
        factionA: "Alchemists",
        playerB: "Bob",
        factionB: "Butchers",
        time: "19:00:00",
      })
    ).toMatchObject({
      id: "9",
      date: "2026-04-24",
      time: "19:00",
      played: false,
      status: "scheduled",
    });
  });
});
