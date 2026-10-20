import React from "react";
import "./PortfolioImage.css";

// Original photo files must be available locally before assigning asset.src.
// Draft placeholders are explicit and never substitute a synthetic research photo.
export default function PortfolioImage({asset, className = "", eager = false}) {
  return (
    <figure className={`portfolio-image ${className}`}>
      {asset && asset.src ? (
        <img src={asset.src} alt={asset.alt} loading={eager ? "eager" : "lazy"} decoding="async" />
      ) : (
        <div className="portfolio-image-pending" role="img" aria-label={asset ? asset.alt : "Research photograph"}>
          <i className="fas fa-image" aria-hidden="true"></i>
          <span>Original photograph pending</span>
        </div>
      )}
      {asset && asset.credit && <figcaption className="subTitle"><a href={asset.credit.url} target="_blank" rel="noopener noreferrer">{asset.credit.text}</a>{asset.credit.license && ` · ${asset.credit.license}`}</figcaption>}
    </figure>
  );
}
