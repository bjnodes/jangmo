"use client";

import { useEffect } from "react";

const CLIENT_ID = "ca-pub-7152371441049509";

export default function AdSenseUnit({ slot = "1234567890", className = "" }) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      }
    } catch {}
  }, []);

  return (
    <div className={`ad-shell ${className}`.trim()}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
