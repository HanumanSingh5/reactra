"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Announcement } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Announcement, "id">) }))
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <section className="bg-ink text-white">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <p className="font-mono text-amber text-sm mb-3 tracking-wide">
            INTERNAL EVENT PORTAL
          </p>
          <h1 className="text-4xl md:text-5xl font-bold font-display leading-tight max-w-2xl">
            Welcome to Reactra
          </h1>
          <p className="text-white/60 mt-4 max-w-xl">
            Team registration, round updates, evaluation results, and seating —
            everything for the hackathon in one place.
          </p>
          {!user && (
            <a
              href="/login"
              className="inline-block mt-6 bg-violet hover:bg-violet-dark px-5 py-2.5 rounded-md font-medium transition-colors"
            >
              Log in to get started
            </a>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-10">
        <h2 className="text-xl font-bold mb-5">Announcements</h2>

        {loading && <p className="text-muted text-sm">Loading announcements…</p>}

        {!loading && announcements.length === 0 && (
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted text-sm">
            No announcements yet. Check back soon.
          </div>
        )}

        <div className="space-y-4">
          {announcements.map((a) => (
            <article
              key={a.id}
              className="bg-card border border-border rounded-lg p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-lg">{a.title}</h3>
                <span className="text-xs text-muted font-mono whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-foreground/80 mt-2 whitespace-pre-wrap">
                {a.message}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
