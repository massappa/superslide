"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestGeminiOutline() {
  const [prompt, setPrompt] = useState("The Future of Artificial Intelligence");
  const [numberOfCards, setNumberOfCards] = useState(5);
  const [language, setLanguage] = useState("English");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const testOutline = async () => {
    setIsLoading(true);
    setError("");
    setResponse("");
    
    try {
      const res = await fetch("/api/test-gemini/outline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, numberOfCards, language }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let responseText = "";

      while (!done && reader) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        responseText += chunkValue;
        setResponse(responseText);
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Test Gemini Outline Generation</CardTitle>
          <p className="text-sm text-gray-500">
            Test the gemini-2.5-flash-lite model for generating presentation outlines
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800">Model Information</h3>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li><strong>Model:</strong> gemini-2.5-flash-lite</li>
              <li><strong>Provider:</strong> Google AI (via @google/genai)</li>
              <li><strong>Description:</strong> Generates structured presentation outlines</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">Topic</label>
            <Textarea
              id="prompt"
              placeholder="Enter your presentation topic..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="numberOfCards" className="text-sm font-medium">Number of Slides</label>
              <Input
                id="numberOfCards"
                type="number"
                min="3"
                max="20"
                value={numberOfCards}
                onChange={(e) => setNumberOfCards(parseInt(e.target.value) || 5)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="language" className="text-sm font-medium">Language</label>
              <Input
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="English"
              />
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {response && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Generated Outline:</h3>
              <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            <Button 
              onClick={testOutline} 
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? "Generating..." : "Generate Outline"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setResponse("");
                setError("");
              }}
              disabled={isLoading || (!response && !error)}
            >
              Clear Response
            </Button>
          </div>
          <Button 
            variant="secondary"
            onClick={() => {
              setPrompt("The Future of Artificial Intelligence");
              setNumberOfCards(5);
              setLanguage("English");
            }}
            disabled={isLoading}
          >
            Load Sample
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}