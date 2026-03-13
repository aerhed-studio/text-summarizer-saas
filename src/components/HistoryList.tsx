"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HistoryEntry } from "@/types";
import { useState } from "react";

interface HistoryListProps {
  entries: HistoryEntry[];
  onDelete: (id: string) => void;
}

export default function HistoryList({ entries, onDelete }: HistoryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/history/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete(id);
      } else {
        console.error("Failed to delete entry");
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {entries.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No history yet</p>
      ) : (
        entries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <CardTitle className="truncate">{entry.inputSnippet}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Score</p>
                  <p className="font-bold">{entry.readabilityScore.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Level</p>
                  <p>{entry.readabilityLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p>{new Date(entry.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {entry.keywords.slice(0, 5).map((keyword, index) => (
                  <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {keyword}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                >
                  {deletingId === entry.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
