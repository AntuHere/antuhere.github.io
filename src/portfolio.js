import splashAnimation from "./assets/lottie/splashAnimation";
import {researchProjects} from "./data/researchProjects";
import portfolioMedia from "./data/portfolioMedia.json";

const splashScreen = {
  enabled: true,
  animation: splashAnimation,
  duration: 2000
};

const illustration = {animated: true};

const greeting = {
  // Retain the original handwritten signature in the header and splash screen.
  username: "Antu Here",
  name: "Nasfiqul Islam Antu",
  title: "Nasfiqul Islam Antu",
  subTitle: "I'm a Civil and Environmental Engineering undergraduate at the Islamic University of Technology (IUT), exploring transportation systems, mixed traffic behaviour, and environmental challenges through computer vision, machine learning, and quantitative research.",
  FootersubTitle: "Transportation Engineering Researcher",
  role: "Undergraduate Researcher | Civil & Environmental Engineering",
  photo: "/images/nasfiqul-islam-antu.png",
  cv: "/cv/Md_Nasfiqul_Islam_Antu_CV.pdf",
  displayGreeting: true
};

const socialMediaLinks = {
  github: "https://github.com/AntuHere",
  linkedin: "https://linkedin.com/in/nasfiqul-antu",
  gmail: "nasfiqul.antu@gmail.com",
  scholar: "https://scholar.google.com/citations?user=Wtr485cAAAAJ",
  display: true
};

const skillsSection = {
  title: "About Me",
  subTitle: "UNDERGRADUATE RESEARCHER | CIVIL & ENVIRONMENTAL ENGINEERING",
  skills: [
    "I am a final-year Civil and Environmental Engineering undergraduate at the Islamic University of Technology (IUT), Bangladesh, with a strong interest in transportation and traffic engineering.",
    "I have co-authored seven peer-reviewed journal articles on climate change, food systems and the environment. My contributions include field data collection, data analysis and literature review.",
    "I am currently working on five ongoing research projects involving computer vision-based traffic analysis and statistical analysis of environmental survey data. I am seeking a research assistant role to strengthen my skills in data-driven transportation research, machine learning and academic writing."
  ],
  interests: [
    "Transportation & Traffic Engineering",
    "Intelligent Transportation Systems",
    "Mixed / Heterogeneous Traffic Behaviour",
    "Computer Vision for Transportation",
    "Road Safety",
    "Machine Learning & Predictive Modelling",
    "Environmental Sustainability & Climate Change"
  ],
  softwareSkills: [
    {skillName: "Python", fontAwesomeClassname: "fab fa-python"},
    {skillName: "R", fontAwesomeClassname: "fab fa-r-project"},
    {skillName: "Excel", fontAwesomeClassname: "fas fa-file-excel"},
    {skillName: "YOLO / OpenCV", fontAwesomeClassname: "fas fa-eye"},
    {skillName: "Roboflow", fontAwesomeClassname: "fas fa-images"},
    {skillName: "Research", fontAwesomeClassname: "fas fa-microscope"},
    {skillName: "Git / GitHub", fontAwesomeClassname: "fab fa-github"}
  ],
  display: true
};

const educationInfo = {
  display: true,
  schools: [
    {
      schoolName: "Islamic University of Technology (IUT)",
      initials: "IUT",
      logo: portfolioMedia.iutLogo.src,
      logoAlt: portfolioMedia.iutLogo.alt,
      logoFit: "contain",
      subHeader: "B.Sc. in Civil and Environmental Engineering",
      duration: "Expected graduation: October 2027",
      desc: "Fourth Year, Seventh Semester · Gazipur, Bangladesh",
      descBullets: [
        "Relevant coursework: Transportation and Traffic Engineering; Civil Engineering Data Analysis; Pavement and Railway Engineering."
      ]
    },
    {
      schoolName: "Dhaka College",
      logo: require("./assets/images/DCLogo.png"),
      subHeader: "Higher Secondary Certificate (HSC), Science",
      duration: "2022",
      desc: "GPA: 5.00 / 5.00"
    },
    {
      schoolName: "BIAM Model School and College, Bogura",
      logo: require("./assets/images/BiamLogo.jpg"),
      subHeader: "Secondary School Certificate (SSC), Science",
      duration: "2020",
      desc: "GPA: 5.00 / 5.00"
    }
  ]
};

// Descriptive levels from the CV, rather than invented proficiency percentages.
const techStack = {
  viewSkillBars: true,
  experience: [
    {
      Stack: "Programming & Data Analysis",
      level: "Research practice",
      tools: "Python (Pandas, NumPy, Matplotlib, Seaborn, Jupyter Notebook), R, Microsoft Excel."
    },
    {
      Stack: "Computer Vision & Deep Learning",
      level: "Training and fine-tuning",
      tools: "YOLO object detection, OpenCV, Roboflow annotation and dataset management; PyTorch / TensorFlow."
    },
    {
      Stack: "Statistical Analysis",
      level: "Quantitative research",
      tools: "Descriptive statistics; t-test, ANOVA, chi-square and correlation analysis; linear, multiple and logistic regression."
    },
    {
      Stack: "Machine Learning & Explainable AI",
      level: "Fundamentals / basic familiarity",
      tools: "Familiarity with scikit-learn, regression and Random Forest. Basic familiarity with Decision Tree, XGBoost, LightGBM, SVM, KNN, Naive Bayes, SHAP, LIME and feature-importance analysis."
    },
    {
      Stack: "Research Methods",
      level: "Ongoing research experience",
      tools: "Field data collection, questionnaire surveys, quantitative data analysis, literature review and academic writing."
    },
    {
      Stack: "Tools & Documentation",
      level: "Research workflow",
      tools: "LaTeX, Mendeley / Zotero, Git, GitHub, Microsoft Word and PowerPoint."
    },
    {
      Stack: "GIS & Traffic Simulation",
      level: "Basic GIS / currently learning simulation",
      tools: "Basic GIS: short course at the Institute of Water Modelling. Currently learning SUMO and PTV VISSIM."
    }
  ],
  displayCodersrank: false
};

// Keep the existing optional experience component; do not invent appointments.
const workExperiences = {display: false, experience: []};
const openSource = {showGithubProfile: "false", display: true};

const bigProjects = {
  title: "Research Projects",
  subtitle: "5 Ongoing Research Projects",
  projects: researchProjects,
  display: true
};

const volunteering = {
  title: "Volunteering & Leadership",
  organization: "BB Mobile School",
  role: "Co-founder & Volunteer",
  description: "Co-founder and volunteer at BB Mobile School, a community-focused initiative. Contributed to volunteer activities, team coordination, and community engagement.",
  url: "https://www.facebook.com/BB.MobileSchool",
  logo: portfolioMedia.volunteerLogo,
  photos: [portfolioMedia.volunteerGroup, portfolioMedia.volunteerBanner]
};

const contactInfo = {
  title: "Let's Connect",
  subtitle: "I'm interested in transportation research, intelligent mobility, computer vision, and interdisciplinary engineering research. Feel free to reach out for academic discussions, research opportunities, or collaboration.",
  number: "+8801773890624",
  email_address: "nasfiqul.antu@gmail.com",
  location: "Dhaka, Bangladesh",
  display: true
};

export {
  illustration, greeting, socialMediaLinks, splashScreen, skillsSection,
  educationInfo, techStack, workExperiences, openSource, bigProjects, contactInfo, volunteering
};
