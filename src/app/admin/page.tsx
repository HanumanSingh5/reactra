"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusPill from "@/components/StatusPill";
import {
  Announcement,
  AppUser,
  Definition,
  EventConfig,
  Role,
  Round1Status,
  SeatAssignment,
  Team,
} from "@/lib/types";

type Tab =
  | "announcements"
  | "rounds"
  | "teams"
  | "seating"
  | "users"
  | "assignments"
  | "signsheet"
  | "definitions";

function AdminPageContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("announcements");

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold mb-1">Admin</h1>
      <p className="text-muted text-sm mb-6">Manage the event as {user?.name}</p>

      <div className="flex gap-2 mb-8 border-b border-border overflow-x-auto">
        {([
          ["announcements", "Announcements"],
          ["rounds", "Round Controls"],
          ["teams", "Teams"],
          ["seating", "Seating"],
          ["users", "Users"],
          ["assignments", "Evaluator Assignments"],
          ["signsheet", "Sign Sheet"],
          ["definitions", "Definitions"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
              tab === key ? "border-violet text-violet" : "border-transparent text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "announcements" && <AnnouncementsTab />}
      {tab === "rounds" && <RoundControlsTab />}
      {tab === "teams" && <TeamsTab />}
      {tab === "seating" && <SeatingTab />}
      {tab === "users" && <UsersTab />}
      {tab === "assignments" && <AssignmentsTab />}
      {tab === "signsheet" && <SignSheetTab />}
      {tab === "definitions" && <DefinitionsTab />}
    </div>
  );
}

// ---------------- Announcements ----------------
function AnnouncementsTab() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [list, setList] = useState<Announcement[]>([]);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setList(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Announcement, "id">) })));
    });
    return () => unsub();
  }, []);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !user) return;
    setPosting(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title: title.trim(),
        message: message.trim(),
        postedBy: user.name,
        createdAt: Date.now(),
      });
      setTitle("");
      setMessage("");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handlePost} className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h2 className="font-semibold">Post an announcement</h2>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-border text-sm"
        />
        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-border text-sm"
        />
        <button
          type="submit"
          disabled={posting}
          className="bg-violet hover:bg-violet-dark text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
        >
          {posting ? "Posting…" : "Post announcement"}
        </button>
      </form>

      <div>
        <h2 className="font-semibold mb-3">Posted announcements</h2>
        <div className="space-y-2">
          {list.map((a) => (
            <div key={a.id} className="border border-border rounded-md p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{a.title}</span>
                <span className="text-xs text-muted">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-foreground/70 mt-1">{a.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- Round / result visibility controls ----------------
function RoundControlsTab() {
  const [config, setConfig] = useState<EventConfig>({ round2Visible: false, resultsVisible: false });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "eventConfig", "config"), (snap) => {
      if (snap.exists()) setConfig(snap.data() as EventConfig);
    });
    return () => unsub();
  }, []);

  async function toggle(field: keyof EventConfig) {
    const updated = { ...config, [field]: !config[field] };
    setConfig(updated);
    await setDoc(doc(db, "eventConfig", "config"), updated, { merge: true });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Round 2 visibility</h2>
          <p className="text-sm text-muted">
            Once enabled, students can see whether their team qualified for Round 2.
          </p>
        </div>
        <button
          onClick={() => toggle("round2Visible")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            config.round2Visible ? "bg-success text-white" : "bg-border text-muted"
          }`}
        >
          {config.round2Visible ? "Enabled" : "Disabled"}
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Results visibility</h2>
          <p className="text-sm text-muted">
            Once enabled, students can see their evaluation scores on the Results tab.
          </p>
        </div>
        <button
          onClick={() => toggle("resultsVisible")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            config.resultsVisible ? "bg-success text-white" : "bg-border text-muted"
          }`}
        >
          {config.resultsVisible ? "Enabled" : "Disabled"}
        </button>
      </div>
    </div>
  );
}

// ---------------- Teams: mark round 1 qualification ----------------
function TeamsTab() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teams"), (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Team, "id">) })));
    });
    return () => unsub();
  }, []);

  async function setStatus(teamId: string, status: Round1Status) {
    await updateDoc(doc(db, "teams", teamId), { round1Status: status });
  }

  return (
    <div className="space-y-3">
      {teams.length === 0 && (
        <p className="text-sm text-muted">No teams registered yet.</p>
      )}
      {teams.map((team) => (
        <div key={team.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-medium">{team.teamName}</p>
            <p className="text-xs text-muted">{team.members.length} member(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={team.round1Status} />
            <select
              value={team.round1Status}
              onChange={(e) => setStatus(team.id, e.target.value as Round1Status)}
              className="text-sm border border-border rounded-md px-2 py-1"
            >
              <option value="pending">Pending</option>
              <option value="qualified">Qualified</option>
              <option value="eliminated">Eliminated</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------- Seating ----------------
function SeatingTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [seats, setSeats] = useState<SeatAssignment[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [room, setRoom] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teams"), (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Team, "id">) })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "seating"), (snap) => {
      setSeats(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SeatAssignment, "id">) })));
    });
    return () => unsub();
  }, []);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeam || !room.trim() || !tableNumber.trim()) return;
    const team = teams.find((t) => t.id === selectedTeam);
    if (!team) return;

    setSaving(true);
    try {
      // remove any existing seat for this team first
      const existing = seats.find((s) => s.teamId === selectedTeam);
      if (existing) {
        await updateDoc(doc(db, "seating", existing.id), { room, tableNumber });
      } else {
        await addDoc(collection(db, "seating"), {
          teamId: selectedTeam,
          teamName: team.teamName,
          room: room.trim(),
          tableNumber: tableNumber.trim(),
        });
      }
      setSelectedTeam("");
      setRoom("");
      setTableNumber("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleAssign} className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h2 className="font-semibold">Assign a seat</h2>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-border text-sm"
        >
          <option value="">Select team…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.teamName}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Room (e.g. Lab 3)"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="px-3 py-2 rounded-md border border-border text-sm"
          />
          <input
            placeholder="Table No. (e.g. T-12)"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="px-3 py-2 rounded-md border border-border text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-violet hover:bg-violet-dark text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save seat assignment"}
        </button>
      </form>

      <div>
        <h2 className="font-semibold mb-3">Current assignments</h2>
        <div className="space-y-2">
          {seats.map((s) => (
            <div key={s.id} className="flex justify-between text-sm border border-border rounded-md px-3 py-2">
              <span className="font-medium">{s.teamName}</span>
              <span className="font-mono text-muted">{s.room} · {s.tableNumber}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- Users: promote/demote roles ----------------
function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, "uid">) })));
    });
    return () => unsub();
  }, []);

  async function setRole(uid: string, role: Role) {
    setSavingId(uid);
    try {
      await updateDoc(doc(db, "users", uid), { role });
    } finally {
      setSavingId(null);
    }
  }

  const filtered = users
    .filter((u) =>
      (u.name + u.email).toLowerCase().includes(search.trim().toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const roleBadge: Record<Role, string> = {
    student: "bg-border text-muted",
    evaluator: "bg-violet/15 text-violet",
    admin: "bg-success/15 text-success",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold mb-1">Manage user roles</h2>
        <p className="text-sm text-muted">
          Everyone signs up as a Student. Promote teachers to Evaluator so they can
          score teams, or to Admin for full access. Changes apply the moment they
          next refresh the site.
        </p>
      </div>

      <input
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-border text-sm"
      />

      {filtered.length === 0 && (
        <p className="text-sm text-muted">No matching users.</p>
      )}

      <div className="space-y-2">
        {filtered.map((u) => (
          <div
            key={u.uid}
            className="bg-card border border-border rounded-lg p-4 flex items-center justify-between flex-wrap gap-3"
          >
            <div>
              <p className="font-medium">
                {u.name}
                {currentUser?.uid === u.uid && (
                  <span className="text-xs text-muted font-normal"> (you)</span>
                )}
              </p>
              <p className="text-xs text-muted">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleBadge[u.role]}`}>
                {u.role}
              </span>
              <select
                value={u.role}
                disabled={savingId === u.uid}
                onChange={(e) => setRole(u.uid, e.target.value as Role)}
                className="text-sm border border-border rounded-md px-2 py-1 disabled:opacity-50"
              >
                <option value="student">Student</option>
                <option value="evaluator">Evaluator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Evaluator assignments ----------------
function AssignmentsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [evaluators, setEvaluators] = useState<AppUser[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teams"), (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Team, "id">) })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setEvaluators(
        snap.docs
          .map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, "uid">) }))
          .filter((u) => u.role === "evaluator")
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    });
    return () => unsub();
  }, []);

  async function toggleAssignment(team: Team, evaluatorUid: string) {
    const key = `${team.id}:${evaluatorUid}`;
    setSavingKey(key);
    const current = team.assignedEvaluatorIds ?? [];
    const next = current.includes(evaluatorUid)
      ? current.filter((id) => id !== evaluatorUid)
      : [...current, evaluatorUid];
    try {
      await updateDoc(doc(db, "teams", team.id), { assignedEvaluatorIds: next });
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold mb-1">Assign evaluators to teams</h2>
        <p className="text-sm text-muted">
          Check which evaluators are allowed to judge each team. Evaluators only see
          teams assigned to them on the Evaluate page &mdash; this is enforced by the
          database rules, not just hidden in the UI.
        </p>
      </div>

      {evaluators.length === 0 && (
        <p className="text-sm text-muted border border-dashed border-border rounded-lg p-4">
          No evaluator accounts yet. Promote a teacher to &quot;Evaluator&quot; on the
          Users tab first.
        </p>
      )}

      {teams.length === 0 && (
        <p className="text-sm text-muted">No teams registered yet.</p>
      )}

      <div className="space-y-3">
        {teams.map((team) => (
          <div key={team.id} className="bg-card border border-border rounded-lg p-4">
            <p className="font-medium mb-3">{team.teamName}</p>
            <div className="flex flex-wrap gap-2">
              {evaluators.map((ev) => {
                const key = `${team.id}:${ev.uid}`;
                const checked = (team.assignedEvaluatorIds ?? []).includes(ev.uid);
                return (
                  <button
                    key={ev.uid}
                    disabled={savingKey === key}
                    onClick={() => toggleAssignment(team, ev.uid)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                      checked
                        ? "bg-violet text-white border-violet"
                        : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {checked ? "✓ " : ""}
                    {ev.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Sign sheet download ----------------
function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function SignSheetTab() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teams"), (snap) => {
      setTeams(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Team, "id">) }))
          .sort((a, b) => a.teamName.localeCompare(b.teamName))
      );
    });
    return () => unsub();
  }, []);

  const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);

  function handleDownload() {
    const rows: string[] = [];
    rows.push(["Sr. No.", "Team", "Enrollment", "Name", "Class-Division", "Sign"].join(","));

    let srNo = 1;
    for (const team of teams) {
      for (const member of team.members) {
        rows.push(
          [
            String(srNo),
            csvEscape(team.teamName),
            csvEscape(member.enrollment),
            csvEscape(member.name),
            csvEscape(member.classDivision),
            "", // blank column for physical signature
          ].join(",")
        );
        srNo++;
      }
    }

    const csv = rows.join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reactra-sign-sheet-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold mb-1">Team sign sheet</h2>
        <p className="text-sm text-muted">
          Downloads a CSV with every registered member across all teams, with a blank
          &quot;Sign&quot; column for physical check-in on event day. Open it in Excel
          or Google Sheets to print.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted">
          {teams.length} team(s), {totalMembers} member(s) total.
        </p>
        <button
          onClick={handleDownload}
          disabled={totalMembers === 0}
          className="bg-violet hover:bg-violet-dark text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
        >
          Download CSV
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-card">
            <tr className="text-left text-muted">
              <th className="px-3 py-2 font-medium">Sr. No.</th>
              <th className="px-3 py-2 font-medium">Team</th>
              <th className="px-3 py-2 font-medium">Enrollment</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Class-Division</th>
              <th className="px-3 py-2 font-medium">Sign</th>
            </tr>
          </thead>
          <tbody>
            {teams.flatMap((team, ti) =>
              team.members.map((m, mi) => {
                const srNo =
                  teams.slice(0, ti).reduce((sum, t) => sum + t.members.length, 0) + mi + 1;
                return (
                  <tr key={`${team.id}-${mi}`} className="border-t border-border">
                    <td className="px-3 py-2">{srNo}</td>
                    <td className="px-3 py-2">{team.teamName}</td>
                    <td className="px-3 py-2 font-mono text-xs">{m.enrollment}</td>
                    <td className="px-3 py-2">{m.name}</td>
                    <td className="px-3 py-2">{m.classDivision}</td>
                    <td className="px-3 py-2 text-muted">&nbsp;</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- Project definitions ----------------
function DefinitionsTab() {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [uploading, setUploading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "definitions"), orderBy("createdAt", "asc")),
      (snap) => {
        setDefinitions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Definition, "id">) })));
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teams"), (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Team, "id">) })));
    });
    return () => unsub();
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const texts: string[] = [];
      for (const row of rows) {
        const cell = row?.[0];
        if (typeof cell !== "string") continue;
        const trimmed = cell.trim();
        if (!trimmed) continue;
        // skip an obvious header row like "Definition" / "Title" / "Problem Statement"
        if (texts.length === 0 && /^(definition|title|project( title)?|problem statement)s?$/i.test(trimmed)) {
          continue;
        }
        texts.push(trimmed);
      }

      if (texts.length === 0) {
        setError("No definitions found in that file. Put one definition per row in the first column.");
        return;
      }

      const batch = writeBatch(db);
      for (const text of texts) {
        const ref = doc(collection(db, "definitions"));
        batch.set(ref, {
          text,
          assignedTeamId: null,
          assignedTeamName: null,
          createdAt: Date.now(),
        });
      }
      await batch.commit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read that file.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const unassignedDefinitions = definitions.filter((d) => !d.assignedTeamId);
  const unassignedTeams = teams.filter((t) => !t.definitionId);

  async function handleAutoAssign() {
    if (unassignedDefinitions.length === 0 || unassignedTeams.length === 0) return;
    setAssigning(true);
    setError("");
    try {
      // Shuffle so assignment order isn't predictable, then pair 1:1 —
      // each definition can only end up on exactly one team.
      const shuffled = [...unassignedDefinitions].sort(() => Math.random() - 0.5);
      const pairCount = Math.min(shuffled.length, unassignedTeams.length);

      const batch = writeBatch(db);
      for (let i = 0; i < pairCount; i++) {
        const def = shuffled[i];
        const team = unassignedTeams[i];
        batch.update(doc(db, "definitions", def.id), {
          assignedTeamId: team.id,
          assignedTeamName: team.teamName,
        });
        batch.update(doc(db, "teams", team.id), {
          definitionId: def.id,
          definitionText: def.text,
        });
      }
      await batch.commit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-assign failed.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleReassign(def: Definition, newTeamId: string) {
    setError("");
    try {
      const batch = writeBatch(db);

      // Free up whatever team currently holds this definition.
      if (def.assignedTeamId) {
        batch.update(doc(db, "teams", def.assignedTeamId), {
          definitionId: deleteField(),
          definitionText: deleteField(),
        });
      }

      if (newTeamId) {
        const newTeam = teams.find((t) => t.id === newTeamId);
        // If the target team already had a different definition, free that one up too —
        // this is what guarantees no two teams ever end up sharing one.
        if (newTeam?.definitionId && newTeam.definitionId !== def.id) {
          batch.update(doc(db, "definitions", newTeam.definitionId), {
            assignedTeamId: null,
            assignedTeamName: null,
          });
        }
        batch.update(doc(db, "definitions", def.id), {
          assignedTeamId: newTeamId,
          assignedTeamName: newTeam?.teamName ?? null,
        });
        batch.update(doc(db, "teams", newTeamId), {
          definitionId: def.id,
          definitionText: def.text,
        });
      } else {
        batch.update(doc(db, "definitions", def.id), {
          assignedTeamId: null,
          assignedTeamName: null,
        });
      }

      await batch.commit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reassign failed.");
    }
  }

  async function handleDelete(def: Definition) {
    if (def.assignedTeamId) return; // safety: don't delete one that's in use
    await deleteDoc(doc(db, "definitions", def.id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold mb-1">Project definitions</h2>
        <p className="text-sm text-muted">
          Upload an Excel file with one definition per row (first column). Then use
          &quot;Auto-assign&quot; to randomly hand each team a unique definition &mdash;
          no two teams will ever get the same one. Students see their assigned
          definition on their Team page once it&apos;s set.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-medium text-sm">Upload definitions (.xlsx / .xls / .csv)</h3>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          disabled={uploading}
          className="text-sm"
        />
        {uploading && <p className="text-xs text-muted">Reading file…</p>}
      </div>

      <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted">
          {unassignedDefinitions.length} unassigned definition(s) &middot;{" "}
          {unassignedTeams.length} team(s) without a definition
        </p>
        <button
          onClick={handleAutoAssign}
          disabled={assigning || unassignedDefinitions.length === 0 || unassignedTeams.length === 0}
          className="bg-violet hover:bg-violet-dark text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
        >
          {assigning ? "Assigning…" : "Auto-assign remaining"}
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {definitions.length === 0 ? (
        <p className="text-sm text-muted">No definitions uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {definitions.map((def) => (
            <div
              key={def.id}
              className="bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-3 flex-wrap"
            >
              <p className="text-sm flex-1 min-w-[220px]">{def.text}</p>
              <div className="flex items-center gap-2">
                <select
                  value={def.assignedTeamId ?? ""}
                  onChange={(e) => handleReassign(def, e.target.value)}
                  className="text-sm border border-border rounded-md px-2 py-1"
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.teamName}
                      {t.definitionId && t.definitionId !== def.id ? " (has one)" : ""}
                    </option>
                  ))}
                </select>
                {!def.assignedTeamId && (
                  <button
                    onClick={() => handleDelete(def)}
                    className="text-xs text-danger px-2 py-1"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminPageContent />
    </ProtectedRoute>
  );
}