// Helpers for the static (GitHub Pages) demo build. The normal app always
// talks to the Express API; these only activate when a build is created with
// VITE_DEMO_MODE=true, in which case the backend is emulated in the browser.

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const groqKeyStorage = "skillquest.groqKey";

export function getGroqKey(): string {
  try {
    return localStorage.getItem(groqKeyStorage) || "";
  } catch {
    return "";
  }
}

export function setGroqKey(value: string | null) {
  try {
    if (value && value.trim()) localStorage.setItem(groqKeyStorage, value.trim());
    else localStorage.removeItem(groqKeyStorage);
  } catch {
    // Storage unavailable (private mode): the offline engine keeps working.
  }
  window.dispatchEvent(new Event("skillquest:ai-key-changed"));
}

export function hasGroqKey(): boolean {
  return Boolean(getGroqKey());
}

export function openAiSettings() {
  window.dispatchEvent(new Event("skillquest:ai-settings"));
}
