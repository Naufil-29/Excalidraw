import { HTTP_BACKEND } from "@/config";

export type SignupPayload = {
  username: string;
  password: string;
  name: string;
};

export type SigninPayload = {
  username: string;
  password: string;
};

export type SignupResponse =
  | { ok: true; userId: string }
  | { ok: false; message: string };

export type SigninResponse =
  | { ok: true; token: string }
  | { ok: false; message: string };

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  try {
    const res = await fetch(`${HTTP_BACKEND}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, message: data.message ?? "Signup failed" };
    }
    return { ok: true, userId: data.userId };
  } catch (e) {
    return { ok: false, message: "Network error" };
  }
}

export async function signin(payload: SigninPayload): Promise<SigninResponse> {
  try {
    const res = await fetch(`${HTTP_BACKEND}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, message: data.Msg ?? data.message ?? "Sign in failed" };
    }
    return { ok: true, token: data.token };
  } catch (e) {
    return { ok: false, message: "Network error" };
  }
}

/*
 * CHANGELOG (auth wiring):
 * - Added signup() and signin() that call http-backend /signup and /signin.
 * - Signup expects { username, password, name }; signin expects { username, password }.
 * - Returns typed { ok, userId } or { ok, token } / { ok: false, message }.
 */
