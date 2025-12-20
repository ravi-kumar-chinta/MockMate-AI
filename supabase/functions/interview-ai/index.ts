import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, role, difficulty, questionType, mode, question, answer, options, selectedOption, correctOption } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === 'question') {
      if (mode === 'MCQ') {
        systemPrompt = `You are an expert interviewer. Generate a ${difficulty || 'Medium'} difficulty ${questionType || 'Technical'} MCQ for a ${role} position. Return ONLY valid JSON: {"question": "...", "options": ["A", "B", "C", "D"], "correctOption": 0}. correctOption is 0-based index.`;
        userPrompt = `Generate one ${difficulty} ${questionType} MCQ for ${role}.`;
      } else {
        systemPrompt = `You are an expert interviewer. Generate a ${difficulty || 'Medium'} difficulty ${questionType || 'Technical'} question for ${role}. Return ONLY valid JSON: {"question": "..."}`;
        userPrompt = `Generate one ${difficulty} ${questionType} interview question for ${role}.`;
      }
    } else if (type === 'evaluate') {
      if (mode === 'MCQ') {
        const isCorrect = selectedOption === correctOption;
        systemPrompt = `Evaluate MCQ answer. Return ONLY valid JSON: {"score": ${isCorrect ? 10 : 0}, "explanation": "why correct answer is right", "strengths": ["..."], "improvements": ["..."], "sampleAnswer": "brief explanation"}`;
        userPrompt = `Question: ${question}\nOptions: ${JSON.stringify(options)}\nCorrect: ${correctOption}\nSelected: ${selectedOption}`;
      } else {
        systemPrompt = `Evaluate this ${questionType} answer for ${role}. Return ONLY valid JSON: {"score": 1-10, "strengths": ["..."], "improvements": ["..."], "sampleAnswer": "..."}`;
        userPrompt = `Question: ${question}\nAnswer: ${answer}`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { question: content.trim() };
    
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "An error occurred" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
