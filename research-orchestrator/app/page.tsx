"use client";

import { FormEvent, useMemo, useState } from "react";
import type {
  EngineAnalysis,
  ResearchResponse,
  SourceDocument,
  SubQuestion,
} from "@/types/research";

const DEFAULT_QUESTION =
  "How will open-source AI models reshape enterprise security strategies over the next five years?";

const ENGINE_COLORS: Record<string, string> = {
  "openai-deep-research": "bg-indigo-500/20 text-indigo-200 border-indigo-400/40",
  "perplexity-deep-research":
    "bg-sky-500/20 text-sky-200 border-sky-400/40",
  "kimi-k2": "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
  "gemini-2_5-pro": "bg-amber-500/20 text-amber-100 border-amber-400/40",
};

const CONFIDENCE_BADGE: Record<
  "high" | "medium" | "low",
  { label: string; className: string }
> = {
  high: { label: "High", className: "bg-emerald-500/20 text-emerald-200" },
  medium: { label: "Medium", className: "bg-amber-500/20 text-amber-200" },
  low: { label: "Low", className: "bg-rose-500/20 text-rose-200" },
};

type LoadingState = "idle" | "loading" | "error";

function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const config = CONFIDENCE_BADGE[level];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label} confidence
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-tight text-slate-100">
      {children}
    </h2>
  );
}

function SourcePill({ source }: { source: SourceDocument }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-sm transition hover:border-indigo-400/60 hover:text-indigo-100 hover:shadow"
    >
      <span className="font-medium text-slate-100">{source.title}</span>
      <span className="text-xs uppercase tracking-wide text-slate-400">
        {source.origin}
      </span>
    </a>
  );
}

function EngineCard({
  analysis,
  subQuestionMap,
  sourceMap,
}: {
  analysis: EngineAnalysis;
  subQuestionMap: Record<string, SubQuestion>;
  sourceMap: Record<string, SourceDocument>;
}) {
  return (
    <article
      className={`rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-lg shadow-black/10 backdrop-blur ${ENGINE_COLORS[analysis.engine]}`}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">{analysis.engineLabel}</h3>
        <span className="text-sm text-slate-200">{analysis.overview}</span>
      </div>
      <div className="space-y-4">
        {analysis.highlights.map((highlight) => (
          <div
            key={`${analysis.engine}-${highlight.subQuestionId}`}
            className="rounded-lg border border-current/20 bg-black/10 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-200">
                {subQuestionMap[highlight.subQuestionId]?.question ??
                  highlight.subQuestionId}
              </span>
              <ConfidenceBadge level={highlight.confidence} />
            </div>
            <p className="text-sm leading-relaxed text-slate-100">
              {highlight.insight}
            </p>
            {highlight.sources.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {highlight.sources
                  .map((sourceId) => sourceMap[sourceId])
                  .filter(Boolean)
                  .map((source) => (
                    <span
                      key={source.id}
                      className="inline-flex items-center rounded-full bg-black/30 px-2.5 py-1 text-xs text-slate-200"
                    >
                      {source.title}
                    </span>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-black/20 p-3 text-xs text-slate-100">
        <p className="font-semibold uppercase tracking-wide text-slate-300">
          Watchouts
        </p>
        <ul className="mt-2 space-y-1">
          {analysis.watchouts.map((watchout) => (
            <li key={watchout} className="leading-relaxed">
              {watchout}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function Home() {
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [state, setState] = useState<LoadingState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResponse | null>(null);

  const subQuestionMap = useMemo<Record<string, SubQuestion>>(() => {
    if (!result) {
      return {};
    }
    return Object.fromEntries(
      result.subQuestions.map((item) => [item.id, item])
    ) as Record<string, SubQuestion>;
  }, [result]);

  const sourceMap = useMemo<Record<string, SourceDocument>>(() => {
    if (!result) {
      return {};
    }
    return Object.fromEntries(
      result.sources.map((source) => [source.id, source])
    ) as Record<string, SourceDocument>;
  }, [result]);

  async function handleRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.error ?? "Unable to orchestrate research for this prompt."
        );
      }

      const payload: ResearchResponse = await response.json();
      setResult(payload);
      setState("idle");
    } catch (error) {
      setState("error");
      setErrorMessage((error as Error).message);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Deep Research Orchestrator
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Coordinate multi-engine investigations with a single prompt
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-slate-300">
            Submit a complex research question. The orchestrator breaks it into
            sub-questions, gathers open-source evidence, triangulates findings
            from OpenAI Deep Research, Perplexity Deep Research, Kimi K2, and
            Gemini 2.5 Pro heuristics, and returns a structured master report.
          </p>
        </header>

        <form
          onSubmit={handleRun}
          className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur"
        >
          <label className="block text-sm font-medium text-slate-200">
            Research question
          </label>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-base text-slate-100 shadow-inner outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
            placeholder="Ask a strategic or technical question requiring evidence and synthesis..."
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              The orchestrator fetches publicly available summaries to ground
              each engine before synthesizing results.
            </p>
            <button
              type="submit"
              disabled={state === "loading"}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 hover:shadow-indigo-400/40 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {state === "loading" ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                  Running orchestration...
                </>
              ) : (
                "Run deep research"
              )}
            </button>
          </div>
          {state === "error" && errorMessage && (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {errorMessage}
            </p>
          )}
        </form>

        {result ? (
          <div className="space-y-12">
            <section className="space-y-5">
              <SectionTitle>Executive Summary</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                {result.report.executiveSummary.map((item, index) => (
                  <p
                    key={index}
                    className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 text-sm leading-relaxed text-slate-100"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Key Findings by Theme</SectionTitle>
              <div className="space-y-4">
                {result.report.keyFindings.map((finding) => (
                  <article
                    key={finding.theme}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-lg shadow-black/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-100">
                        {finding.theme}
                      </h3>
                      <ConfidenceBadge level={finding.confidence} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-200">
                      {finding.summary}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <span>
                        Consensus: {finding.consensus ? "Yes" : "Mixed"}
                      </span>
                      {finding.dissentingEngines.length > 0 && (
                        <span>
                          Divergence: {finding.dissentingEngines.join(", ")}
                        </span>
                      )}
                    </div>
                    {finding.supportingSources.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {finding.supportingSources
                          .map((id) =>
                            result.sources.find((source) => source.id === id)
                          )
                          .filter(Boolean)
                          .map((source) => (
                            <SourcePill
                              key={(source as SourceDocument).id}
                              source={source as SourceDocument}
                            />
                          ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Tool Comparison</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                {result.report.toolComparison.map((tool) => (
                  <article
                    key={tool.engine}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-lg shadow-black/10"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-100">
                        {tool.engineLabel}
                      </h3>
                      <span className="text-xs uppercase tracking-wide text-slate-300">
                        Coverage {tool.coverageScore}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Best for: {tool.bestFor}
                    </p>
                    <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-200">
                      <div>
                        <p className="font-semibold text-slate-100">
                          Strengths
                        </p>
                        <ul className="mt-2 space-y-1">
                          {tool.strengths.length > 0 ? (
                            tool.strengths.map((strength) => (
                              <li key={strength}>• {strength}</li>
                            ))
                          ) : (
                            <li className="text-slate-400">• Stable coverage</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">
                          Blind spots
                        </p>
                        <ul className="mt-2 space-y-1">
                          {tool.blindspots.length > 0 ? (
                            tool.blindspots.map((blindspot) => (
                              <li key={blindspot}>• {blindspot}</li>
                            ))
                          ) : (
                            <li className="text-slate-400">
                              • No major blind spots detected.
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Consensus & Divergence</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6">
                  <h3 className="text-lg font-semibold text-emerald-100">
                    Consensus
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-emerald-50">
                    {result.report.consensusSignals.length > 0 ? (
                      result.report.consensusSignals.map((item) => (
                        <li key={item}>• {item}</li>
                      ))
                    ) : (
                      <li>No strong consensus signals detected.</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
                  <h3 className="text-lg font-semibold text-amber-100">
                    Conflicts & Uncertainties
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-amber-50">
                    {result.report.conflictSignals.length > 0 ? (
                      result.report.conflictSignals.map((item) => (
                        <li key={item}>• {item}</li>
                      ))
                    ) : (
                      <li>Engines aligned without notable conflicts.</li>
                    )}
                  </ul>
                </div>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 shadow-lg shadow-rose-500/10">
                <SectionTitle>Risks & Uncertainties</SectionTitle>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-rose-50">
                  {result.report.risks.map((risk) => (
                    <li key={risk}>• {risk}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-indigo-400/50 bg-indigo-500/10 p-6 shadow-lg shadow-indigo-500/10">
                <SectionTitle>Recommendations</SectionTitle>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-indigo-50">
                  {result.report.recommendations.map((recommendation) => (
                    <li key={recommendation}>• {recommendation}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Engine Insights</SectionTitle>
              <div className="grid gap-4 lg:grid-cols-2">
                {result.analyses.map((analysis) => (
                  <EngineCard
                    key={analysis.engine}
                    analysis={analysis}
                    subQuestionMap={subQuestionMap}
                    sourceMap={sourceMap}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Evidence Trail</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                {result.sources.map((source) => (
                  <article
                    key={source.id}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-md shadow-black/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base font-semibold text-indigo-100 hover:text-indigo-200"
                      >
                        {source.title}
                      </a>
                      <span className="text-xs uppercase tracking-wide text-slate-400">
                        {source.origin}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-200">
                      {source.summary}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 text-sm text-slate-300">
            <SectionTitle>How it works</SectionTitle>
            <ol className="space-y-2 text-slate-300">
              <li>
                1. The orchestrator decomposes your question into targeted
                investigative threads.
              </li>
              <li>
                2. It gathers open-source evidence to simulate the four research
                engines.
              </li>
              <li>
                3. Findings are cross-checked for consensus, conflict, and
                coverage quality before reporting.
              </li>
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}
