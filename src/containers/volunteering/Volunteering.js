import React, {useContext} from "react";
import {Fade} from "react-reveal";
import {volunteering} from "../../portfolio";
import StyleContext from "../../contexts/StyleContext";
import PortfolioImage from "../../components/portfolioImage/PortfolioImage";
import Button from "../../components/button/Button";
import "../StartupProjects/StartupProjects.css";
import "./Volunteering.css";

export default function Volunteering() {
  const {isDark} = useContext(StyleContext);
  return (
    <Fade bottom duration={1000} distance="20px">
      <section className="main" id="volunteering">
        <h1 className="skills-heading">{volunteering.title}</h1>
        <article className={isDark ? "dark-mode project-card project-card-dark" : "project-card project-card-light"}>
          <div className="volunteering-identity">
            <PortfolioImage asset={volunteering.logo} className="volunteering-logo" />
            <div>
              <h2 className={isDark ? "dark-mode card-title" : "card-title"}>{volunteering.organization}</h2>
              <p><strong>{volunteering.role}</strong></p>
            </div>
          </div>
          <p className={isDark ? "dark-mode card-subtitle" : "card-subtitle"}>{volunteering.description}</p>
          <div className="volunteering-gallery">
            {volunteering.photos.map(photo => <PortfolioImage key={photo.filename} asset={photo} />)}
          </div>
          <Button text="Visit Organization" href={volunteering.url} newTab={true} />
        </article>
      </section>
    </Fade>
  );
}
