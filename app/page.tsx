import Image from "next/image";
import { Fragment } from "react";
import { Hero } from "./hero";
import { Lightbox } from "./lightbox";
import { Nav } from "./nav";
import styles from "./thesis.module.css";
import { thesis, type Block, type Inline, type Picture } from "@/lib/thesis";

const image = (src: string) => `/images/${src}`;

/** "3.2.7 Montáž grafické karty" → ["3.2.7", "Montáž grafické karty"] */
function splitNumber(label: string): [string | null, string] {
  const match = /^([\d.]+)\s+(.*)$/.exec(label);
  return match ? [match[1], match[2]] : [null, label];
}

function Text({ content }: { content: Inline[] }) {
  return content.map((run, i) => {
    if ("href" in run)
      return (
        <a key={i} href={run.href} rel="noreferrer">
          {run.text}
        </a>
      );
    if ("bold" in run) return <strong key={i}>{run.text}</strong>;
    return <Fragment key={i}>{run.text}</Fragment>;
  });
}

function Figure({ picture, caption }: { picture: Picture; caption?: string }) {
  return (
    <figure className={styles.figure}>
      <a href={image(picture.src)} data-zoom={caption ?? ""} target="_blank" rel="noreferrer">
        <Image
          src={image(picture.src)}
          width={picture.w}
          height={picture.h}
          alt={caption ?? ""}
          sizes="(max-width: 720px) 100vw, 640px"
        />
      </a>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Section({ block }: { block: Block }) {
  switch (block.kind) {
    case "heading": {
      const Tag = `h${block.level + 1}` as "h2" | "h3" | "h4";
      const [number, text] = splitNumber(block.label);
      return (
        <Tag id={block.id} data-section className={styles[`h${block.level}`]}>
          {number && <span className={styles.designator}>{number}</span>}
          {text}
        </Tag>
      );
    }

    case "paragraph":
      return (
        <p>
          <Text content={block.content} />
        </p>
      );

    case "list":
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>
              <Text content={item} />
            </li>
          ))}
        </ul>
      );

    case "figures":
      return (
        <div className={styles.figures} data-columns={Math.min(block.images.length, 3)}>
          {block.images.map((img) => (
            <Figure key={img.src} picture={img} caption={img.caption ?? block.caption} />
          ))}
        </div>
      );

    case "table":
      return (
        <div className={styles.spec}>
          {block.caption && <p className={styles.specCaption}>{block.caption}</p>}
          <table>
            <thead>
              <tr>
                {block.head.map((cell) => (
                  <th key={cell}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export default function Page() {
  const { meta, nav, blocks } = thesis;

  return (
    <>
      <Hero meta={meta} nav={nav} />

      <div className={styles.layout}>
        <Nav entries={nav} />
        <main className={styles.main}>
          {blocks.map((block, i) => (
            <Section key={i} block={block} />
          ))}
        </main>
      </div>

      <Lightbox />
    </>
  );
}
