"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function SignedStorageImage({
  bucket,
  path,
  alt,
  className,
}: {
  bucket: "vehicle-photos" | "garage-logos";
  path: string;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60);
      if (!cancelled && !error && data?.signedUrl) setSrc(data.signedUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [bucket, path]);

  if (!src) {
    return (
      <div
        className={`bg-zinc-100 animate-pulse rounded ${className ?? ""}`}
        aria-hidden
      />
    );
  }
  // Supabase signed URLs are short-lived and generated client-side.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}
