"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { COVER_IMAGE, PARTS, partsOnPhoto } from "@/lib/parts";
import type { Picture } from "@/lib/thesis";
import styles from "./thesis.module.css";

const Build3D = dynamic(() => import("./build3d").then((m) => m.Build3D), {
  ssr: false,
  loading: () => <p className={styles.stageLoading}>Načítám 3D model sestavy…</p>,
});

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The cover photo and a 3D model of the same build, sharing one hover state:
 * pointing at a part in the list lights it up in the view, and in 3D it also
 * lights up the connector it plugs into.
 */
export function HeroView({
  cover,
  steps,
}: {
  cover: Picture;
  /** Section number → heading id, so a part can link to its step. */
  steps: Record<string, string>;
}) {
  const [view, setView] = useState<"photo" | "model">("photo");
  const [hovered, setHovered] = useState<string | null>(null);

  // the callout coordinates only describe the original photo
  const callouts = cover.src === COVER_IMAGE ? partsOnPhoto : [];
  const listed = view === "photo" ? callouts : PARTS;

  return (
    <figure className={styles.heroFigure}>
      <div className={styles.viewSwitch} role="group" aria-label="Zobrazení sestavy">
        <button type="button" onClick={() => setView("photo")} aria-pressed={view === "photo"}>
          Fotografie
        </button>
        <button type="button" onClick={() => setView("model")} aria-pressed={view === "model"}>
          3D model
        </button>
      </div>

      {view === "photo" ? (
        <div
          className={styles.heroPlate}
          style={{ "--ar": cover.w / cover.h } as React.CSSProperties}
        >
          <Image
            src={`/images/${cover.src}`}
            width={cover.w}
            height={cover.h}
            alt={cover.caption ?? "Zvolené komponenty"}
            sizes="(max-width: 1040px) 100vw, 520px"
            priority
          />

          {callouts.map((part) => (
            <a
              key={part.id}
              href={steps[part.step] ? `#${steps[part.step]}` : undefined}
              className={styles.callout}
              data-active={hovered === part.id || undefined}
              style={{
                left: `${part.photo.x}%`,
                top: `${part.photo.y}%`,
                animationDelay: `${0.55 + part.photo.n * 0.07}s`,
              }}
              onMouseEnter={() => setHovered(part.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className={styles.calloutDot}>{pad(part.photo.n)}</span>
              <span className={styles.calloutChip}>{part.label}</span>
            </a>
          ))}
        </div>
      ) : (
        <Build3D hovered={hovered} onHover={setHovered} />
      )}

      <figcaption className={styles.heroLegend}>
        {listed.map((part) => (
          <a
            key={part.id}
            href={steps[part.step] ? `#${steps[part.step]}` : undefined}
            data-active={hovered === part.id || undefined}
            onMouseEnter={() => setHovered(part.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <b>{view === "photo" && part.photo ? pad(part.photo.n) : part.step}</b> {part.label}
          </a>
        ))}
      </figcaption>
    </figure>
  );
}
