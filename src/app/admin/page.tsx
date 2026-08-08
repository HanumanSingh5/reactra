"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusPill from "@/components/StatusPill";
import { Announcement, EventConfig, Round1Status, SeatAssignment, Team } from "@/lib/types";

type Tab = "announcements" | "rounds" | "teams" | "seating";

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

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminPageContent />
    </ProtectedRoute>
  );
}
