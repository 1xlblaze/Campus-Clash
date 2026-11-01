"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getGame } from "@/lib/games";
import { getOrCreateGuestToken, type PlayQuestion } from "@/lib/guest-session";

type Feedback = { correct: boolean; message: string; correctKey?: string };

export default function GamePage() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const fallbackGame = useMemo(() => getGame(params.gameId), [params.gameId]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [verifiedMode, setVerifiedMode] = useState(false);
  const [questions, setQuestions] = useState<PlayQuestion[]>([]);
  const [gameTitle, setGameTitle] = useState("");
  const [gameIcon, setGameIcon] = useState("🎮");
  const [index, setIndex] = useState(0);
  const [demoAnswers, setDemoAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [seconds, setSeconds] = useState(15);
  const questionStartedAt = useRef<number>(Date.now());
  const guestTokenRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!fallbackGame) {
        setLoading(false);
        return;
      }
      setGameTitle(fallbackGame.title);
      setGameIcon(fallbackGame.icon);
      const guestToken = getOrCreateGuestToken();
      guestTokenRef.current = guestToken;
      try {
        const res = await fetch("/api/sessions/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: fallbackGame.id, guestToken }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not start session");
        if (cancelled) return;
        setSessionId(data.sessionId);
        setVerifiedMode(Boolean(data.verifiedMode));
        setQuestions(data.questions ?? []);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not start game");
          setQuestions(
            fallbackGame.questions.map((q) => ({
              id: q.id,
              prompt: q.prompt,
              options: q.options,
              explanation: q.explanation ?? null,
            }))
          );
          setSessionId("demo");
          setVerifiedMode(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, [fallbackGame]);

  const finishRound = useCallback(
    async (demoScoreAnswers: string[]) => {
      if (!fallbackGame || !sessionId) return;
      if (verifiedMode) {
        const res = await fetch(`/api/sessions/${sessionId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestToken: guestTokenRef.current }),
        });
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error ?? "Could not verify score");
          return;
        }
        router.push(
          `/result?score=${data.score}&total=${data.total}&game=${data.gameId}&verified=1&session=${sessionId}`
        );
        return;
      }
      const score = demoScoreAnswers.reduce(
        (sum, a, i) => sum + (a === fallbackGame.questions[i]?.answer ? 100 : 0),
        0
      );
      router.push(
        `/result?score=${score}&total=${fallbackGame.questions.length}&game=${fallbackGame.id}`
      );
    },
    [fallbackGame, router, sessionId, verifiedMode]
  );

  const answer = useCallback(
    async (value: string | null) => {
      if (!fallbackGame || selected !== null || !sessionId || !questions.length) return;
      const question = questions[index];
      const responseMs = Date.now() - questionStartedAt.current;
      const picked = value ?? "";
      setSelected(value ?? "__timeout__");
      let nextDemoAnswers = demoAnswers;

      if (verifiedMode) {
        const res = await fetch(`/api/sessions/${sessionId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestToken: guestTokenRef.current,
            questionId: question.id,
            selectedKey: value,
            responseMs,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFeedback({ correct: false, message: data.error ?? "Could not save answer" });
        } else {
          setFeedback({
            correct: Boolean(data.isCorrect),
            correctKey: data.correctKey,
            message: data.isCorrect
              ? "That’s right! +100 points"
              : value === null
                ? `Time’s up! Correct answer: ${data.correctKey}`
                : `Correct answer: ${data.correctKey}`,
          });
        }
      } else {
        const localQ = fallbackGame.questions[index];
        const correct = value === localQ.answer;
        nextDemoAnswers = [...demoAnswers, picked];
        setDemoAnswers(nextDemoAnswers);
        setFeedback({
          correct,
          correctKey: localQ.answer,
          message: correct
            ? "That’s right! +100 points"
            : value === null
              ? "Time’s up!"
              : `Correct answer: ${localQ.answer}`,
        });
      }

      window.setTimeout(() => {
        if (index + 1 === questions.length) {
          void finishRound(verifiedMode ? [] : nextDemoAnswers);
        } else {
          setIndex(index + 1);
          setSelected(null);
          setFeedback(null);
          setSeconds(15);
          questionStartedAt.current = Date.now();
        }
      }, 650);
    },
    [demoAnswers, fallbackGame, finishRound, index, questions, selected, sessionId, verifiedMode]
  );

  useEffect(() => {
    if (selected !== null || loading || !questions.length) return;
    const tick = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(tick);
  }, [index, selected, loading, questions.length]);

  useEffect(() => {
    if (seconds === 0 && selected === null && !loading) void answer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  if (!fallbackGame) {
    return (
      <main className="min-h-screen grid place-items-center bg-ink p-6">
        <div>
          <h1 className="text-2xl font-bold">Game not found</h1>
          <Link className="mt-4 inline-block text-violet-200" href="/play">
            Back to games
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center glow-bg p-6">
        <p className="text-white/60">Loading your round…</p>
      </main>
    );
  }

  const question = questions[index];
  if (!question) {
    return (
      <main className="min-h-screen grid place-items-center glow-bg p-6">
        <p className="text-rose-200">{loadError ?? "No questions available."}</p>
      </main>
    );
  }

  const answered = selected !== null;
  const correct = feedback?.correct ?? false;
  const correctKey = feedback?.correctKey;

  return (
    <main className="min-h-screen glow-bg px-5 py-7">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <Link href="/play" className="text-sm text-white/50 hover:text-white">
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Exit
          </Link>
          <span className="text-sm font-semibold">
            {gameIcon} {gameTitle}
          </span>
          <span className="text-xs text-white/40">
            {index + 1}/{questions.length}
          </span>
        </div>
        <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet to-cyan transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[.18em] text-violet-200">
            QUESTION {index + 1}
          </span>
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${seconds <= 5 ? "bg-rose-500/15 text-rose-300" : "bg-white/5 text-white/70"}`}
          >
            <Clock3 className="h-4 w-4" />0:{String(seconds).padStart(2, "0")}
          </span>
        </div>
        <section className="mt-5 rounded-3xl border border-white/10 bg-panel p-6 sm:p-8">
          <h1 className="display text-center text-xl font-bold leading-snug sm:text-2xl">{question.prompt}</h1>
          <div className="mt-7 grid gap-3">
            {question.options.map((option, i) => {
              const isAnswer = answered && correctKey === option;
              const isPicked = option === selected;
              let style = "border-white/10 bg-white/5 hover:border-violet/50 hover:bg-violet/10";
              if (answered && isAnswer) style = "border-emerald-400/50 bg-emerald-400/10 text-emerald-200";
              else if (answered && isPicked) style = "border-rose-400/50 bg-rose-400/10 text-rose-200";
              return (
                <button
                  key={option}
                  disabled={answered}
                  onClick={() => void answer(option)}
                  className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-left text-sm font-semibold transition ${style}`}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-xs text-white/50">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                  {answered && isAnswer && <span className="ml-auto">✓</span>}
                </button>
              );
            })}
          </div>
          {answered && feedback && (
            <div
              className={`mt-5 rounded-xl p-3 text-center text-sm font-bold ${correct ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-white/65"}`}
            >
              {feedback.message}
            </div>
          )}
        </section>
        <p className="mt-5 text-center text-xs text-white/30">
          {verifiedMode
            ? "Verified scoring · answers checked on the server · 100 points per correct answer"
            : "Demo scoring · configure Supabase env vars for verified play"}
        </p>
      </div>
    </main>
  );
}
