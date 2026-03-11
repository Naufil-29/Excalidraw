"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CanvasPreview } from "../components/Canvas";
import {
  PencilRuler,
  Github,
  Sparkles,
  ArrowRight,
  PenLine,
  Users,
  Zap,
} from "lucide-react";
import { createRoom, getRoomBySlug } from "@/lib/rooms";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export default function Home() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [navError, setNavError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setHasToken(!!token);
    }
  }, []);

  async function handleCreateRoom() {
    setNavError("");
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) {
      setHasToken(false);
      setNavError("You must be signed in to create a room.");
      return;
    }
    const name = window.prompt("Enter a room name (slug):");
    if (!name) return;
    const result = await createRoom(name, token);
    if (result.ok) {
      router.push(`/canvas/${result.roomId}`);
    } else {
      setNavError(result.message);
    }
  }

  async function handleJoinRoom() {
    setNavError("");
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) {
      setHasToken(false);
      setNavError("You must be signed in to join a room.");
      return;
    }
    const slugOrId = window.prompt("Enter room slug:");
    if (!slugOrId) return;
    const result = await getRoomBySlug(slugOrId);
    if (result.ok) {
      router.push(`/canvas/${result.roomId}`);
    } else {
      setNavError(result.message);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a2e] overflow-x-hidden">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-4 border-b border-[#e5e7eb]/80 bg-white/80 backdrop-blur-xl">
        <a href="/" className="flex items-center gap-2.5 font-semibold text-[#1a1a2e] hover:opacity-90 transition">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6366f1] text-white shadow-lg shadow-indigo-500/25">
            <PencilRuler className="h-4 w-4" />
          </span>
          <span className="text-lg tracking-tight">DrawApp</span>
        </a>

        <div className="flex items-center gap-1 md:gap-4">
          <a
            href="#features"
            className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#1a1a2e] transition"
          >
            Features
          </a>
          {hasToken ? (
            <>
              <button
                onClick={handleCreateRoom}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-md shadow-indigo-500/20 transition"
              >
                Create Room
              </button>
              <button
                onClick={handleJoinRoom}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[#e2e8f0] bg-white text-[#1a1a2e] hover:bg-[#f8fafc] transition"
              >
                Join Room
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/signin")}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#64748b] hover:text-[#1a1a2e] transition"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-md shadow-indigo-500/20 transition"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {navError && (
        <div className="relative z-10 px-6 md:px-12 py-3 text-sm text-[#b91c1c] bg-[#fef2f2] border-b border-[#fecaca]">
          {navError}
        </div>
      )}

      {/* Hero */}
      <section className="relative z-10 px-6 md:px-12 pt-16 md:pt-24 pb-20 md:pb-28 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Hand-drawn style whiteboard
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#1a1a2e] leading-[1.1]">
              Sketch ideas visually,
              <br />
              <span className="text-[#6366f1]">collaborate instantly.</span>
            </h1>
            <p className="mt-6 text-lg text-[#64748b] max-w-lg leading-relaxed">
              A virtual whiteboard for diagrams that feel hand-drawn. Built for
              developers, teams, and anyone who thinks better with a pen.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              {hasToken ? (
                <>
                  <button
                    onClick={handleCreateRoom}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-lg shadow-indigo-500/30 transition"
                  >
                    New canvas
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleJoinRoom}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold border-2 border-[#e2e8f0] text-[#1a1a2e] hover:border-[#6366f1] hover:text-[#6366f1] transition"
                  >
                    Join a room
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/signup")}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-lg shadow-indigo-500/30 transition"
                  >
                    Get started free
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => router.push("/signin")}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold border-2 border-[#e2e8f0] text-[#1a1a2e] hover:border-[#6366f1] hover:text-[#6366f1] transition"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-100/80 to-violet-100/50 blur-2xl" />
            <div className="relative rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl shadow-[#6366f1]/10 overflow-hidden">
              <div className="p-3 border-b border-[#e2e8f0] bg-[#f8fafc] flex gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
              </div>
              <div className="p-4 md:p-6 min-h-[280px] md:min-h-[320px] flex items-center justify-center bg-[#fafafa]">
                <CanvasPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 py-20 md:py-28 px-6 md:px-12 bg-white border-y border-[#e5e7eb]/80"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] tracking-tight">
              Everything you need to think on canvas
            </h2>
            <p className="mt-4 text-lg text-[#64748b]">
              Simple tools, real-time sync, and a feel that encourages ideas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={<PenLine className="h-6 w-6 text-[#6366f1]" />}
              title="Free drawing"
              desc="Shapes, lines, and text with a natural hand-drawn look. Resize and move with corner handles."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6 text-[#6366f1]" />}
              title="Realtime collaboration"
              desc="Create or join rooms. Everyone sees the same canvas and updates as they happen."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-[#6366f1]" />}
              title="Cloud sync"
              desc="Shapes and positions are saved. Reload or come back later and pick up where you left off."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] tracking-tight">
            Start creating in seconds
          </h2>
          <p className="mt-4 text-lg text-[#64748b]">
            Sign up, create a room, and share the link. No installs, no plugins.
          </p>
          <div className="mt-10">
            {hasToken ? (
              <button
                onClick={handleCreateRoom}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-lg shadow-indigo-500/30 transition"
              >
                Create a canvas
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => router.push("/signup")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-lg shadow-indigo-500/30 transition"
              >
                Launch app
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#e5e7eb]/80 px-6 md:px-12 py-8 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-[#64748b]">
            © {new Date().getFullYear()} DrawApp
          </span>
          <div className="flex items-center gap-6 text-sm text-[#64748b]">
            <a
              href="#"
              className="flex items-center gap-1.5 hover:text-[#6366f1] transition"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="group p-6 md:p-8 rounded-2xl border border-[#e2e8f0] bg-white hover:border-[#6366f1]/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#6366f1] group-hover:bg-indigo-100 transition">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-semibold text-[#1a1a2e]">{title}</h3>
      <p className="mt-2 text-[#64748b] leading-relaxed">{desc}</p>
    </div>
  );
}

/*
 * CHANGELOG (landing page UI):
 * - Redesigned for a modern Excalidraw-style look: indigo accent, soft grid background, clear typography hierarchy.
 * - Navbar: logo with icon in rounded pill, refined buttons (Create/Join or Sign In/Sign Up), backdrop blur.
 * - Hero: badge, large headline with accent color, canvas preview in a mock window (traffic lights + shadow).
 * - Features: three cards with icons in rounded containers, hover border/shadow, updated copy.
 * - CTA and footer: single accent CTA, minimal footer. All existing behavior (hasToken, create/join room, errors) preserved.
 */
