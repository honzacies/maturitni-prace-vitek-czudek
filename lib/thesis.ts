import data from "@/content/thesis.json";

/** A run of text inside a paragraph or list item. */
export type Inline =
  | { text: string }
  | { text: string; bold: true }
  | { text: string; href: string };

/** An image with its intrinsic size, so the layout can reserve the space. */
export type Picture = { src: string; w: number; h: number; caption?: string };

export type Block =
  | { kind: "heading"; level: 1 | 2 | 3; id: string; label: string }
  | { kind: "paragraph"; content: Inline[] }
  | { kind: "list"; items: Inline[][] }
  | { kind: "figures"; images: Picture[]; caption?: string }
  | { kind: "table"; caption?: string; head: string[]; rows: string[][] };

export type NavEntry = { level: 1 | 2 | 3; id: string; label: string };

export type Thesis = {
  meta: {
    school: string;
    title: string;
    author: string;
    logo: Picture;
    /** First photo in the document — the components laid out before assembly. */
    cover: Picture | null;
    /** "Studijní obor", "Třída", "Školní rok", … as they appear on the title page. */
    fields: { label: string; value: string }[];
  };
  nav: NavEntry[];
  blocks: Block[];
};

export const thesis = data as Thesis;
