"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { EventConfig, Score, Team } from "@/lib/types";

function average(scores: Score[], field: "frontend" | "presentation" | "documentation" | "total") {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + s[field], 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

function ScoreBlock({ title, roundScores }: { title: string; roundScores: Score[] }) {
  if (roundScores.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-semibold mb-1">{title}</h2>
        <p className="text-sm text-muted">No scores recorded.</p>
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h2 className="font-semibold mb-4">{title}</h2>
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-muted">Frontend / Implementation (30)</span>
          <span className="font-mono">{average(roundScores, "frontend")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Presentation (10)</span>
          <span className="font-mono">{average(roundScores, "presentation")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Documentation (10)</span>
          <span className="font-mono">{average(roundScores, "documentation")}</span>
        </div>
      </div>
      <div className="flex justify-between border-t border-border pt-3 font-semibold">
        <span>Total (avg. of {roundScores.length} evaluator{roundScores.length > 1 ? "s" : ""})</span>
        <span className="font-mono text-violet">{average(roundScores, "total")} / 50</span>
      </div>
    </div>
  );
}

function ResultsPageContent() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "teams"), where("createdBy", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        setTeam({ id: d.id, ...(d.data() as Omit<Team, "id">) });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "eventConfig", "config"), (snap) => {
      if (snap.exists()) setConfig(snap.data() as EventConfig);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!team) return;
    const q = query(collection(db, "scores"), where("teamId", "==", team.id));
    const unsub = onSnapshot(q, (snap) => {
      setScores(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Score, "id">) })));
    });
    return () => unsub();
  }, [team]);

  if (loading) {
    return <div className="max-w-2xl mx-auto px-5 py-16 text-muted">Loading…</div>;
  }

  if (!team) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center text-muted">
        You haven&apos;t registered a team yet. Go to the Team tab first.
      </div>
    );
  }

  if (!config?.resultsVisible) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <p className="text-muted">Results haven&apos;t been published yet.</p>
        <p className="text-muted text-sm mt-1">Check back after the event organizers announce results.</p>
      </div>
    );
  }

  const round1Scores = scores.filter((s) => s.round === 1);
  const round2Scores = scores.filter((s) => s.round === 2);

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Results — {team.teamName}</h1>
      </div>

      <ScoreBlock title="Round 1" roundScores={round1Scores} />
      {team.round1Status === "qualified" && (
        <ScoreBlock title="Round 2" roundScores={round2Scores} />
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <ResultsPageContent />
    </ProtectedRoute>
  );
}
