import AnalysisForm from "@/components/AnalysisForm";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">TextLens</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Paste any text and get an AI-powered summary, keyword list, and readability score.
            Analyze documents quickly and efficiently.
          </p>
        </div>

        <AnalysisForm />
      </main>
    </div>
  );
}
