import { NextResponse } from "next/server";
import { generateSubQuestions } from "@/lib/subquestions";
import { gatherSources } from "@/lib/sources";
import { buildEngineAnalyses, buildMasterReport } from "@/lib/analyzer";
import type { ResearchResponse } from "@/types/research";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = String(body?.question ?? "").trim();

    if (question.length < 8) {
      return NextResponse.json(
        { error: "Provide a more detailed research question (>= 8 characters)." },
        { status: 400 }
      );
    }

    const subQuestions = generateSubQuestions(question);
    const sources = await gatherSources(question, subQuestions);
    const analyses = buildEngineAnalyses(subQuestions, sources);
    const report = buildMasterReport(subQuestions, analyses);

    const payload: ResearchResponse = {
      question,
      generatedAt: new Date().toISOString(),
      subQuestions,
      sources,
      analyses,
      report,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Research orchestration failed", error);
    return NextResponse.json(
      {
        error:
          "Unable to complete the research run. Please try again with a refined question.",
      },
      { status: 500 }
    );
  }
}
