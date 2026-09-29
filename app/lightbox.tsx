"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./thesis.module.css";

type Shot = { src: string; caption: string };

/**
 * Opens any `[data-zoom]` link in a dialog instead of a new tab. Delegated, so
 * figures stay server-rendered — and without JS the links still open the file.
 */
export function Lightbox() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [shot, setShot] = useState<Shot | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-zoom]");
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      setShot({ src: link.href, caption: link.dataset.zoom ?? "" });
      dialog.current?.showModal();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <dialog ref={dialog} className={styles.lightbox} onClick={() => dialog.current?.close()}>
      {shot && (
        <figure>
          <img src={shot.src} alt={shot.caption} />
          {shot.caption && <figcaption>{shot.caption}</figcaption>}
        </figure>
      )}
    </dialog>
  );
}
