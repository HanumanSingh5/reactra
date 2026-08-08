"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const links = [...baseLinks];
  if (user?.role === "student") {
    links.push(
      { href: "/team", label: "Team" },
      { href: "/results", label: "Results" },
      { href: "/seating", label: "Seating" }
    );
  }
  if (user?.role === "evaluator") {
    links.push({ href: "/evaluate", label: "Evaluate" });
  }
  if (user?.role === "admin") {
    links.push({ href: "/admin", label: "Admin" });
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="bg-ink text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
        <Link href="/" className="font-display font-bold text-lg tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber inline-block" />
          Reactra
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline text-xs font-mono text-white/50 uppercase tracking-wider">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium px-3 py-1.5 rounded-md bg-violet hover:bg-violet-dark transition-colors"
            >
              Log in
            </Link>
          )}
        </div>
      </div>

      {/* mobile nav */}
      {user && (
        <nav className="md:hidden flex overflow-x-auto gap-1 px-5 pb-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap font-medium ${
                pathname === l.href
                  ? "bg-white/10 text-white"
                  : "text-white/70"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
