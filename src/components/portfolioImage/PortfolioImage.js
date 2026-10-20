import React from "react";
import "./PortfolioImage.css";

// Optional research photos can be added later without empty or broken slots.
export default function PortfolioImage({asset, className = "", eager = false}) {
  if (!asset || !asset.src) return null;
  return (
    <figure className={`portfolio-image ${className}`}>
      <img src={asset.src} alt={asset.alt} width={asset.width} height={asset.height} loading={eager ? "eager" : "lazy"} decoding="async" />
      {asset.credit && <figcaption className="subTitle"><a href={asset.credit.url} target="_blank" rel="noopener noreferrer">{asset.credit.text}</a>{asset.credit.license && ` · ${asset.credit.license}`}</figcaption>}
    </figure>
  );
}
