"use client";

import { useState, useEffect } from "react";
import { api } from "@/features/shared/lib/api";
import { SAMPLE_CASES } from "@/features/shared/lib/sampleCases";

export function useResult(id) {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchResult() {
      setIsLoading(true);
      setError(null);

      // 1. Fetch directly from Backend API (MongoDB Atlas bup_hackathon)
      try {
        const data = await api.get(`/api/history/${id}`);
        if (data && data.result) {
          setResult(data.result);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn(`Could not load result ${id} from API, trying cache/seeds`, err);
      }

      // 2. Try local storage cache
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(`gridwise_result_${id}`);
        if (cached) {
          try {
            setResult(JSON.parse(cached));
            setIsLoading(false);
            return;
          } catch (e) {
            console.warn("Cached result parse failed", e);
          }
        }
      }

      // 3. Public sample pack: show the published reference answer, clearly labelled as such.
      const matched = SAMPLE_CASES.find(
        (c) => c.id.toLowerCase() === id.toLowerCase() || c.expected_output?.scenario_id === id
      );

      if (matched && matched.expected_output) {
        setResult({
          _id: matched.id,
          ...matched.expected_output,
          isReference: true,
          processingTimeMs: null,
          scenario_input: matched.input,
        });
      } else {
        setError(`Result '${id}' was not found.`);
      }

      setIsLoading(false);
    }

    fetchResult();
  }, [id]);

  return { result, isLoading, error };
}
