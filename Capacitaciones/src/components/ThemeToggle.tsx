"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("onprotec-theme") as "dark" | "light" | null;
      const initial = saved || "dark";
      setTheme(initial);
      document.documentElement.setAttribute("data-theme", initial);
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.setAttribute("content", initial);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("onprotec-theme", next);
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.setAttribute("content", next);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? "Cambiar a Vista Clara" : "Cambiar a Vista Oscura"}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
        theme === "dark"
          ? "bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-amber-300"
          : "bg-amber-50 hover:bg-amber-100 border-amber-300 text-slate-900 shadow-sm"
      } ${className}`}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Vista Clara</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-900" />
          <span>Vista Oscura</span>
        </>
      )}
    </button>
  );
}
