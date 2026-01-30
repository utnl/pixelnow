"use client";

import dynamic from "next/dynamic";

const EditorShell = dynamic(() => import("./EditorShell"), { ssr: false });

export default function EditorPage() {
  return (
    <main className="w-full h-screen bg-neutral-900 overflow-hidden">
      <EditorShell />
    </main>
  );
}
