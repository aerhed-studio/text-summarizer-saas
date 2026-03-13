```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ResultsPanelProps {
  result: {
    summary: string;
    keywords: string[];
    readabilityScore: number;
    readabilityLabel: string;
  };
}

export default function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{result.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Readability Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center">
            <span className="text-5xl font-bold">{result.readabilityScore.toFixed(1)}</span>
            <span className="text-lg mt-2">{result.readabilityLabel}</span>
            <p className="mt-4 text-sm text-gray-600">
              {result.readabilityLabel === "Very Easy" && "This text is very easy to read."}
              {result.readabilityLabel === "Easy" && "This text is easy to read."}
              {result.readabilityLabel === "Fairly Easy" && "This text is fairly easy to read."}
              {result.readabilityLabel === "Standard" && "This text has a standard reading level."}
              {result.readabilityLabel === "Fairly Difficult" && "This text is fairly difficult to read."}
              {result.readabilityLabel === "Difficult" && "This text is difficult to read."}
              {result.readabilityLabel === "Very Confusing" && "This text is very confusing to read."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```