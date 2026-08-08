"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusPill from "@/components/StatusPill";
import { Team } from "@/lib/types";

function ScoreForm({ team, round, evaluatorId, evaluatorName }: {
  team: Team;
  round: 1 | 2;
  evaluatorId: string;
  evaluatorName: string;
}) {
  const [frontend, setFrontend] = useState("");
  const [presentation, setPresentation] = useState("");
  const [documentation, setDocumentation] = useState("");
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fe = Number(frontend);
    const pr = Number(presentation);
    const doc_ = Number(documentation);

    if (
      Number.isNaN(fe) || fe < 0 || fe > 30 ||
      Number.isNaN(pr) || pr < 0 || pr > 10 ||
      Number.isNaN(doc_) || doc_ < 0 || doc_ > 10
    ) {
      setError("Frontend must be 0-30, Presentation and Documentation must be 0-10.");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "scores"), {
        teamId: team.id,
        evaluatorId,
        evaluatorName,
        round,
        frontend: fe,
        presentation: pr,
        documentation: doc_,
        total: fe + pr + doc_,
        comments: comments.trim(),
        createdAt: Date.now(),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save score");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <p className="text-sm text-success font-medium">
        ✓ Score submitted for {team.teamName} (Round {round})
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
      <div>
        <label className="block text-xs text-muted mb-1">Frontend /30</label>
        <input
          type="number" min={0} max={30} value={frontend}
          onChange={(e) => setFrontend(e.target.value)}
          className="w-full px-2 py-1.5 rounded border border-border text-sm font-mono"
          required
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Presentation /10</label>
        <input
          type="number" min={0} max={10} value={presentation}
          onChange={(e) => setPresentation(e.target.value)}
          className="w-full px-2 py-1.5 rounded border border-border text-sm font-mono"
          required
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Documentation /10</label>
        <input
          type="number" min={0} max={10} value={documentation}
          onChange={(e) => setDocumentation(e.target.value)}
          className="w-full px-2 py-1.5 rounded border border-border text-sm font-mono"
          required
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="bg-violet hover:bg-violet-dark text-white text-sm font-medium px-3 py-2 rounded-md disabled:opacity-50"
      >
        {saving ? "Saving…" : "Submit score"}
      </button>
      <input
        placeholder="Comments (optional)"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        className="col-span-2 sm:col-span-4 px-2.5 py-1.5 rounded border border-border text-sm mt-1"
      />
      {error && <p className="col-span-2 sm:col-span-4 text-xs text-danger">{error}</p>}
    </form>
  );
}

function EvaluatePageContent() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [round, setRound] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teams"), (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Team, "id">) })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const visibleTeams = round === 2 ? teams.filter((t) => t.round1Status === "qualified") : teams;

  if (loading) {
    return <div className="max-w-4xl mx-auto px-5 py-16 text-muted">Loading…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold mb-1">Evaluate teams</h1>
      <p className="text-muted text-sm mb-6">Score each team against the fixed criteria.</p>

      <div className="flex gap-2 mb-6">
        {([1, 2] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRound(r)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium border ${
              round === r
                ? "bg-violet text-white border-violet"
                : "border-border text-muted"
            }`}
          >
            Round {r}
          </button>
        ))}
      </div>

      {visibleTeams.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted text-sm">
          {round === 2 ? "No teams have qualified for Round 2 yet." : "No teams registered yet."}
        </div>
      )}

      <div className="space-y-4">
        {visibleTeams.map((team) => (
          <div key={team.id} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-semibold">{team.teamName}</h3>
                <p className="text-xs text-muted">
                  {team.members.map((m) => m.name).join(", ")}
                </p>
              </div>
              <StatusPill status={team.round1Status} />
            </div>

            <div className="flex gap-4 mb-4 text-sm">
              {team.pptUrl ? (
                <a href={team.pptUrl} target="_blank" className="text-violet underline">
                  View PPT
                </a>
              ) : (
                <span className="text-muted italic">No PPT uploaded</span>
              )}
              {team.docUrl ? (
                <a href={team.docUrl} target="_blank" className="text-violet underline">
                  View Documentation
                </a>
              ) : (
                <span className="text-muted italic">No documentation uploaded</span>
              )}
            </div>

            {user && (
              <ScoreForm
                team={team}
                round={round}
                evaluatorId={user.uid}
                evaluatorName={user.name}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EvaluatePage() {
  return (
    <ProtectedRoute allowedRoles={["evaluator"]}>
      <EvaluatePageContent />
    </ProtectedRoute>
  );
}
