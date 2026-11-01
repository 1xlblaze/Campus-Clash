import { redirect } from "next/navigation";
import { getBoardGame } from "@/lib/board-games";

export default async function LegacyGamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = getBoardGame(gameId);
  if (game) redirect(game.href);
  redirect("/play");
}
