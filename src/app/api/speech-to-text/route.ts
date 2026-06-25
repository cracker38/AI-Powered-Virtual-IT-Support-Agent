import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy-key-for-now",
});

export async function POST(req: Request) {
  try {
    if (process.env.GROQ_API_KEY === undefined || process.env.GROQ_API_KEY === "") {
      await new Promise((res) => setTimeout(res, 1000));
      return NextResponse.json({ text: "This is a demo transcription of your voice note." });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const language = formData.get("language") as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Convert the audio file to the format Groq expects
    const audioBuffer = await audioFile.arrayBuffer();

    // Whisper auto-detects language by default (very good at detecting French, English, Kinyarwanda, etc.)
    // Only set language if explicitly provided and is a valid code
    const transcriptionParams: any = {
      file: new File([audioBuffer], "audio.webm", { type: audioFile.type }),
      model: "whisper-large-v3",
    };

    // Only force language if explicitly provided
    if (language && language.length === 2) {
      transcriptionParams.language = language.toLowerCase();
    }
    // Otherwise let Whisper auto-detect

    const transcription = await groq.audio.transcriptions.create(transcriptionParams);

    return NextResponse.json({ 
      text: transcription.text,
      detectedLanguage: language || "auto-detected"
    });
  } catch (error) {
    console.error("Speech-to-text API Error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}