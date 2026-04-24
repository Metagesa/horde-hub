import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MatchCard from "@/components/MatchCard";
import type { ParsedMatch } from "@/types";

const baseMatch: ParsedMatch = {
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

describe("MatchCard", () => {
  it("renders agenda action triggers and keeps row actions wired", () => {
    const onResult = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <MatchCard
        matches={[
          baseMatch,
          { ...baseMatch, id: "match-2", playerA: "Carol", playerB: "Dave", time: "19:00" },
        ]}
        dateLabel="Viernes"
        actionMode="menu"
        onResult={onResult}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const triggers = screen.getAllByRole("button", { name: /abrir acciones del partido/i });
    expect(triggers).toHaveLength(2);

    fireEvent.click(screen.getAllByRole("button", { name: "Puntuar" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[1]);
    fireEvent.click(screen.getAllByRole("button", { name: "Borrar" })[0]);

    expect(onResult).toHaveBeenCalledWith(baseMatch);
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: "match-2", playerA: "Carol", playerB: "Dave" })
    );
    expect(onDelete).toHaveBeenCalledWith(baseMatch);
  });

  it("keeps the legacy action layout when menu mode is not enabled", () => {
    render(
      <MatchCard
        matches={[baseMatch]}
        dateLabel="Viernes"
        onResult={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(
      screen.queryByRole("button", { name: /abrir acciones del partido/i })
    ).not.toBeInTheDocument();
  });
});
