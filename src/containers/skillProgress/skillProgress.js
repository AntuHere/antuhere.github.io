import React from "react";
import "./Progress.css";
import {techStack} from "../../portfolio";

export default function StackProgress() {
  if (!techStack.viewSkillBars) return null;
  return (
    <section className="expertise-section main" id="expertise" aria-labelledby="expertise-title">
      <h1 className="skills-heading" id="expertise-title">Skills & Expertise</h1>
      <div className="expertise-grid">
        {techStack.experience.map(exp => (
          <article className="expertise-card" key={exp.Stack}>
            <h2>{exp.Stack}</h2>
            <span className="expertise-level">{exp.level}</span>
            <p>{exp.tools}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
