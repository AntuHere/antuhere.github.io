import React, {useContext} from "react";
import {Fade} from "react-reveal";
import "./Project.css";
import "../../components/githubRepoCard/GithubRepoCard.css";
import Button from "../../components/button/Button";
import {openSource, socialMediaLinks} from "../../portfolio";
import {publications} from "../../data/publications";
import StyleContext from "../../contexts/StyleContext";

// Repurpose the existing repository-card section without changing its position,
// grid, colors, shadows, hover treatment or reveal animation.
export default function Projects() {
  const {isDark} = useContext(StyleContext);
  if (!openSource.display) return null;
  return (
    <div className="main" id="publications">
      <h1 className="project-title">Publications</h1>
      <p className="subTitle">Seven peer-reviewed journal articles. My contributions: field data collection, data analysis and, in several papers, literature review.</p>
      <div className="repo-cards-div-main">
        {publications.map(publication => (
          <Fade key={publication.doi} bottom duration={1000} distance="20px">
            <article className={isDark ? "dark-card-mode repo-card-div publication-card" : "repo-card-div publication-card"}>
              <div className="repo-name-div">
                <i className="fas fa-book-open repo-svg" aria-hidden="true"></i>
                <h2 className="repo-name publication-title">
                  <a href={publication.url} target="_blank" rel="noopener noreferrer">{publication.title}</a>
                </h2>
              </div>
              <p className="repo-description publication-details">{publication.authors} ({publication.year}).</p>
              <p className="publication-details"><em>{publication.journal}</em>, {publication.volume}, {publication.pages}.</p>
              <p className="publication-details"><a href={publication.url} target="_blank" rel="noopener noreferrer">DOI: {publication.doi}</a></p>
              {publication.archiveUrl && <p className="publication-details"><a href={publication.archiveUrl} target="_blank" rel="noopener noreferrer">Also available on HAL</a></p>}
            </article>
          </Fade>
        ))}
      </div>
      <Button text="Google Scholar" className="project-button" href={socialMediaLinks.scholar} newTab={true} />
    </div>
  );
}
