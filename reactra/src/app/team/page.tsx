"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusPill from "@/components/StatusPill";
import { EventConfig, Team, TeamMember } from "@/lib/types";

function TeamPageContent() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Registration form state
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([
    { enrollment: "", name: "", classDivision: "" },
  ]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // File upload state
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "teams"), where("createdBy", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        setTeam({ id: d.id, ...(d.data() as Omit<Team, "id">) });
      } else {
        setTeam(null);
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

  function updateMember(index: number, field: keyof TeamMember, value: string) {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  function addMemberRow() {
    setMembers((prev) => [...prev, { enrollment: "", name: "", classDivision: "" }]);
  }

  function removeMemberRow(index: number) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");

    if (!teamName.trim()) {
      setError("Team name is required.");
      return;
    }
    if (members.some((m) => !m.enrollment.trim() || !m.name.trim() || !m.classDivision.trim())) {
      setError("Fill in all member fields, or remove empty rows.");
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, "teams"), {
        teamName: teamName.trim(),
        members,
        createdBy: user.uid,
        round1Status: "pending",
        createdAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpload(kind: "ppt" | "doc") {
    if (!team) return;
    const file = kind === "ppt" ? pptFile : docFile;
    if (!file) return;

    setUploading(true);
    try {
      const path = `teams/${team.id}/${kind}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "teams", team.id), {
        [kind === "ppt" ? "pptUrl" : "docUrl"]: url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-5 py-16 text-muted">Loading…</div>;
  }

  // ---------- No team yet: show registration form ----------
  if (!team) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold mb-1">Register your team</h1>
        <p className="text-muted text-sm mb-6">
          One member registers on behalf of the whole team.
        </p>

        <form onSubmit={handleCreateTeam} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Team name</label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-violet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Members</label>
            <div className="space-y-3">
              {members.map((m, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 bg-card border border-border rounded-md p-3">
                  <input
                    placeholder="Enrollment No."
                    value={m.enrollment}
                    onChange={(e) => updateMember(i, "enrollment", e.target.value)}
                    className="px-2.5 py-1.5 rounded border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet"
                  />
                  <input
                    placeholder="Name"
                    value={m.name}
                    onChange={(e) => updateMember(i, "name", e.target.value)}
                    className="px-2.5 py-1.5 rounded border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet"
                  />
                  <input
                    placeholder="Class-Division"
                    value={m.classDivision}
                    onChange={(e) => updateMember(i, "classDivision", e.target.value)}
                    className="px-2.5 py-1.5 rounded border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet"
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMemberRow(i)}
                      className="text-danger text-sm px-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addMemberRow}
              className="mt-3 text-sm text-violet font-medium"
            >
              + Add another member
            </button>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={creating}
            className="bg-violet hover:bg-violet-dark text-white font-medium px-5 py-2.5 rounded-md transition-colors disabled:opacity-50"
          >
            {creating ? "Registering…" : "Register team"}
          </button>
        </form>
      </div>
    );
  }

  // ---------- Team exists: show status + uploads ----------
  const round2Visible = config?.round2Visible ?? false;

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{team.teamName}</h1>
        <p className="text-muted text-sm">Your registered team</p>
      </div>

      <section className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-semibold mb-3">Members</h2>
        <div className="space-y-2">
          {team.members.map((m, i) => (
            <div key={i} className="flex flex-wrap gap-x-4 text-sm">
              <span className="font-mono text-muted w-28">{m.enrollment}</span>
              <span className="font-medium">{m.name}</span>
              <span className="text-muted">{m.classDivision}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-semibold mb-3">Project definition</h2>
        {team.definitionText ? (
          <p className="text-sm leading-relaxed">{team.definitionText}</p>
        ) : (
          <p className="text-sm text-muted italic">
            Not assigned yet. Check back once the admin has assigned your team a
            project definition.
          </p>
        )}
      </section>

      <section className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-semibold mb-3">Round status</h2>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-sm text-muted w-20">Round 1</span>
          <StatusPill status={team.round1Status} />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted w-20">Round 2</span>
          {!round2Visible ? (
            <span className="text-xs text-muted italic">Not announced yet</span>
          ) : team.round1Status === "qualified" ? (
            <span className="text-sm font-medium text-success">
              🎉 You&apos;re through to Round 2!
            </span>
          ) : (
            <span className="text-sm text-muted">Not qualified for Round 2</span>
          )}
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-semibold mb-3">Upload documents</h2>
        <p className="text-xs text-muted mb-4">
          Evaluators score your presentation and documentation directly from
          these uploads, so make sure you upload the final versions.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Presentation (PPT) {team.pptUrl && <span className="text-success text-xs">✓ uploaded</span>}
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".ppt,.pptx,.pdf"
                onChange={(e) => setPptFile(e.target.files?.[0] ?? null)}
                className="flex-1 text-sm"
              />
              <button
                onClick={() => handleUpload("ppt")}
                disabled={!pptFile || uploading}
                className="bg-violet hover:bg-violet-dark text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
              >
                Upload
              </button>
            </div>
            {team.pptUrl && (
              <a href={team.pptUrl} target="_blank" className="text-xs text-violet underline mt-1 inline-block">
                View current file
              </a>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Documentation {team.docUrl && <span className="text-success text-xs">✓ uploaded</span>}
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                className="flex-1 text-sm"
              />
              <button
                onClick={() => handleUpload("doc")}
                disabled={!docFile || uploading}
                className="bg-violet hover:bg-violet-dark text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
              >
                Upload
              </button>
            </div>
            {team.docUrl && (
              <a href={team.docUrl} target="_blank" className="text-xs text-violet underline mt-1 inline-block">
                View current file
              </a>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-danger mt-3">{error}</p>}
      </section>
    </div>
  );
}

export default function TeamPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <TeamPageContent />
    </ProtectedRoute>
  );
}