"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("onprotec-theme") as "dark" | "light" | null;
      const initial = saved || "light";
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
      title={theme === "dark" ? "Cambiar a Vista Clara (OnProtec Web)" : "Cambiar a Vista Oscura"}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all duration-200 ${
        theme === "dark"
          ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300"
          : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-[#2a285c]"
      } ${className}`}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-3.5 h-3.5 text-[#f4730a]" />
          <span>Vista Clara</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-[#2a285c]" />
          <span>Vista Oscura</span>
        </>
      )}
    </button>
  );
}
