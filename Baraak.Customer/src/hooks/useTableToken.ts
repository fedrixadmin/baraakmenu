// src/hooks/useTableToken.ts
import { useEffect, useState } from "react";

function normalize(t?: string | null) {
  if (!t) return "";
  return t.trim().toUpperCase();
}

/** Reads ?t= / ?token= / ?table= and persists to localStorage. */
export function useTableToken() {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const fromUrl = normalize(sp.get("t") || sp.get("token") || sp.get("table"));
    const fromLS = normalize(localStorage.getItem("tableToken"));

    if (fromUrl) {
      localStorage.setItem("tableToken", fromUrl);
      setToken(fromUrl);
    } else if (fromLS) {
      setToken(fromLS);
    } else {
      setToken("");
    }
  }, []);

  return token || "";
}
