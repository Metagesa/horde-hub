import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ParsedMatch } from "@/types";
import GamePage from "@/pages/GamePage";

const mockDeleteMatch = vi.fn();
const mockToast = vi.fn();
const mockUseConfigs = vi.fn();
const mockUseFactions = vi.fn();
const mockUseMatches = vi.fn();
const mockUseBoardAvailability = vi.fn();

vi.mock("react-router-dom", () => ({
  useParams: () => ({ gameId: "guild-ball" }),
}));

vi.mock("@/lib/api", () => ({
  deleteMatch: (...args: unknown[]) => mockDeleteMatch(...args),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@/lib/adminAuth", () => ({
  getStoredAdminSession: () => ({
    email: "admin@example.com",
    name: "Admin",
    credential: "credential",
  }),
}));

vi.mock("@/hooks/useGameData", () => ({
  useConfigs: (...args: unknown[]) => mockUseConfigs(...args),
  useFactions: (...args: unknown[]) => mockUseFactions(...args),
  useMatches: (...args: unknown[]) => mockUseMatches(...args),
  useBoardAvailability: (...args: unknown[]) => mockUseBoardAvailability(...args),
}));

const match: ParsedMatch = {
  id: "match-1",
  date: "2026-04-24",
  playerA: "Alice",
  factionA: "Alchemists",
  playerB: "Bob",
  factionB: "Brewers",
  time: "18:00",
  tableId: "",
  tableSize: "",
  matchSize: "90x90",
  duration: "02:00",
  playerATime: "",
  playerBTime: "",
  scoreA: null,
  scoreB: null,
  played: false,
  status: "scheduled",
  createdAt: "2026-04-24T00:00:00.000Z",
};

describe("GamePage", () => {
  beforeEach(() => {
    mockDeleteMatch.mockReset();
    mockToast.mockReset();
    mockUseConfigs.mockReturnValue({
      data: [
        {
          gameId: "guild-ball",
          displayName: "Guild Ball",
          logo: "",
          matchSize: "90x90",
          estimatedDuration: "02:00",
          factions: [],
          factionImages: {},
          factionColors: {},
          backgroundImage: "",
        },
      ],
    });
    mockUseFactions.mockReturnValue({ data: [] });
    mockUseMatches.mockReturnValue({
      data: {
        matches: [match],
        visibilityWarning: null,
      },
      isLoading: false,
      error: null,
    });
    mockUseBoardAvailability.mockReturnValue({
      data: {
        tables: [],
        timeSlots: [],
        reservationMatches: {},
        assignmentsByTime: {},
      },
      isLoading: false,
    });
  });

  it("confirms before deleting and refreshes on success", async () => {
    mockDeleteMatch.mockResolvedValue(true);
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <GamePage />
      </QueryClientProvider>
    );

    expect(
      screen.getByRole("button", {
        name: /abrir acciones del partido alice contra bob/i,
      })
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Borrar" })[0]);

    expect(await screen.findByText("Confirmar borrado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => {
      expect(screen.queryByText("Confirmar borrado")).not.toBeInTheDocument();
    });
    expect(mockDeleteMatch).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Borrar" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Borrar" }));

    await waitFor(() => {
      expect(mockDeleteMatch).toHaveBeenCalledWith("guild-ball", "match-1");
    });
    expect(mockToast).toHaveBeenCalledWith({ title: "Partido eliminado" });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["matches", "guild-ball"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["boardAvailability"],
    });
  });
});
