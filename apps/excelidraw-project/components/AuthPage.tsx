"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup, signin } from "@/lib/auth";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignin) {
      const result = await signin({ username, password });
      setLoading(false);
      if (result.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", result.token);
        }
        router.push("/");
      } else {
        setError(result.message);
      }
    } else {
      const result = await signup({ username, password, name });
      setLoading(false);
      if (result.ok) {
        router.push("/signin");
      } else {
        setError(result.message);
      }
    }
  }

  return (
    <div className="text-center bg-linear-to-b from-blue-200 via-white to-red-200">
      <div className="w-screen h-screen flex justify-center items-center">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 w-120 px-10 py-20 bg-white shadow-2xl rounded-2xl"
        >
          {isSignin ? (
            <h1 className="text-4xl font-bold">Sign In</h1>
          ) : (
            <h1 className="text-4xl font-extrabold">Sign Up</h1>
          )}

          {error && (
            <p className="text-red-600 text-sm" role="alert">
              {error}
            </p>
          )}

          <input
            className="border-2 w-full h-10 rounded px-3"
            type="text"
            placeholder="Username (3–20 chars)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={20}
          />
          {!isSignin && (
            <input
              className="border-2 w-full h-10 rounded px-3"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            className="border-2 w-full h-10 rounded px-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full h-10 rounded-xl text-white text-xl font-bold ${
              isSignin ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"
            } disabled:opacity-50`}
          >
            {loading ? "Please wait..." : isSignin ? "Sign In" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}

/*
 * CHANGELOG (auth wiring):
 * - Wired signup/signin to http-backend via @/lib/auth.
 * - Added controlled state: username, password, name (signup only), error, loading.
 * - Signup: on success navigates to /signin.
 * - Signin: on success stores token in localStorage and navigates to /.
 * - Form submit handlers call APIs; error message shown on failure.
 * - Fixed button label "singup" -> "Sign Up", fixed broken button className.
 */
