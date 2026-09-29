import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import { thesis } from "@/lib/thesis";
import "./globals.css";

const { title, author, school } = thesis.meta;

/** Display: wide industrial grotesque, the way equipment and panels are labelled. */
const display = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-display",
});

/** Body: a typeface drawn for technical documentation. */
const body = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
});

/** Data: designators, specs, captions. */
const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: `${title} — ${author}`,
  description: `Maturitní práce: ${title}. ${school}`,
};

/** Applies the saved theme before first paint, so the page never flashes. */
const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
