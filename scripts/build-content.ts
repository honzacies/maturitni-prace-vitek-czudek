/**
 * Converts the .docx thesis into content/thesis.json + public/images/*.
 * Run: npm run content -- [path/to/file.docx]
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import JSZip from "jszip";
// aliased so the DOM globals from lib.dom don't shadow the parser's own node types
import { DOMParser, type Document, type Element } from "@xmldom/xmldom";
import type { Block, Inline, NavEntry, Picture, Thesis } from "../lib/thesis";

const DOCX = process.argv[2] ?? "Czudek_maturitni_prace.docx";
const IMAGE_DIR = join("public", "images");
const OUT = join("content", "thesis.json");

/** Word paragraph styles, as this document uses them. */
const HEADING_LEVEL: Record<string, 1 | 2 | 3> = { Nad1: 1, Nad2: 2, Nad3: 3 };
const UNNUMBERED_HEADING = "Nadneislovan";
const CAPTION_STYLE = "Titulek";
const LIST_STYLE = "Odstavecseseznamem";

const IMAGE_MARK = "\u0000";
const URL_RE = /https?:\/{1,2}\S+/g;
const LABEL_RE = /^([A-ZÁ-Ž][^:.]{2,45}):\s+/;
const CAPTION_SPLIT = /(?=Obr\.\s*\d)/;

type Para = { kind: "p"; style: string; text: string; listItem: boolean };
type Table = { kind: "tbl"; rows: string[][] };

// ---------------------------------------------------------------- docx → paras

/** Intrinsic pixel size per image file, so pages can reserve the space. */
const imageSizes = new Map<string, { w: number; h: number }>();

/**
 * Reads the intrinsic size out of a PNG or JPEG header. Word re-encodes the
 * images on import, so there is no EXIF rotation to account for.
 */
function readImageSize(bytes: Buffer, name: string): { w: number; h: number } {
  if (bytes.readUInt32BE(0) === 0x89504e47) {
    return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) };
  }
  for (let i = 2; i + 9 < bytes.length; ) {
    if (bytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = bytes[i + 1];
    // any start-of-frame marker carries the dimensions
    const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isFrame) return { h: bytes.readUInt16BE(i + 5), w: bytes.readUInt16BE(i + 7) };
    i += 2 + bytes.readUInt16BE(i + 2);
  }
  throw new Error(`${name}: could not read image dimensions`);
}

/** Word writes a BOM in front of the XML declaration, which the parser rejects. */
const parseXml = (xml: string) =>
  new DOMParser().parseFromString(xml.replace(/^\u{FEFF}/u, ""), "text/xml");

const children = (node: Element | Document, localName: string): Element[] =>
  Array.from(node.childNodes).filter(
    (n): n is Element => n.nodeType === 1 && (n as Element).localName === localName,
  );

/** Text of a paragraph or cell, with images inlined as \0filename\0. */
function readRuns(node: Element, imageNames: Map<string, string>): string {
  let out = "";
  const walk = (parent: Element) => {
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType !== 1) continue;
      const el = node as Element;
      switch (el.localName) {
        case "t":
          out += el.textContent ?? "";
          break;
        case "blip": {
          const id = el.getAttribute("r:embed");
          const name = id && imageNames.get(id);
          if (name) out += `${IMAGE_MARK}${name}${IMAGE_MARK}`;
          break;
        }
        case "tab":
        case "br":
          out += " ";
          break;
        default:
          walk(el);
      }
    }
  };
  walk(node);
  return out;
}

async function readDocx(path: string): Promise<(Para | Table)[]> {
  const zip = await JSZip.loadAsync(await readFile(path));

  const relsXml = await zip.file("word/_rels/document.xml.rels")!.async("string");
  const imageNames = new Map<string, string>();
  for (const rel of Array.from(
    parseXml(relsXml).getElementsByTagName("Relationship"),
  )) {
    const target = rel.getAttribute("Target");
    const id = rel.getAttribute("Id");
    if (target && id) imageNames.set(id, target.split("/").pop()!);
  }

  await rm(IMAGE_DIR, { recursive: true, force: true });
  await mkdir(IMAGE_DIR, { recursive: true });
  for (const file of zip.file(/media\/.+/)) {
    const name = file.name.split("/").pop()!;
    const bytes = await file.async("nodebuffer");
    await writeFile(join(IMAGE_DIR, name), bytes);
    imageSizes.set(name, readImageSize(bytes, name));
  }

  const docXml = await zip.file("word/document.xml")!.async("string");
  const doc = parseXml(docXml);
  const body = doc.getElementsByTagName("w:body")[0];

  const out: (Para | Table)[] = [];
  for (const node of Array.from(body.childNodes)) {
    if (node.nodeType !== 1) continue;
    const el = node as Element;
    if (el.localName === "p") {
      const props = children(el, "pPr")[0];
      out.push({
        kind: "p",
        style: props ? (children(props, "pStyle")[0]?.getAttribute("w:val") ?? "") : "",
        text: readRuns(el, imageNames).replace(/[ \t]+/g, " ").trim(),
        listItem: props ? children(props, "numPr").length > 0 : false,
      });
    } else if (el.localName === "tbl") {
      out.push({
        kind: "tbl",
        rows: children(el, "tr").map((tr) =>
          children(tr, "tc").map((tc) => readRuns(tc, imageNames).replace(/\s+/g, " ").trim()),
        ),
      });
    }
  }
  return out;
}

// ------------------------------------------------------------------- inline text

/** Splits a paragraph into plain runs, links, and a bolded `Label:` prefix. */
function toInlines(text: string): Inline[] {
  const out: Inline[] = [];
  let rest = text;

  const label = LABEL_RE.exec(rest);
  if (label) {
    out.push({ text: `${label[1]}:`, bold: true });
    rest = ` ${rest.slice(label[0].length)}`;
  }

  let cursor = 0;
  for (const match of rest.matchAll(URL_RE)) {
    if (match.index > cursor) out.push({ text: rest.slice(cursor, match.index) });
    // one source in the document is typed with a single slash — keep the label, fix the target
    out.push({ text: match[0], href: match[0].replace(/^(https?:)\/(?!\/)/, "$1//") });
    cursor = match.index + match[0].length;
  }
  if (cursor < rest.length) out.push({ text: rest.slice(cursor) });
  return out;
}

function slug(text: string): string {
  return (
    text
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "sekce"
  );
}

// ---------------------------------------------------------------- paras → blocks

const imageRef = (src: string): Picture => ({ src, ...imageSizes.get(src)! });

function titlePage(paras: (Para | Table)[]) {
  const end = paras.findIndex((b) => b.kind === "p" && b.style === UNNUMBERED_HEADING);
  const lines = paras
    .slice(0, end)
    .filter((b): b is Para => b.kind === "p" && b.text.length > 0)
    .map((b) => b.text);

  const kindIndex = lines.indexOf("MATURITNÍ PRÁCE");
  const fields = lines
    .map((line) => /^([^:\u0000]{2,20}):\s+(\S.*)$/.exec(line))
    .filter((m) => m !== null)
    .map((m) => ({ label: m[1], value: m[2] }));

  return {
    school: lines[0],
    title: lines[kindIndex + 1],
    author: lines[kindIndex + 2],
    logo: imageRef(lines.join("").split(IMAGE_MARK)[1]),
    fields,
  };
}

/**
 * A row of photos carries one "Obr. N …" caption per image, all in one caption
 * paragraph; a single photo gets the caption as a whole.
 */
function captionFigures(figures: Extract<Block, { kind: "figures" }>, caption: string) {
  if (!caption) return;
  const parts = caption.split(CAPTION_SPLIT).map((c) => c.trim()).filter(Boolean);
  if (parts.length === figures.images.length && parts.length > 1) {
    figures.images.forEach((image, i) => (image.caption = parts[i]));
  } else {
    figures.caption = caption;
  }
}

function toBlocks(paras: (Para | Table)[]) {
  const blocks: Block[] = [];
  const nav: NavEntry[] = [];
  const counters = [0, 0, 0];
  let pendingCaption: string | undefined;

  const last = () => blocks.at(-1);
  const openList = () => {
    const tail = last();
    if (tail?.kind === "list") return tail;
    const list: Block = { kind: "list", items: [] };
    blocks.push(list);
    return list;
  };

  const start = paras.findIndex(
    (b) => b.kind === "p" && b.style === UNNUMBERED_HEADING && b.text === "ÚVOD",
  );
  if (start < 0) {
    throw new Error(
      'no "ÚVOD" heading found — everything before it is treated as the title page, ' +
        `so without it the document would come out empty. Check the paragraph styles in ${DOCX}.`,
    );
  }

  for (const block of paras.slice(start)) {
    if (block.kind === "tbl") {
      const [head, ...rows] = block.rows;
      blocks.push({ kind: "table", caption: pendingCaption, head, rows });
      pendingCaption = undefined;
      continue;
    }

    const { style, text, listItem } = block;
    if (!text) continue;

    // captions: the styled ones, plus the plain "Obr. N …" paragraphs the document also uses
    if (style === CAPTION_STYLE || (text.startsWith("Obr.") && !text.includes(IMAGE_MARK))) {
      const tail = last();
      if (tail?.kind === "figures") captionFigures(tail, text);
      else pendingCaption = text; // belongs to the table that follows
      continue;
    }

    if (text.includes(IMAGE_MARK)) {
      const parts = text.split(IMAGE_MARK);
      const figures: Block = {
        kind: "figures",
        images: parts
          .filter((_, i) => i % 2 === 1)
          .map(imageRef),
      };
      blocks.push(figures);
      // photos and their captions sometimes share a paragraph
      captionFigures(figures, parts.filter((_, i) => i % 2 === 0).join("").trim());
      continue;
    }

    const level = HEADING_LEVEL[style];
    if (level || style === UNNUMBERED_HEADING) {
      let label = text;
      if (level) {
        counters[level - 1] += 1;
        counters.fill(0, level);
        label = `${counters.slice(0, level).join(".")} ${text}`;
      }
      const entry: NavEntry = { level: level ?? 1, id: slug(label), label };
      nav.push(entry);
      blocks.push({ kind: "heading", ...entry });
      continue;
    }

    if (listItem) {
      openList().items.push(toInlines(text));
      continue;
    }
    if (style === LIST_STYLE && last()?.kind === "list") {
      // continuation line of the previous entry (e.g. a source's URL)
      const list = openList();
      list.items[list.items.length - 1].push({ text: " " }, ...toInlines(text));
      continue;
    }

    blocks.push({ kind: "paragraph", content: toInlines(text) });
  }

  return { blocks, nav };
}

// ------------------------------------------------------------------------- main

/** Promotes the document's first photo to the cover, so it isn't shown twice. */
function takeCover(blocks: Block[]) {
  const index = blocks.findIndex((b) => b.kind === "figures");
  if (index < 0) return null;
  const [figures] = blocks.splice(index, 1) as Extract<Block, { kind: "figures" }>[];
  const [image] = figures.images;
  return { ...image, caption: image.caption ?? figures.caption };
}

/**
 * The document's structure comes from Word paragraph styles, which are easy to
 * lose when editing. Fail loudly here rather than deploying a half-empty page.
 */
function check(thesis: Thesis) {
  const { meta, nav, blocks } = thesis;
  const problems = [];
  if (nav.filter((e) => e.level === 1).length < 4) problems.push("fewer than 4 chapters");
  if (blocks.length < 80) problems.push(`only ${blocks.length} blocks`);
  if (!meta.title || !meta.author) problems.push("no title or author on the cover");
  if (!meta.cover) problems.push("no cover photo");
  if (!blocks.some((b) => b.kind === "table")) problems.push("component table missing");
  const sized = blocks.every((b) => b.kind !== "figures" || b.images.every((i) => i.w > 0));
  if (!sized) problems.push("an image has no dimensions");
  if (problems.length) {
    throw new Error(`${DOCX} did not parse as expected: ${problems.join(", ")}`);
  }
}

async function main() {
  const paras = await readDocx(DOCX);
  const { blocks, nav } = toBlocks(paras);
  const thesis: Thesis = { meta: { ...titlePage(paras), cover: takeCover(blocks) }, nav, blocks };
  check(thesis);
  await mkdir("content", { recursive: true });
  await writeFile(OUT, `${JSON.stringify(thesis, null, 2)}\n`);
  console.log(`${OUT}: ${thesis.nav.length} nav entries, ${thesis.blocks.length} blocks`);
}

main();
