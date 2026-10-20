import React, {useContext} from "react";
import "./StartupProjects.css";
import {bigProjects} from "../../portfolio";
import {Fade} from "react-reveal";
import StyleContext from "../../contexts/StyleContext";
import PortfolioImage from "../../components/portfolioImage/PortfolioImage";

export default function StartupProject() {
  const {isDark} = useContext(StyleContext);
  if (!bigProjects.display) return null;
  return (
    <Fade bottom duration={1000} distance="20px">
      <div className="main" id="projects">
        <h1 className="skills-heading">{bigProjects.title}</h1>
        <p className={isDark ? "dark-mode project-subtitle" : "subTitle project-subtitle"}>{bigProjects.subtitle}</p>
        <div className="projects-container">
          {bigProjects.projects.map(project => (
            <article key={project.id} className={isDark ? "dark-mode project-card project-card-dark" : "project-card project-card-light"}>
              <PortfolioImage asset={project.image} className="research-project-image" />
              <div className="project-detail">
                <h2 className={isDark ? "dark-mode card-title" : "card-title"}>{project.projectName}</h2>
                <p className={isDark ? "dark-mode card-subtitle" : "card-subtitle"}>{project.category}</p>
                <p className={isDark ? "dark-mode card-subtitle" : "card-subtitle"}>{project.projectDesc}</p>
                <p className={isDark ? "dark-mode card-subtitle research-status" : "card-subtitle research-status"}><strong>{project.status}</strong></p>
                <p className={isDark ? "dark-mode card-subtitle" : "card-subtitle"}><strong>Progress: </strong>{project.progressText}</p>
                <details className="research-details">
                  <summary>Research Details</summary>
                  <p>{project.overview}</p>
                  {project.questions && <div><h3>Research questions</h3><ul className="research-activities">{project.questions.map(question => <li key={question}>{question}</li>)}</ul></div>}
                  <h3>{project.activitiesLabel || "Research activities"}</h3>
                  <ul className="research-activities">{project.activities.map(activity => <li key={activity}>{activity}</li>)}</ul>
                  {project.indicators && <div><h3>Potential indicators</h3><ul className="research-activities">{project.indicators.map(indicator => <li key={indicator}>{indicator}</li>)}</ul></div>}
                </details>
                <p className="research-methods-label">{project.methodsLabel || "Methods"}</p>
                <div className="project-card-footer research-technologies">{project.technologies.map(technology => <span key={technology} className={isDark ? "dark-mode project-tag" : "project-tag"}>{technology}</span>)}</div>
                {project.footerLink && <div className="project-card-footer">{project.footerLink.map(link => <a className="research-project-link" key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.name}</a>)}</div>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </Fade>
  );
}
