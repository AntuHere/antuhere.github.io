import React, {useContext} from "react";
import "./Skills.css";
import SoftwareSkill from "../../components/softwareSkills/SoftwareSkill";
import {skillsSection} from "../../portfolio";
import {Fade} from "react-reveal";
import portfolioMedia from "../../data/portfolioMedia.json";
import StyleContext from "../../contexts/StyleContext";

export default function Skills() {
  const {isDark} = useContext(StyleContext);
  if (!skillsSection.display) {
    return null;
  }
  return (
    <div className={isDark ? "dark-mode main" : "main"} id="skills">
      <div className="skills-main-div">
        <Fade left duration={1000}>
          <div className="skills-image-div">
            <img
              className="research-illustration"
              src={portfolioMedia.researchIllustration.src}
              alt={portfolioMedia.researchIllustration.alt}
              width="659"
              height="646"
              loading="lazy"
              decoding="async"
            />
          </div>
        </Fade>
        <Fade right duration={1000}>
          <div className="skills-text-div">
            <h1
              className={isDark ? "dark-mode skills-heading" : "skills-heading"}
            >
              {skillsSection.title}{" "}
            </h1>
            <p
              className={
                isDark
                  ? "dark-mode subTitle skills-text-subtitle"
                  : "subTitle skills-text-subtitle"
              }
            >
              {skillsSection.subTitle}
            </p>
            <SoftwareSkill />
            <div>
              {skillsSection.skills.map((skills, i) => {
                return (
                  <p
                    key={i}
                    className={
                      isDark
                        ? "dark-mode subTitle skills-text"
                        : "subTitle skills-text"
                    }
                  >
                    {skills}
                  </p>
                );
              })}
              <p className={isDark ? "dark-mode subTitle skills-text" : "subTitle skills-text"}>
                <strong>Research interests: </strong>
                {skillsSection.interests.join(" · ")}
              </p>
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
}
