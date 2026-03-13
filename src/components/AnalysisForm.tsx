"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnalysisResult } from "@/types";
import ResultsPanel from "./ResultsPanel";
import GateModal from "./GateModal";
import { useSession } from "next-auth/react";

interface AnalysisFormProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export default function AnalysisForm({ onAnalysisComplete }: AnalysisFormProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGate, setShowGate] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // Read localStorage on mount
    const uses = localStorage.getItem("textlens_uses");
    const count = uses ? parseInt(uses, 10) || 0 : 0;

    if (!session && count >= 5) {
      setShowGate(true);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check usage for guest users
    let count = 0;
    if (!session) {
      const uses = localStorage.getItem("textlens_uses");
      count = uses ? parseInt(uses, 10) || 0 : 0;

      if (count >= 5) {
        setShowGate(true);
        return;
      }
    }

    if (text.length < 50) {
      setError("Text must be at least 50 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
      onAnalysisComplete?.(data);

      // Update localStorage for guest users
      if (!session) {
        localStorage.setItem("textlens_uses", String(count + 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here..."
          className="min-h-[200px] resize-none"
          maxLength={10000}
        />
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{text.length}/10000</span>
          <Button type="submit" disabled={isLoading || text.length < 50}>
            {isLoading ? "Analyzing..." : "Analyze Text"}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {result && <ResultsPanel result={result} />}

      <GateModal
        open={showGate}
        onClose={() => setShowGate(false)}
      />
    </div>
  );
}
