import React from "react";
import {githubProjects} from "../../data/githubProjects";
import "./PortfolioProjects.css";

export function IndustrialTraining() {
  return (
    <section className="main portfolio-additions" id="training" aria-labelledby="training-title">
      <h1 className="skills-heading" id="training-title">Internship & Industrial Training</h1>
      <article className="training-card">
        <div className="training-heading">
          <span className="training-monogram" aria-hidden="true">IWM</span>
          <div>
            <p className="portfolio-eyebrow">ACADEMIC INTERNSHIP</p>
            <h2>Trainee Engineer (Academic Intern)</h2>
            <a href="https://www.linkedin.com/company/117566/" target="_blank" rel="noopener noreferrer">Institute of Water Modelling (IWM)</a>
            <p className="training-meta"><time dateTime="2026-09-13">13 September</time> – <time dateTime="2026-10-04">4 October 2026</time> · Uttara, Dhaka, Bangladesh</p>
          </div>
        </div>
        <p>Completed the Industrial Training Program with a focus on hydro-informatics, water resources engineering and computational modelling.</p>
        <ul>
          <li>Gained hands-on exposure to hydrological and hydrodynamic modelling using MIKE 11 and ArcGIS.</li>
          <li>Assisted with spatial and hydrometeorological data processing for water resources management.</li>
          <li>Applied fluid mechanics and hydraulics concepts to river modelling and flood simulation workflows.</li>
          <li>Developed practical skills in GIS mapping, data preparation and integrated water management.</li>
        </ul>
      </article>
    </section>
  );
}

export default function PortfolioProjects() {
  return (
    <section className="main portfolio-additions" id="github-projects" aria-labelledby="github-projects-title">
      <h1 className="skills-heading" id="github-projects-title">Selected GitHub Projects</h1>
      <p className="portfolio-section-intro">Research tools, engineering calculations and experiments built out of curiosity.</p>
      <div className="github-project-grid">
        {githubProjects.map(project => (
          <article className="github-project-card" key={project.repo}>
            {project.image ? <figure><img src={project.image} alt={project.alt} loading="lazy" /><figcaption>Project output · {project.repo}</figcaption></figure> :
              <div className="project-icon-row"><i className={"fa " + project.icon} aria-hidden="true" /><span>{project.category}</span></div>}
            <div className="github-project-body">
              {project.image && <p className="portfolio-eyebrow">{project.category}</p>}
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <ul className="github-project-tools" aria-label="Technologies">{project.tools.map(tool => <li key={tool}>{tool}</li>)}</ul>
              <a className="github-project-link" href={"https://github.com/AntuHere/" + project.repo} target="_blank" rel="noopener noreferrer" aria-label={"View " + project.title + " on GitHub"}>View repository <span aria-hidden="true">↗</span></a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
