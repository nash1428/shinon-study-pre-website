import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface UploadedMaterial {
  type: "pdf" | "powerpoint" | "video";
  extractedText?: string;
  url?: string;
}

interface GenerateRequest {
  userId?: string;
  noteId?: string;
  generateType?: "anki" | "quiz";
  uploadedMaterial?: UploadedMaterial;
  noteContent?: string;
  type?: string;
  count?: number;
  pdfText?: string;
}

/**
 * Context Builder — dynamically builds the prompt context string.
 * Checks if uploadedMaterial.extractedText and/or noteContent exist,
 * and combines them intelligently (or just uses the one that exists).
 */
function buildContextString(req: GenerateRequest): string {
  const parts: string[] = [];

  // Check for uploaded material content
  const fileText = req.uploadedMaterial?.extractedText || req.pdfText || "";
  const fileType = req.uploadedMaterial?.type || (req.pdfText ? "pdf" : null);
  const fileUrl = req.uploadedMaterial?.url;

  if (fileText && fileText.trim()) {
    const typeLabel = fileType === "pdf" ? "PDF Document" : fileType === "powerpoint" ? "PowerPoint Slides" : fileType === "video" ? "Video Transcript" : "Uploaded Material";
    parts.push(`=== ${typeLabel} ===\n${fileText.trim()}`);
  } else if (fileUrl) {
    parts.push(`=== Video URL (no transcript available) ===\nVideo URL: ${fileUrl}\n(Note: No transcript text was extracted from this video. Generate questions based on the note content if available, or create general study questions.)`);
  }

  // Check for note content
  const noteText = req.noteContent || "";
  if (noteText && noteText.trim()) {
    parts.push(`=== User's Note Content ===\n${noteText.trim()}`);
  }

  if (parts.length === 0) {
    return "No specific study material was provided. Please generate general study questions about the topic indicated by the note title.";
  }

  return `You have the following study material(s) to base your questions on. Use ALL available sources.\n\n${parts.join("\n\n")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both old format (pdfText, noteContent, type) and new format (uploadedMaterial, noteContent, generateType)
    const generateRequest: GenerateRequest = {
      userId: body.userId,
      noteId: body.noteId,
      generateType: body.generateType || body.type,
      uploadedMaterial: body.uploadedMaterial,
      noteContent: body.noteContent,
      type: body.type,
      count: body.count,
      pdfText: body.pdfText,
    };

    const type = generateRequest.generateType || generateRequest.type || "anki";

    // Check if at least one source exists
    const hasFileContent = (generateRequest.uploadedMaterial?.extractedText?.trim()) || (generateRequest.pdfText?.trim()) || (generateRequest.uploadedMaterial?.url?.trim());
    const hasNoteContent = generateRequest.noteContent?.trim();

    if (!hasFileContent && !hasNoteContent) {
      return NextResponse.json({
        error: "Please add some content (notes or a file) before generating study materials.",
      }, { status: 400 });
    }

    const itemCount = Math.max(1, Math.min(20, generateRequest.count || 5));
    const contextString = buildContextString(generateRequest);

    const apiKey = process.env.AIAND_API_KEY;
    if (!apiKey) {
      console.warn("[generate-study-materials] AIAND_API_KEY not configured");
      if (type === "anki") {
        return NextResponse.json({
          ok: true,
          ankiCards: [
            { front: "[AI not configured] What is the main topic?", back: "Configure AIAND_API_KEY to generate real cards." },
          ],
        });
      }
      return NextResponse.json({
        ok: true,
        quizQuestions: [
          { question: "[AI not configured] What is the main topic?", options: ["A", "B", "C", "D"], answer: 0 },
        ],
      });
    }

    const client = new OpenAI({
      baseURL: "https://api.aiand.com/v1",
      apiKey,
    });

    if (type === "anki") {
      const completion = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: `You are a study assistant that creates Anki flashcards. Based on the provided study material(s), generate exactly ${itemCount} high-quality Anki cards. 

Rules:
- Base your questions on the ACTUAL content provided in the context.
- Do NOT make up information that isn't in the study material.
- If multiple sources are provided (e.g., file + notes), combine information from both.
- If only one source is provided, use only that source.
- Each card should test a key concept, definition, or fact from the material.

Return ONLY a JSON array of objects with "front" and "back" fields. Example: [{"front":"What is X?","back":"X is..."}]`,
          },
          { role: "user", content: contextString },
        ],
      });

      const raw = completion.choices[0]?.message?.content || "[]";
      let ankiCards;
      try {
        ankiCards = JSON.parse(raw);
      } catch {
        const match = raw.match(/\[[\s\S]*\]/);
        ankiCards = match ? JSON.parse(match[0]) : [];
      }

      return NextResponse.json({
        ok: true,
        ankiCards: Array.isArray(ankiCards) ? ankiCards : [],
        source: hasFileContent && hasNoteContent ? "file+notes" : hasFileContent ? "file" : "notes",
      });
    } else {
      const completion = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: `You are a study assistant that creates quiz questions. Based on the provided study material(s), generate exactly ${itemCount} multiple-choice questions with 4 options each.

Rules:
- Base your questions on the ACTUAL content provided in the context.
- Do NOT make up information that isn't in the study material.
- If multiple sources are provided (e.g., file + notes), combine information from both.
- If only one source is provided, use only that source.
- Each question should test understanding of a key concept from the material.
- The correct answer should be factual based on the provided content.
- Make the distractors plausible but clearly wrong.

Return ONLY a JSON array of objects. Each question has: "question" (string), "options" (array of 4 strings), "answer" (index 0-3 of correct option). Example: [{"question":"What is X?","options":["A","B","C","D"],"answer":0}]`,
          },
          { role: "user", content: contextString },
        ],
      });

      const raw = completion.choices[0]?.message?.content || "[]";
      let quizQuestions;
      try {
        quizQuestions = JSON.parse(raw);
      } catch {
        const match = raw.match(/\[[\s\S]*\]/);
        quizQuestions = match ? JSON.parse(match[0]) : [];
      }

      return NextResponse.json({
        ok: true,
        quizQuestions: Array.isArray(quizQuestions) ? quizQuestions : [],
        source: hasFileContent && hasNoteContent ? "file+notes" : hasFileContent ? "file" : "notes",
      });
    }
  } catch (err) {
    console.error("[generate-study-materials] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to generate study materials";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
