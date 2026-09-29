import Image from "next/image";
import { HeroView } from "./hero-view";
import styles from "./thesis.module.css";
import type { NavEntry, Thesis } from "@/lib/thesis";

export function Hero({ meta, nav }: { meta: Thesis["meta"]; nav: NavEntry[] }) {
  // "3.2.7 Montáž grafické karty" → { "3.2.7": "3-2-7-montaz-graficke-karty" }
  const steps = Object.fromEntries(
    nav.flatMap((entry) => {
      const number = /^([\d.]+)\s/.exec(entry.label)?.[1];
      return number ? [[number, entry.id] as const] : [];
    }),
  );

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
          Návrh sestavy, montáž krok za krokem a ověření stability. Přejeď po dílu
          a uvidíš, kam v sestavě patří; kliknutím se dostaneš na jeho kapitolu.
        </p>
      </div>

      {meta.cover && <HeroView cover={meta.cover} steps={steps} />}
    </header>
  );
}
