import media from "./portfolioMedia.json";

// Current project scope and progress supplied by the portfolio owner.
// Photographs are illustrative context unless explicitly credited as study data.
export const researchProjects = [
  {
    id: "rickshaw",
    projectName: "Rickshaw Passenger Pickup/Drop-off and Stopping-Duration Analysis",
    category: "Transportation Engineering | Computer Vision",
    status: "Ongoing — Model Refinement & Data Analysis",
    projectDesc: "Investigating rickshaw stopping events, passenger pickup/drop-off activities, and dwell-time characteristics in Dhaka's heterogeneous traffic using roadside video and computer vision.",
    overview: "This research investigates passenger-related rickshaw stopping behaviour in non-lane-based urban traffic. Video datasets collected from different roadside environments in Dhaka are analysed using a computer vision pipeline to identify rickshaw movements, stopping events, and passenger interactions. The work focuses on understanding stopping frequency, dwell-time variation, and differences between roadside activity environments.",
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
    projectDesc: "Investigating lateral vehicle movement, trajectory patterns, and interactions among road users in heterogeneous, non-lane-based traffic.",
    overview: "This collaborative research explores lateral movement behaviour in heterogeneous traffic streams where strict lane discipline is often absent. The study aims to examine how vehicles shift their lateral positions, interact with neighbouring vehicles, and potentially influence traffic operations. Computer vision and vehicle tracking approaches are being developed to extract movement information from roadside traffic footage.",
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
    projectDesc: "Assessing perceived soil, agricultural, and environmental impacts of road construction and demolition waste using questionnaire surveys and quantitative analysis.",
    overview: "This study investigates environmental concerns related to road construction and demolition waste in Bangladesh. Questionnaire-based data are used to examine respondents' observations of waste types, perceived soil and agricultural impacts, environmental degradation, health concerns, and attitudes toward sustainable waste management. Statistical analysis is used to explore response patterns and potential associations among variables.",
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
    projectDesc: "Exploring the potential mismatch between conventional traffic performance and emergency vehicle accessibility in heterogeneous urban road networks.",
    overview: "This emerging research examines whether commonly used traffic indicators, such as average vehicle speed and congestion, are sufficient to describe emergency vehicle accessibility. The proposed study explores how roadway geometry, lateral clearance, mixed vehicle composition, roadside encroachment, and traffic organization may influence the ability of emergency vehicles to navigate urban roads.",
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
    projectDesc: "Exploring how stationary rickshaws and informal curbside activities influence usable roadway width, bus stopping behaviour, and traffic interactions in Dhaka.",
    overview: "This research direction emerged from field observations of curbside activities in Dhaka. The investigation focuses on how rickshaws occupying curbside space may influence stopping decisions by buses and other vehicles, potentially shifting passenger-serving activities toward the roadway interior and affecting following traffic. The study seeks to investigate the operational consequences of curbside occupation, particularly in mixed traffic environments with limited lane discipline.",
    activities: ["Field reconnaissance", "Observation of curbside rickshaw occupancy", "Identification of bus and vehicle stopping patterns", "Usable roadway width assessment", "Observation of follower interactions", "Video-based event identification", "Exploration of potential operational impacts"],
    indicators: ["Curbside occupancy", "Effective road width", "Stopping location", "Lateral intrusion", "Following vehicle response", "Traffic disturbance duration"],
    methodsLabel: "Methods under consideration",
    technologies: ["Traffic Video Analysis", "Field Observation", "Curbside Occupancy Analysis", "Statistical Analysis"],
    progressText: "Exploratory field research and scope refinement.",
    image: media.curbside
  }
];
