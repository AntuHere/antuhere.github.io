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
      <p className="subTitle">7 Peer-Reviewed Publications · Contributions include field data collection, data analysis and literature review.</p>
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
              <p className="publication-authors">{publication.authors}</p>
              <time className="publication-year" dateTime={String(publication.year)}>{publication.year}</time>
              <a className="main-button publication-read" href={publication.url} target="_blank" rel="noopener noreferrer">Read Publication</a>
            </article>
          </Fade>
        ))}
      </div>
      <Button text="Google Scholar" className="project-button" href={socialMediaLinks.scholar} newTab={true} />
    </div>
  );
}
