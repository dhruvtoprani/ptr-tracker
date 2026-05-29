import { recalculateAllStudents } from "../shared/rules.js";
import type { ActivityState, AppState, Student } from "../shared/types.js";

type SeedRow = {
  firstName: string;
  lastName: string;
  emailRaw: string;
  firstGeneration: string;
  transferStudent: string;
  transferDetails: string;
  previousResearchExperience: string;
  previousResearchDescription: string;
  honorsCollege: string;
  additionalExperiences: string;
  workStudy: string;
  researchInterests: string;
  whyResearch: string;
  fieldOfInterest: string;
  researchEnvironment: string;
  hasPotentialMentor: string;
  mentorNames: string;
  mentorContacted: string;
  cohortPreference: string;
  referralSource: string;
  accessibilityNeeds: string;
  accessibilityNotes: string;
  acknowledgementPathway: string;
  acknowledgementEligibility: string;
};

const ROSTER_SEED_ROWS: SeedRow[] = [
  {
    firstName: "Paul",
    lastName: "Elenich",
    emailRaw: "elenichp@msu.edu",
    firstGeneration: "Yes",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests:
      "Semiconductors, Microelectronics/Microrobotics, Electromagnetics, Biomedical and Biosystem applications of Electrical Engineering",
    whyResearch:
      "I am interested in undergraduate research because I enjoy developing and testing new ideas and working on open-ended problems. I want to gain hands-on experience and better understand how concepts from coursework apply to real-world systems, particularly in interdisciplinary areas such as biological applications.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics),Interdisciplinary",
    researchEnvironment:
      "Wet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "I was informed by a friend",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Jocelyn",
    lastName: "Pike",
    emailRaw: "pikejoce@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests: "Robotics, mechanics, and manufacturing",
    whyResearch:
      "I want to participate in undergraduate research to get a better understanding of what new technology is shaping the future of my field along with contributing to its advancement.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment:
      "Wet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "I got an email from The Center about Pathway",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Pari",
    lastName: "Nimbalkar",
    emailRaw: "nimbalk1@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "Yes",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests:
      "Robotics and automation, Connected and Autonomous Networked Vehicles for Active Safety, Biomechanics",
    whyResearch:
      "I want to partake in purposeful innovation. Research will give me the knowledge and skills to grow as a robotics engineer and create technologies that make a real difference in people's lives.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "Yes",
    mentorNames: "Daniel Morris",
    mentorContacted: "Yes",
    cohortPreference: "STEM",
    referralSource:
      "I arranged a meeting with a student ambassador through the College of Engineering, Charmi Koppolu, and she talked to me about this opportunity.",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Noel",
    lastName: "Premkumar",
    emailRaw: "premkum5@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "Yes",
    researchInterests:
      "mechanical, technological, automotive, programming, robotics, artificial intelligence",
    whyResearch:
      "I want to be able to expand my resume and my portfolio whilst being able to gain new knowledge and understanding in different things closely related to my degree.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment:
      "Dry Lab (Computational, Physics, Applied Mathematics),Digital/Virtual (Humanities, Digital Humanities, Social Sciences),Not Sure",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "General (No preference),STEM",
    referralSource: "I attended an open house for Pathway to Research.",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Kshitij Ramchandra",
    lastName: "Khandagale",
    emailRaw: "khandaga@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "Yes",
    additionalExperiences: "",
    workStudy: "Yes",
    researchInterests: "Artificial Intelligence, Robotics",
    whyResearch:
      "My career goal is to become an Artificial Intelligence Research Scientist at frontier AI labs. For this, research experience is crucial.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "MSU NSO",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Adi",
    lastName: "Sutaria",
    emailRaw: "sutariaa@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "Yes",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests: "Automotive, robotics, or some mix of the two.",
    whyResearch:
      "I want to participate in undergraduate research because I can gain knowledge in what I am interested in and work with professors who are talented in the engineering field.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "D2L course",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Fernando",
    lastName: "Chiba",
    emailRaw: "chibafer@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "Yes",
    additionalExperiences: "Honors College Seminar",
    workStudy: "No",
    researchInterests: "Machine Learning, Robotics, Neural limbs and prosthetics, data analysis",
    whyResearch:
      "I believe the participation in undergraduate research can expand my views on what I will work after graduation, as well as helping the scientific community by applying my knowledge.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics),Interdisciplinary",
    researchEnvironment:
      "Wet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM,Arts and Humanities",
    referralSource: "Email from MSU",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Mazen",
    lastName: "Assanein",
    emailRaw: "assaneinm@gmail.com, assanein@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "Yes",
    researchInterests: "Robotics, BioMed, Mechanics",
    whyResearch:
      "Working in research during high school sparked an interest in research and higher education. As someone who plans on pursuing a PhD I want to be very comfortable with research. I also want to participate in helping advance the world through research.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Not Sure",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "Online research",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Tanvi",
    lastName: "Gadiraju",
    emailRaw: "gadiraj4@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "Yes",
    additionalExperiences: "Honors College Seminar",
    workStudy: "No",
    researchInterests: "AI/Machine Learning, Computational Data Science",
    whyResearch:
      "I would like to participate in undergraduate research because I would like to explore my passions in an applicable way.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Dry Lab (Computational, Physics, Applied Mathematics),Not Sure",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "Paper on tables in the STEM building.",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Brody",
    lastName: "Tozer",
    emailRaw: "Tozerbro@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "Yes",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests: "Artificial intelligence, materials, batteries, aerodynamics",
    whyResearch:
      "I want to participate in undergraduate research to get hands on experience in research and to make a potential difference in the world.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment:
      "Wet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics),Digital/Virtual (Humanities, Digital Humanities, Social Sciences)",
    hasPotentialMentor: "Yes",
    mentorNames: "Arun Ross, Kristen Johnson",
    mentorContacted: "No",
    cohortPreference: "STEM",
    referralSource: "Through emails",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Nolan",
    lastName: "Hall",
    emailRaw: "hallnola@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "Yes",
    additionalExperiences: "Honors College Seminar",
    workStudy: "No",
    researchInterests:
      "Electrical Engineering, Semiconductors, Renewable Energy, PCB design and Fabrication, Additive Manufacturing",
    whyResearch:
      "Since I have known I wanted to pursue a career in engineering, I have wanted to go into research and development in my field. There is something about being on the cutting edge of any industry that is so much more appealing than being in production. Finding creative, new solutions is much more rewarding than applying things that are already known. I have decided to pursue a PhD, at the recommendation of my professors, after I finish my undergrad degree. I believe that being in undergraduate research would satisfy my love for R&D and help bolster my graduate application.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment:
      "Wet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "Through a friend (Ava Curtin)",
    accessibilityNeeds: "Yes",
    accessibilityNotes: "I have an RCPD Visa",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Faiez",
    lastName: "Mahmood",
    emailRaw: "mahmoo73@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests:
      "Mechanical engineering, especially design, energy systems, and how machines work. I am interested in improving how systems run, making them more efficient, and solving real world engineering problems.",
    whyResearch:
      "I want to do undergraduate research to get hands on experience and apply what I learn in class to real situations. My engineering classes have helped me build strong problem solving skills, and I want to keep improving them by working on real projects. Research will also help me understand how engineers design and improve systems in the real world.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment:
      "Dry Lab (Computational, Physics, Applied Mathematics),Digital/Virtual (Humanities, Digital Humanities, Social Sciences)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM,Arts and Humanities",
    referralSource: "A friend recommended me to do it.",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Shashank Reddy",
    lastName: "Gadila",
    emailRaw: "gadilash@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests:
      "Mechanical Engineering and Aerospace Engineering oriented - Thermal & Fluid Dynamics, Aerodynamics, Composite Materials, Propulsion, Control Groups",
    whyResearch:
      "I am eager to learning about UR research with some previous experience from high school. I want to take a step forward and gather some research experience here at MSU, and maybe pursue a more research-oriented career if it interests me more.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment:
      "Wet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "Yes",
    mentorNames: "Dr. Manoochehr Koochesfahani & Research Team",
    mentorContacted: "No",
    cohortPreference: "STEM",
    referralSource: "Instagram & In-Person Session",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Luke",
    lastName: "Brydges",
    emailRaw: "brydgesl@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests:
      "Any research in the material science field involving alloy-based testing or future innovations in aeronautical applications",
    whyResearch:
      "Undergrad research is the best way to get the foot in the doors to future career paths and real work experience besides an internship and it also helps build your resume.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment:
      "Wet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics),Not Sure",
    hasPotentialMentor: "Yes",
    mentorNames: "Carl Boehlert",
    mentorContacted: "Yes",
    cohortPreference: "STEM",
    referralSource: "email",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Amir",
    lastName: "Chowdhury",
    emailRaw: "chowd168@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "Yes",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests: "Engineering Mechanics, Energy Conservation, Fluid Mechanics, Propulsion",
    whyResearch:
      "As a Mech E, I have heard a lot about industry and less about research. I am curious to see what research in engineering has to offer.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment:
      "Wet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "General (No preference)",
    referralSource: "Engineering Career Office",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Sahana",
    lastName: "Shivakumar",
    emailRaw: "shivaku7@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "Yes",
    researchInterests: "Mechanical Engineering, Aircraft & Aerospace",
    whyResearch:
      "I want to pursue research in aeronautical and aerospace systems because I am deeply interested in understanding how complex engineering principles translate into real-world flight. Aircraft and spacecraft operate under extreme conditions where precision, efficiency, and safety are critical, and I am motivated by the challenge of contributing to systems where even small improvements can have a significant impact. Research in this field gives me the opportunity to go beyond applying existing knowledge and instead help develop new technologies. Ultimately, I want to contribute to pushing the boundaries of what is possible.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment:
      "Dry Lab (Computational, Physics, Applied Mathematics),Digital/Virtual (Humanities, Digital Humanities, Social Sciences)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "Email.",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Pranjal",
    lastName: "Prithvi",
    emailRaw: "prithvip@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "Yes",
    additionalExperiences: "Honors College Seminar",
    workStudy: "Yes",
    researchInterests:
      "Aerospace systems engineering, experimental engineering, unmanned aerial systems (UAVs), propulsion concepts, and hands-on mechanical design, integration, and testing.",
    whyResearch:
      "I want to get some real-world experience working on engineering systems and learn how different parts work together to make a full, working design. As a rising sophomore, I want to learn through hands-on experience and build a strong base for my future work in aerospace engineering.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "Through my advisor",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Rory",
    lastName: "Wendt",
    emailRaw: "wendtro3@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "Yes",
    researchInterests: "Engineering research in automotive or manufacturing, but I'm open to anything",
    whyResearch:
      "I want to gain experience and develop a better understanding of the fields I want to enter",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Dry Lab (Computational, Physics, Applied Mathematics),Not Sure",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "I saw a QR code in the STEM building",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Elias",
    lastName: "Bourgeois",
    emailRaw: "bourge25@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests: "Anything related to machine learning or AI",
    whyResearch: "To have the experience and resources to study deeper into my personal interests.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Not Sure",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "msu website",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Janetzi",
    lastName: "Sanchez Marquez",
    emailRaw: "sanch712@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests: "Engineering",
    whyResearch:
      "I am unable to obtain a job due to my visa status and I would like to know more about different opportunities.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "Global Spartans",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Raed",
    lastName: "Osama",
    emailRaw: "osamasye@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests:
      "Applied engineering research: sustainable manufacturing, mobility and EV systems, supply chain, operations analytics, product development, and technology management.",
    whyResearch:
      "I am still exploring my academic and career direction in Applied Engineering Sciences. I want to learn how research works and how engineering problems are studied in more detail. Through research, I hope to explore areas like manufacturing, mobility, supply chain, sustainability, and technology management.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics),Interdisciplinary",
    researchEnvironment: "Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "General (No preference)",
    referralSource: "I was recommended by a fellow research assistant",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Hitesh",
    lastName: "Tirumalasetti",
    emailRaw: "Hitesh.tsetti@gmail.com, tirumal6@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "Yes",
    additionalExperiences: "Honors College Seminar",
    workStudy: "No",
    researchInterests: "Machine Learning, Artificial Learning, Computer Science, Finance",
    whyResearch: "I want to learn more about research and get to know how to implement first principles.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "STEM Building",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Rahul",
    lastName: "P",
    emailRaw: "Pataska1@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests: "Manufacturing, AI",
    whyResearch: "I actually graduated last week",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Not Sure",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "STEM building ad",
    accessibilityNeeds: "No",
    accessibilityNotes: "",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  },
  {
    firstName: "Delger",
    lastName: "Byambasukh",
    emailRaw: "byambasu@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    transferDetails: "",
    previousResearchExperience: "No",
    previousResearchDescription: "",
    honorsCollege: "No",
    additionalExperiences: "",
    workStudy: "No",
    researchInterests: "Artificial Intelligence",
    whyResearch: "Because I want to strengthen my understanding of AI, and help improve daily life.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "",
    cohortPreference: "STEM",
    referralSource: "Friends",
    accessibilityNeeds: "Yes",
    accessibilityNotes:
      "I am currently in Mongolia, not in the USA. I won't come back to the USA until late August.",
    acknowledgementPathway: "I acknowledge the above statement.",
    acknowledgementEligibility: "I acknowledge the above statement."
  }
];

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function splitEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function pickPrimaryAndAlternates(raw: string): { primary: string; alternates: string[] } {
  const emails = splitEmails(raw);
  if (!emails.length) {
    return { primary: "", alternates: [] };
  }

  const primary = emails.find((email) => /@msu\.edu$/i.test(email)) ?? emails[0];
  const alternates = emails.filter((email) => email.toLowerCase() !== primary.toLowerCase());
  return { primary, alternates };
}

function emptyActivityState(): ActivityState {
  return {
    computedScore: 0,
    computedLevel: "Inactive",
    explanation: "Inactive: little recent engagement. Consider outreach or archive.",
    manualOverride: false
  };
}

function buildSeedStudents(): Student[] {
  return ROSTER_SEED_ROWS.map((row, index) => {
    const { primary, alternates } = pickPrimaryAndAlternates(row.emailRaw);
    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();

    return {
      id: `${toSlug(firstName)}-${toSlug(lastName)}-${index + 1}`,
      name: `${firstName} ${lastName}`.trim(),
      email: primary,
      alternateEmails: alternates,
      major: "",
      year: "",
      interest: row.researchInterests,
      linkedinUrl: "",
      notes: "",
      archived: false,
      engagementFlags: {
        openConcernFlag: false
      },
      activity: emptyActivityState(),
      dropOffRisk: {
        level: "Low",
        reasons: ["Low risk: recent attendance, current assignments, and no major concerns."],
        manuallyMarkedDropped: false
      },
      profile: {
        firstGeneration: row.firstGeneration,
        transferStudent: row.transferStudent,
        transferDetails: row.transferDetails,
        previousResearchExperience: row.previousResearchExperience,
        previousResearchDescription: row.previousResearchDescription,
        honorsCollege: row.honorsCollege,
        additionalExperiences: row.additionalExperiences,
        workStudy: row.workStudy,
        researchInterests: row.researchInterests,
        whyResearch: row.whyResearch,
        fieldOfInterest: row.fieldOfInterest,
        researchEnvironment: row.researchEnvironment,
        hasPotentialMentor: row.hasPotentialMentor,
        mentorNames: row.mentorNames,
        mentorContacted: row.mentorContacted,
        cohortPreference: row.cohortPreference,
        referralSource: row.referralSource,
        accessibilityNeeds: row.accessibilityNeeds,
        accessibilityNotes: row.accessibilityNotes,
        acknowledgementPathway: row.acknowledgementPathway,
        acknowledgementEligibility: row.acknowledgementEligibility
      },
      assignments: {},
      attendance: [],
      advisingSessions: []
    };
  });
}

export function createSeedState(): AppState {
  const students = recalculateAllStudents(buildSeedStudents(), []);
  return {
    students,
    assignments: [],
    attendanceSessions: [],
    updatedAt: new Date().toISOString()
  };
}
