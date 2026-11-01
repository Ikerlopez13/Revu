"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OpenTagForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const c = code.trim().toUpperCase();
        if (c) router.push(`/admin/tags/${encodeURIComponent(c)}`);
      }}
    >
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código (p. ej. AB3K9Z)"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        maxLength={6}
        className="font-mono tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
      />
      <Button type="submit" size="icon" aria-label="Abrir tag">
        <ArrowRight />
      </Button>
    </form>
  );
}
