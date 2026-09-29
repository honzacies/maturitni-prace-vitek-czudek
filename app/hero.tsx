import Image from "next/image";
import type { NavEntry, Thesis } from "@/lib/thesis";
import styles from "./thesis.module.css";

/**
 * Callouts over the cover photo, numbered in the order the parts get installed.
 * Positions are percentages of that one photo, so they only apply to it.
 */
const COVER = "image2.jpeg";

const CALLOUTS = [
  { step: "3.2.1", label: "Procesor", x: 28, y: 77 },
  { step: "3.2.2", label: "SSD", x: 10, y: 51 },
  { step: "3.2.3", label: "Chladič", x: 47, y: 78 },
  { step: "3.2.5", label: "Základní deska", x: 79, y: 54 },
  { step: "3.2.6", label: "Zdroj", x: 35, y: 26 },
  { step: "3.2.7", label: "Grafická karta", x: 59, y: 25 },
  { step: "3.2.8", label: "Síťová karta", x: 68, y: 77 },
];

export function Hero({ meta, nav }: { meta: Thesis["meta"]; nav: NavEntry[] }) {
  const sectionId = (step: string) =>
    nav.find((entry: NavEntry) => entry.label.startsWith(`${step} `))?.id;

  const callouts =
    meta.cover?.src === COVER
      ? CALLOUTS.map((callout, i) => ({ ...callout, n: i + 1, id: sectionId(callout.step) }))
      : [];

  return (
    <header className={styles.hero}>
      <div className={styles.heroText}>
        <p className={styles.eyebrow}>
          <Image
            src={`/images/${meta.logo.src}`}
            width={meta.logo.w}
            height={meta.logo.h}
            alt=""
            className={styles.crest}
          />
          {meta.school}
        </p>

        <h1 className={styles.heroTitle}>{meta.title}</h1>

        <p className={styles.heroKind}>Maturitní práce · {meta.author}</p>

        <dl className={styles.plate}>
          {meta.fields.map((field) => (
            <div key={field.label}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>

        <p className={styles.heroLede}>
          Návrh sestavy, montáž krok za krokem a ověření stability. Body na fotografii
          vedou na jednotlivé kroky montáže.
        </p>
      </div>

      {meta.cover && (
        <figure className={styles.heroFigure}>
          <div
            className={styles.heroPlate}
            style={{ "--ar": meta.cover.w / meta.cover.h } as React.CSSProperties}
          >
            <Image
              src={`/images/${meta.cover.src}`}
              width={meta.cover.w}
              height={meta.cover.h}
              alt={meta.cover.caption ?? "Zvolené komponenty"}
              sizes="(max-width: 1040px) 100vw, 520px"
              priority
            />

            {callouts.map(({ n, label, x, y, id }) => (
              <a
                key={n}
                href={id ? `#${id}` : undefined}
                className={styles.callout}
                style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${0.55 + n * 0.07}s` }}
              >
                <span className={styles.calloutDot}>{String(n).padStart(2, "0")}</span>
                <span className={styles.calloutChip}>{label}</span>
              </a>
            ))}
          </div>

          <figcaption className={styles.heroLegend}>
            {callouts.map(({ n, label, id }) => (
              <a key={n} href={id ? `#${id}` : undefined}>
                <b>{String(n).padStart(2, "0")}</b> {label}
              </a>
            ))}
          </figcaption>
        </figure>
      )}
    </header>
  );
}
