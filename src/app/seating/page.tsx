"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SeatAssignment, Team } from "@/lib/types";

function SeatingPageContent() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [seat, setSeat] = useState<SeatAssignment | null>(null);
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
    if (!team) return;
    const q = query(collection(db, "seating"), where("teamId", "==", team.id));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        setSeat({ id: d.id, ...(d.data() as Omit<SeatAssignment, "id">) });
      } else {
        setSeat(null);
      }
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

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold mb-1">Your seating</h1>
      <p className="text-muted text-sm mb-6">
        Physical seating arrangement for {team.teamName}
      </p>

      {!seat ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted text-sm">
          Seating hasn&apos;t been assigned yet. Check back closer to the event.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted text-sm mb-1">Room</p>
          <p className="text-3xl font-bold font-display mb-6">{seat.room}</p>
          <p className="text-muted text-sm mb-1">Table</p>
          <p className="text-3xl font-bold font-display text-violet">{seat.tableNumber}</p>
        </div>
      )}
    </div>
  );
}

export default function SeatingPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <SeatingPageContent />
    </ProtectedRoute>
  );
}
