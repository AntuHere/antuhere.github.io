import media from "./portfolioMedia.json";

// Current project scope and progress supplied by the portfolio owner.
// Photographs are illustrative context unless explicitly credited as study data.
export const researchProjects = [
  {
    id: "rickshaw",
    projectName: "Rickshaw Passenger Pickup/Drop-off and Stopping-Duration Analysis",
    category: "Transportation Engineering | Computer Vision",
    status: "Ongoing — Model Refinement & Data Analysis",
    projectDesc: "Analysing rickshaw pickup/drop-off events and stopping durations in Dhaka using video and computer vision.",
    overview: "Roadside video analysis of stopping frequency, dwell time and passenger interactions.",
    activities: ["Roadside traffic video preparation", "Dataset annotation using Roboflow", "YOLO-based rickshaw detection", "Vehicle tracking and stopping-event identification", "Boarding and alighting classification", "Stopping-duration estimation", "Statistical comparison across study locations"],
    technologies: ["YOLO", "OpenCV", "Roboflow", "Python", "Vehicle Tracking", "Statistical Analysis"],
    progressText: "Data collection completed; model fine-tuning and analysis ongoing.",
    image: media.rickshaw
  },
  {
    id: "lateral",
    projectName: "Lateral Movement of Vehicles in Mixed Traffic",
    category: "Transportation Engineering | Traffic Behaviour",
    status: "Ongoing — Methodology & Model Development",
    projectDesc: "Studying vehicle trajectories and lateral interactions in mixed, non-lane-based traffic.",
    overview: "Developing detection and tracking methods to compare lateral displacement and vehicle interactions.",
    activities: ["Literature review", "Research question and methodology development", "Vehicle detection and tracking", "Trajectory extraction", "Lateral displacement analysis", "Surrounding-vehicle interaction analysis", "Exploration of traffic operational impacts"],
    technologies: ["YOLO", "OpenCV", "Vehicle Tracking", "Trajectory Analysis", "Python"],
    progressText: "Research methodology and model development ongoing. The final research question remains under development.",
    image: media.lateral
  },
  {
    id: "waste",
    projectName: "Road Construction and Demolition Waste: Soil Pollution and Environmental Impacts",
    category: "Environmental Engineering | Statistical Research",
    status: "Ongoing — Data Analysis",
    projectDesc: "Examining perceived soil and environmental impacts of road construction waste through survey analysis.",
    overview: "Survey-based analysis of waste impacts and attitudes toward sustainable management.",
    activities: ["Literature review", "Questionnaire development", "Survey data collection", "Dataset preparation", "Descriptive statistical analysis", "Hypothesis testing", "Regression and association analysis", "Interpretation of environmental impact perceptions"],
    technologies: ["Survey Research", "Excel", "R", "Python", "Statistical Analysis"],
    progressText: "Data collection completed; statistical analysis ongoing.",
    image: media.waste
  },
  {
    id: "emergency",
    projectName: "Emergency Vehicle Accessibility in Heterogeneous Urban Traffic",
    category: "Transportation Engineering | Emergency Mobility",
    status: "Ongoing — Concept Development",
    projectDesc: "Exploring how mixed traffic and roadway conditions affect emergency vehicle access.",
    overview: "Assessing clearance, road geometry and vehicle mix alongside conventional traffic measures.",
    questions: ["Can a road operating at moderate congestion still have poor emergency accessibility?", "How does available lateral clearance affect emergency vehicle movement?", "Can heterogeneous vehicle composition create operational barriers not reflected in conventional traffic indicators?", "Which roadway and traffic characteristics should be considered when evaluating emergency access?"],
    activitiesLabel: "Proposed research activities",
    activities: ["Literature review", "Identification of suitable study locations", "Roadway and traffic condition assessment", "Video-based observational analysis", "Investigation of accessibility-related indicators", "Comparison with conventional traffic performance measures"],
    methodsLabel: "Methods under consideration",
    technologies: ["Traffic Video Analysis", "Roadway Geometry Assessment", "Quantitative Analysis"],
    progressText: "Concept development and methodology exploration.",
    image: media.emergency
  },
  {
    id: "curbside",
    projectName: "Curbside Occupancy and Traffic Disruption in Mixed Traffic",
    category: "Transportation Engineering | Curbside Operations",
    status: "Ongoing — Exploratory Field Research",
    projectDesc: "Studying how curbside rickshaws and informal stops affect road width and following traffic.",
    overview: "Field observations of curbside occupancy, bus stopping locations and traffic disruption.",
    activities: ["Field reconnaissance", "Observation of curbside rickshaw occupancy", "Identification of bus and vehicle stopping patterns", "Usable roadway width assessment", "Observation of follower interactions", "Video-based event identification", "Exploration of potential operational impacts"],
    indicators: ["Curbside occupancy", "Effective road width", "Stopping location", "Lateral intrusion", "Following vehicle response", "Traffic disturbance duration"],
    methodsLabel: "Methods under consideration",
    technologies: ["Traffic Video Analysis", "Field Observation", "Curbside Occupancy Analysis", "Statistical Analysis"],
    progressText: "Exploratory field research and scope refinement.",
    image: media.curbside
  }
];
