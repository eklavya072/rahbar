"use client";
// Encrypted case vault: AES-256-GCM with a key derived from the user's passphrase (PBKDF2-SHA-256, 310,000 rounds).
// Ciphertext lives in this browser (localStorage) or in an exported .aftercrash file. No server ever sees it.

const ITER = 310_000;
const PREFIX = "aftercrash-vault:";
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITER, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export interface SealedCase {
  v: 1;
  label: string;
  savedAt: string;
  salt: string;
  iv: string;
  data: string;
}

export async function seal(payload: unknown, passphrase: string, label: string): Promise<SealedCase> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(payload)));
  return { v: 1, label, savedAt: new Date().toISOString(), salt: b64(salt), iv: b64(iv), data: b64(data) };
}

export async function unseal<T>(sealed: SealedCase, passphrase: string): Promise<T> {
  const key = await deriveKey(passphrase, unb64(sealed.salt));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(sealed.iv) as BufferSource }, key, unb64(sealed.data) as BufferSource);
  return JSON.parse(dec.decode(plain)) as T;
}

export function listSaved(): SealedCase[] {
  const out: SealedCase[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(PREFIX)) continue;
      const v = JSON.parse(localStorage.getItem(k) ?? "null");
      if (v?.v === 1) out.push(v);
    }
  } catch {}
  return out.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export function storeSealed(s: SealedCase): boolean {
  try {
    localStorage.setItem(PREFIX + s.label, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function removeSealed(label: string) {
  try {
    localStorage.removeItem(PREFIX + label);
  } catch {}
}

export function downloadSealed(s: SealedCase) {
  const blob = new Blob([JSON.stringify(s)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${s.label.replace(/[^\w-]+/g, "_")}.aftercrash`;
  a.click();
}

/** SHA-256 hex of bytes or text — for the tamper-evident claim packet. */
export async function sha256Hex(input: ArrayBuffer | string): Promise<string> {
  const bytes = typeof input === "string" ? enc.encode(input) : input;
  const h = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
