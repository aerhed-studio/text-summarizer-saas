"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import HistoryList from "@/components/HistoryList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/history?page=${page}&limit=${limit}`);

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = await response.json();
      setHistory(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setHistory(history.filter(entry => entry.id !== id));
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Analysis History</h1>
          <Button variant="outline" asChild>
            <a href="/">New Analysis</a>
          </Button>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="p-4 text-red-600">
              Error: {error}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-8">Loading history...</div>
        ) : (
          <>
            <HistoryList entries={history} onDelete={handleDelete} />

            {total > limit && (
              <div className="flex justify-center mt-6 space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="self-center">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
