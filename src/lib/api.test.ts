import {
  ADMIN_SESSION_EXPIRED_EVENT,
  fetchAllMatches,
  fetchMatches,
  fetchMatchesWithState,
  parseMatch,
  saveMatch,
} from "@/lib/api";
import { getStoredAdminSession, storeAdminSession } from "@/lib/adminAuth";
import { GAME_CONFIGS, TABLES, TABLE_TIME_SLOTS, getGameFactions } from "@/lib/localData";

describe("local snapshot data", () => {
  it("provides configs without a runtime fetch and keeps built-in game data", () => {
    expect(GAME_CONFIGS.some((config) => config.gameId === "kill-team")).toBe(true);
    expect(GAME_CONFIGS.some((config) => config.gameId === "warmaster")).toBe(true);
    expect(GAME_CONFIGS.some((config) => config.gameId === "age-of-sigmar")).toBe(true);

    const guildBall = GAME_CONFIGS.find((config) => config.gameId === "guild-ball");
    const killTeam = GAME_CONFIGS.find((config) => config.gameId === "kill-team");
    const warmaster = GAME_CONFIGS.find((config) => config.gameId === "warmaster");
    const ageOfSigmar = GAME_CONFIGS.find((config) => config.gameId === "age-of-sigmar");

    expect(guildBall).toMatchObject({
      logo: "/images/games/GuildBall/logo.webp",
      backgroundImage: "/images/games/GuildBall/background.webp",
    });
    expect(killTeam).toMatchObject({
      displayName: "Kill Team",
      matchSize: "76x56",
      estimatedDuration: "02:00",
    });
    expect(warmaster).toMatchObject({
      displayName: "Warmaster",
      matchSize: "180x120",
      estimatedDuration: "03:00",
      logo: "",
      backgroundImage: "",
    });
    expect(ageOfSigmar).toMatchObject({
      displayName: "Age of Sigmar",
      matchSize: "180x120",
      estimatedDuration: "03:00",
      logo: "",
      backgroundImage: "",
    });
  });

  it("provides local factions, tables, and time slots synchronously", () => {
    const guildBallFactions = getGameFactions("guild-ball");
    const killTeamFactions = getGameFactions("kill-team");
    const warmasterFactions = getGameFactions("warmaster");
    const ageOfSigmarFactions = getGameFactions("age-of-sigmar");

    expect(guildBallFactions.find((faction) => faction.faction === "Alchemists"))
      .toMatchObject({
        image: "/images/factions/GuildBall/alchemists.webp",
        color: "#d97706",
      });
    expect(killTeamFactions).toHaveLength(33);
    expect(warmasterFactions).toEqual([]);
    expect(ageOfSigmarFactions).toEqual([]);
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
  beforeEach(() => {
    localStorage.clear();
  });

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

  it("parses remote matches when the date field is a Date object", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 7,
          date: new Date("2026-04-24T00:00:00.000Z"),
          playerA: "Alice",
          factionA: "Alchemists",
          playerB: "Bob",
          factionB: "Butchers",
          time: "19:30:00",
        },
      ],
    } as Response);

    await expect(fetchMatches("guild-ball")).resolves.toEqual([
      expect.objectContaining({
        id: "7",
        date: "2026-04-24",
        time: "19:30",
      }),
    ]);
  });

  it("falls back to empty arrays per game when a cross-game fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    await expect(fetchAllMatches(["guild-ball", "warhammer-40k"])).resolves.toEqual({
      "guild-ball": [],
      "warhammer-40k": [],
    });
  });

  it("surfaces a normalized connection error for kill team when the remote fetch is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchMatches("kill-team")).rejects.toThrow(
      "No se pudo conectar con el servicio de partidas"
    );
  });

  it("does not provide a special visibility warning for kill team when the remote fetch is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchMatchesWithState("kill-team")).rejects.toThrow(
      "No se pudo conectar con el servicio de partidas"
    );
  });

  it("surfaces a normalized connection error for non-fallback games", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchMatches("guild-ball")).rejects.toThrow(
      "No se pudo conectar con el servicio de partidas"
    );
  });

  it("posts normalized match payloads for writes", async () => {
    storeAdminSession({
      email: "admin@example.com",
      name: "Admin",
      credential: "jwt-token",
    });
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
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/matches");
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer jwt-token",
      "Content-Type": "application/json",
    });
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

  it("drops expired stored admin sessions", () => {
    const encodeBase64Url = (value: object) =>
      btoa(JSON.stringify(value))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");

    const credential = `${encodeBase64Url({ alg: "none", typ: "JWT" })}.${encodeBase64Url({
      email: "admin@example.com",
      exp: Math.floor(Date.now() / 1000) - 60,
    })}.sig`;

    storeAdminSession({
      email: "admin@example.com",
      name: "Admin",
      credential,
    });

    expect(getStoredAdminSession()).toBeNull();
    expect(localStorage.getItem("horda-admin-session")).toBeNull();
  });

  it("clears the admin session and emits an event when the API returns 401", async () => {
    storeAdminSession({
      email: "admin@example.com",
      name: "Admin",
      credential: "jwt-token",
    });
    const expiredListener = vi.fn();
    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, expiredListener);
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false }),
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
        tableId: "",
        tableSize: "",
        matchSize: "90x90",
        reserveTable: false,
      })
    ).resolves.toBe(false);

    expect(getStoredAdminSession()).toBeNull();
    expect(expiredListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, expiredListener);
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

  it("returns an empty date instead of throwing for unexpected date values", () => {
    expect(
      parseMatch({
        id: "10",
        date: 123 as unknown as Date,
        playerA: "Alice",
        factionA: "Alchemists",
        playerB: "Bob",
        factionB: "Butchers",
        time: "19:00:00",
      })
    ).toMatchObject({
      id: "10",
      date: "",
      time: "19:00",
    });
  });
});
