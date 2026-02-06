"use client"
import React from "react";
import { useRouter } from "next/navigation";
import { CanvasPreview } from "../components/Canvas"
import { PencilRuler, Share2, Cloud, Github } from "lucide-react";
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export default function Home() {

   const router = useRouter();
  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 via-white to-red-50 text-gray-800">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b bg-white/70 backdrop-blur">
        <div className="flex items-center gap-2 font-semibold text-lg text-blue-600">
          <PencilRuler className="w-6 h-6" />
          DrawApp
        </div>

        <div className="flex items-center gap-6 text-sm">
          <a className="hover:text-blue-600" href="#features">Features</a>
          <a className="hover:text-red-500" href="#about">About</a>

          <button onClick={() => { 
            router.push("/signin")
          }} className="px-4 py-2 rounded-2xl border bg-blue-500 text-white hover:bg-blue-800">
            Sign In
          </button>

          <button onClick={() => { 
            router.push("/signup")
          }} className="px-4 py-2 rounded-2xl bg-red-500 text-white hover:bg-red-600 shadow-sm">
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 py-24 max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Sketch ideas visually, collaborate instantly.
          </h1>

          <p className="mt-6 text-gray-600">
            Excelidraw is a virtual whiteboard for sketching hand-drawn like
            diagrams. Built for developers, teams, and students who want to
            explain ideas faster.
          </p>

          <div className="mt-8 flex gap-4">
            <button className="px-6 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow">
              Start Drawing
            </button>
            <button className="px-6 py-3 rounded-2xl border bg-red-400 text-white hover:bg-red-800">
              Live Demo
            </button>
          </div>
        </div>

        <div className="bg-linear-to-br from-blue-500 to-red-500 rounded-2xl h-80 flex items-center justify-center text-gray-500 border">
          <CanvasPreview/>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-20 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-semibold">Features</h2>
          <p className="text-gray-600 mt-3">
            Everything you need to brainstorm and collaborate visually.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <FeatureCard
              icon={<PencilRuler className="text-blue-600" />}
              title="Free Drawing"
              desc="Create diagrams with a natural hand-drawn feel."
            />

            <FeatureCard
              icon={<Share2 className="text-red-500" />}
              title="Realtime Collaboration"
              desc="Invite others and draw together instantly."
            />

            <FeatureCard
              icon={<Cloud className="text-blue-500" />}
              title="Cloud Sync"
              desc="Your drawings are saved automatically."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 text-center">
        <h2 className="text-3xl font-semibold">Start creating in seconds</h2>
        <p className="text-gray-600 mt-3">
          No signup required. Open the canvas and begin drawing.
        </p>

        <button className="mt-8 px-8 py-3 rounded-2xl bg-linear-to-r from-blue-600 to-red-500 text-white shadow-md hover:opacity-90">
          Launch App
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t px-8 py-6 flex justify-between text-sm text-gray-500 bg-white">
        <span>© {new Date().getFullYear()} Excelidraw</span>

        <div className="flex items-center gap-4">
          <Github className="w-4 h-4" />
          <span>GitHub</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border text-left hover:shadow-md transition">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-gray-600 mt-2 text-sm">{desc}</p>
    </div>
  );
}
