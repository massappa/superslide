"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function TestGemini() {
  const [prompt, setPrompt] = useState("Explain the benefits of using Gemini 2.5 Flash Lite in 3 bullet points.");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const testGemini = async () => {
    setIsLoading(true);
    setError("");
    setResponse("");
    
    try {
      const res = await fetch("/api/test-gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Gemini Models Test Suite</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/test-gemini">
            <Card className="h-full hover:bg-gray-50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Text Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Test the gemini-2.5-flash-lite model for generating text responses
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/test-gemini/image-generation">
            <Card className="h-full hover:bg-gray-50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Image Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Test the gemini-2.0-flash-preview-image-generation model for generating images
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/test-gemini/outline">
            <Card className="h-full hover:bg-gray-50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Outline Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Test the gemini-2.5-flash-lite model for generating presentation outlines
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Gemini 2.5 Flash Lite</CardTitle>
          <p className="text-sm text-gray-500">
            This page tests if the Google Generative AI integration with gemini-2.5-flash-lite model is working correctly.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800">Model Information</h3>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li><strong>Model:</strong> gemini-2.5-flash-lite</li>
              <li><strong>Provider:</strong> Google AI (via @google/generative-ai)</li>
              <li><strong>Description:</strong> Optimized for fast responses, suitable for chat and text generation</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">Prompt</label>
            <Textarea
              id="prompt"
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-24"
            />
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {response && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Response:</h3>
              <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            <Button 
              onClick={testGemini} 
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? "Testing..." : "Test Gemini"}
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
            onClick={() => setPrompt("Explain the benefits of using Gemini 2.5 Flash Lite in 3 bullet points.")}
            disabled={isLoading}
          >
            Load Sample Prompt
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}