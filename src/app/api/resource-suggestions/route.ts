import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        resources: [
          {
            title: `Khan Academy – ${topic || "Learn"}`,
            url: "https://www.khanacademy.org",
            why: "Offers bite-sized video lessons and interactive exercises perfect for beginners.",
          },
          {
            title: "Wikipedia Overview",
            url: "https://en.wikipedia.org",
            why: "A solid starting point for academic definitions and key references.",
          },
          {
            title: "MIT OpenCourseWare",
            url: "https://ocw.mit.edu",
            why: "University-level lecture notes and problem sets from MIT professors.",
          },
        ],
      });
    }
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful study-curator. Suggest 3 free online learning resources (title, url, why it helps) for a given topic. Output only valid JSON.",
        },
        {
          role: "user",
          content: `For the topic "${topic}", suggest 3 high-quality, free-of-charge resources to help a student learn. Return a JSON object with key "resources" containing an array of {title, url, why}.`,
        },
      ],
    });
    const raw = completion.choices[0].message.content || "";
    const json = JSON.parse(raw.replace(/```json|```/g, ""));
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
