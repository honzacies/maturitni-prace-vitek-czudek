"use client";

import { useEffect, useState } from "react";
import type { NavEntry } from "@/lib/thesis";
import styles from "./thesis.module.css";

type Theme = "dark" | "light";

/** Table of contents drawn as a trace, with a pad at every section. */
export function Nav({ entries }: { entries: NavEntry[] }) {
  const [activeId, setActiveId] = useState(entries[0]?.id);
  // only used below the mobile breakpoint; on desktop the list is always visible via CSS
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const headings = document.querySelectorAll<HTMLElement>("[data-section]");
    const observer = new IntersectionObserver(
      (records) => {
        const entered = records.filter((r) => r.isIntersecting).at(-1);
        if (entered) setActiveId(entered.target.id);
      },
      { rootMargin: "0px 0px -75% 0px" },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const saved = document.documentElement.dataset.theme as Theme | undefined;
    setTheme(saved ?? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // private mode — the choice just won't persist
    }
  }

  return (
    <nav className={styles.nav} aria-label="Obsah práce" data-open={open || undefined}>
      <button
        type="button"
        className={styles.navToggle}
        aria-expanded={open}
        aria-controls="obsah"
        onClick={() => setOpen(!open)}
      >
        Obsah
      </button>

      <div id="obsah" className={styles.navList}>
        {entries.map(({ id, label, level }) => (
          <a
            key={id}
            href={`#${id}`}
            className={styles[`level${level}`]}
            aria-current={id === activeId ? "location" : undefined}
            onClick={() => setOpen(false)}
          >
            {label}
          </a>
        ))}

        <button type="button" className={styles.themeToggle} onClick={toggleTheme}>
          {theme === "light" ? "Tmavý režim" : "Světlý režim"}
        </button>
      </div>
    </nav>
  );
}
