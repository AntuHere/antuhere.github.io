import React, {useContext} from "react";
import {Fade} from "react-reveal";
import "./Greeting.css";
import SocialMedia from "../../components/socialMedia/SocialMedia";
import Button from "../../components/button/Button";

import {illustration, greeting} from "../../portfolio";
import StyleContext from "../../contexts/StyleContext";

export default function Greeting() {
  const {isDark} = useContext(StyleContext);
  if (!greeting.displayGreeting) {
    return null;
  }

  return (
    <Fade bottom duration={1000} distance="40px">
      <div className="greet-main" id="greeting">
        <div className="greeting-main">
          <div className="greeting-text-div">
            <div>
              <h1
                className={isDark ? "dark-mode greeting-text" : "greeting-text"}
              >
                {" "}
                {greeting.title}{" "}
                <span className="wave-emoji" role="img" aria-label="Waving hand">👋</span>
              </h1>
              <p
                className={
                  isDark
                    ? "dark-mode greeting-text-p"
                    : "greeting-text-p subTitle"
                }
              >
                {greeting.subTitle}
              </p>
              <p
                className="greeting-text-p FootersubTitle"
              >
                {greeting.FootersubTitle}
              </p>
              <SocialMedia />
              <div className="button-greeting-div">
                <Button text="Explore My Research" href="#projects" />
                <Button text="Download CV" href={greeting.cv} download="Md_Nasfiqul_Islam_Antu_CV.pdf" />
                
              </div>
            </div>
          </div>
          <div className="greeting-image-div">
            {illustration.animated ? (
                <div className="main">
                <div className="row">
                  <div className="image-content-profile">
                    <img
                      src={greeting.photo}
                      alt="Nasfiqul Islam Antu — professional portrait"
                      className="profile-image"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <img
                alt="man sitting on table"
                src={require("../../assets/images/manOnTable.svg")}
              ></img>
            )}
          </div>
        </div>
      </div>
    </Fade>
  );
}
