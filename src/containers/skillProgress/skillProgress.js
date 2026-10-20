import React from "react";
import "./Progress.css";
import {illustration, techStack} from "../../portfolio";
import {Fade} from "react-reveal";
import Build from "../../assets/lottie/build";
import DisplayLottie from "../../components/displayLottie/DisplayLottie";

export default function StackProgress() {
  if (techStack.viewSkillBars) {
    return (
      <Fade bottom duration={1000} distance="20px">
        <div className="skills-container">
          <div className="skills-bar">
            <h1 className="skills-heading">Skills & Expertise</h1>
            {techStack.experience.map((exp, i) => {
              return (
                <div key={i} className="skill">
                  <p>{exp.Stack}</p>
                  <div className="meter skill-level">
                    <span>{exp.level}</span>
                  </div>
                  <p className="subTitle skill-tools">{exp.tools}</p>
                </div>
              );
            })}
          </div>

          <div className="skills-image">
            {illustration.animated ? (
              <DisplayLottie animationData={Build} />
            ) : (
              <img
                alt="Skills"
                src={require("../../assets/images/skill.svg")}
              />
            )}
          </div>
        </div>
      </Fade>
    );
  }
  return null;
}
