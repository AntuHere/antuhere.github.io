import React from "react";
import "./Button.css";

export default function Button({text, className, href, newTab, download}) {
  return (
    <div className={className}>
      <a className="main-button" href={href} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined} download={download}>
        {text}
      </a>
    </div>
  );
}
