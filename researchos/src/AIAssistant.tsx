import { useState } from "react";
import type { Store } from "./data";
export default function AIAssistant({ store }: { store: Store }) {
  const [project, setProject] = useState(store.projects[0]?.id || ""),
    [question, setQuestion] = useState(""),
    [message, setMessage] = useState("");
  const p = store.projects.find((p) => p.id === project);
  const prompt = `Research project: ${p?.name || ""}\nObjective: ${p?.goal || ""}\nDescription: ${p?.description || ""}\n\nHelp me with:\n${question}\n\nUse only the evidence I provide. Distinguish suggestions from verified findings. Do not invent citations.`;
  return (
    <section className="panel assistant-panel">
      <div className="eyebrow">RESEARCH ASSISTANT</div>
      <h1>Prepare a research question</h1>
      <p>
        The AI connection is planned for a private backend. This panel prepares
        a prompt; it does not send data or generate AI responses.
      </p>
      <label>
        Project
        <select value={project} onChange={(e) => setProject(e.target.value)}>
          {store.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Your question
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Help me compare methods, outline a proposal, or identify questions to investigate…"
        />
      </label>
      <h3>Prompt preview</h3>
      <pre>{prompt}</pre>
      <button
        className="primary"
        disabled={!question.trim()}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(prompt);
            setMessage(
              "Prompt copied. You can paste it into your preferred assistant.",
            );
          } catch {
            setMessage(
              "Copy unavailable. Select the prompt preview to copy it manually.",
            );
          }
        }}
      >
        Copy prompt
      </button>
      <p role="status">{message}</p>
      <small>
        No API key belongs in this website. A future AI service must
        authenticate requests on a server and keep its credentials there.
      </small>
    </section>
  );
}
