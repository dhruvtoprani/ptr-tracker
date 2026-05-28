import { recalculateAllStudents } from "../shared/rules";
import type { ActivityState, AppState, Student } from "../shared/types";

const ROSTER_TSV = `First Name\tLast Name\tMSU Email Address\tDo you identify as a first-generation student?\tAre you a transfer student?\tWhat school did you transfer from and when?\tHave you had a previous undergraduate research experience?\tPlease describe your previous undergraduate research experience.\tAre you in the Honors College?\tHave you had any of the following experiences?\tDo you have work-study (listed as FED College Work Study on your financial aid notice)?\tPlease list your research interest(s).\tBriefly describe why you want to participate in undergraduate research.\tWhat best describes your field of interest? (Select all that apply)\tWhat kind of research environment(s) interest you? (Select all that apply)\tDo you have potential research mentor(s) in mind?\tPlease list the mentor(s) you have in mind.\tHave you already been in contact with the mentor(s)?\tThe program will consist of several cohorts. Please select the option(s) that interest you.\tHow did you hear about Pathway to Research?\tDo you have any accessibility needs/concerns? - Selected Choice\tDo you have any accessibility needs/concerns? - Yes - Text\tI acknowledge that the Pathway to Research program teaches me how to find and pursue an undergraduate research position and does not provide a list of openings or do the research placement for me.\tI acknowledge that the Pathway to Research program is for undergraduate students who have not had a previous research experience at MSU.\tQ_RecaptchaStatus\tQ_RecaptchaError
Paul\tElenich\telenichp@msu.edu\tYes\tNo\t\tNo\t\tNo\t\tNo\tSemiconductors, Microelectronics/Microrobotics, Electromagnetics, Biomedical and Biosystem applications of Elecrical Engineering\tI am interested in undergraduate research because I enjoy developing and testing new ideas and working on open-ended problems. I want to gain hands-on experience and better understand how concepts from coursework apply to real-world systems, particularly in interdisciplinary areas such as biological applications.\tSTEM (Science, Technology, Engineering, Mathematics),Interdisciplinary\tWet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)\tNo\t\t\tSTEM\tI was infromed by a friend\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Jocelyn\tPike\tpikejoce@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tNo\tRobotics, mechanics, and manufacturing\tI want to participate in undergraduate research to get a better understanding of what new technology is shaping the future of my field along with contributing to its advancement.\tSTEM (Science, Technology, Engineering, Mathematics)\tWet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)\tNo\t\t\tSTEM\tI got an email from The Center about Pathway\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Pari\tNimbalkar\tnimbalk1@msu.edu\tNo\tNo\t\tNo\t\tYes\t\tNo\tRobotics and automation, Connected and Autonomous Networked Vehicles for Active Safety, Biomechanics\tI want to partake in purposeful innovation. Research will give me the knowledge and skills to grow as a robotics engineer and create technologies that make a real difference in people’s lives.\tSTEM (Science, Technology, Engineering, Mathematics)\tDry Lab (Computational, Physics, Applied Mathematics)\tYes\tDaniel Morris\tYes\tSTEM\tI arranged a meeting with a student ambassador through the College of Engineering, Charmi Koppolu, and she talked to me about this opportunity.\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Noel\tPremkumar\tpremkum5@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tYes\tmechanical, technological, automotive, programming, robotics, artificial intelligence\tI want to be able to expand my resume and my portfolio whilst being able to gain new knowledge and understanding in different things closely related to my degree.\tSTEM (Science, Technology, Engineering, Mathematics)\tDry Lab (Computational, Physics, Applied Mathematics),Digital/Virtual (Humanities, Digital Humanities, Social Sciences),Not Sure\tNo\t\t\tGeneral (No preference),STEM\tI attended an open house for Pathway to Research.\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Kshitij Ramchandra\tKhandagale\tkhandaga@msu.edu\tNo\tNo\t\tNo\t\tYes\t\tYes\tArtificial Intelligence, Robotics\tMy career goal is to become an Artificial Intelligence Research Scientist at frontier AI labs. For this, research experience is curtail.\tSTEM (Science, Technology, Engineering, Mathematics)\tDry Lab (Computational, Physics, Applied Mathematics)\tNo\t\t\tSTEM\tMSU NSO\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Adi\tSutaria\tsutariaa@msu.edu\tNo\tNo\t\tNo\t\tYes\t\tNo\tAutomotive, robotics, or some mix of the two.\tI want to participate in undergraduate research because I can gain knowledge in what I am interested in and work with professors who are talented in the engineering field.\tSTEM (Science, Technology, Engineering, Mathematics)\tDry Lab (Computational, Physics, Applied Mathematics)\tNo\t\t\tSTEM\tD2L course\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Fernando\tChiba\tchibafer@msu.edu\tNo\tNo\t\tNo\t\tYes\tHonors College Seminar\tNo\tMachine Learning, Robotics, Neural limbs and prosthetics, data analysis\tI believe the participation in undergraduate research can expand my views on what I will work after graduation, as well as helping the scientific community by applying my knowledge.\tSTEM (Science, Technology, Engineering, Mathematics),Interdisciplinary\tWet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)\tNo\t\t\tSTEM,Arts and Humanities\tEmail from MSU\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Mazen\tAssanein\tassaneinm@gmail.com, assanein@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tYes\tRobotics, BioMed, Mechanics\tWorking in a research during high school sparked an interest in research and higher education. As someone who plans on pursuing a PhD I want to be very comfortable with research. I also want to participate in helping advance the world through research.\tSTEM (Science, Technology, Engineering, Mathematics)\tNot Sure\tNo\t\t\tSTEM\tOnline research\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Tanvi\tGadiraju\tgadiraj4@msu.edu\tNo\tNo\t\tNo\t\tYes\tHonors College Seminar\tNo\t-AI/Machine Learning. -Anything relating to Computational Data Science.\t-I would like to participate in undergraduate research because I would like to explore my passions in an applicable way.\tSTEM (Science, Technology, Engineering, Mathematics)\tDry Lab (Computational, Physics, Applied Mathematics),Not Sure\tNo\t\t\tSTEM\tPaper on tables in the stem building.\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Brody\tTozer\tTozerbro@msu.edu\tNo\tNo\t\tNo\t\tYes\t\tNo\tArtificial intelligence, materials, batteries, aerodynamics\tI want to participate in undergraduate research to get hands on experience in research and to make a potential difference in the world.\tSTEM (Science, Technology, Engineering, Mathematics)\tWet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics),Digital/Virtual (Humanities, Digital Humanities, Social Sciences)\tYes\tArun Ross, Kristen Johnson\tNo\tSTEM\tThrough emails\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Nolan\tHall\thallnola@msu.edu\tNo\tNo\t\tNo\t\tYes\tHonors College Seminar\tNo\tElectrical Engineering, Semiconductors, Renewable Energy, PCB design and Fabrication, Additive Manufacturing\tSince I have known I wanted to pursue a career in engineering, I have wanted to go into research and development in my field. There is something about being on the cutting edge of any industry that is so much more appealing than being in production. Finding creative, new solutions is much more rewarding than applying things that are already known. I have decided to pursue a PhD, at the recommendation of my professors, after I finish my undergrad degree. I believe that being in undergraduate research would satisfy my love for R&D and help bolster my graduate application.\tSTEM (Science, Technology, Engineering, Mathematics)\tWet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)\tNo\t\t\tSTEM\tThrough a friend (Ava Curtin)\tYes\tI have an RCPD Visa\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Faiez\tMahmood\tmahmoo73@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tNo\tMechanical engineering, especially design, energy systems, and how machines work. I am interested in improving how systems run, making them more efficient, and solving real world engineering problems.\tI want to do undergraduate research to get hands on experience and apply what I learn in class to real situations. My engineering classes have helped me build strong problem solving skills, and I want to keep improving them by working on real projects. Research will also help me understand how engineers design and improve systems in the real world.\tSTEM (Science, Technology, Engineering, Mathematics)\tDry Lab (Computational, Physics, Applied Mathematics),Digital/Virtual (Humanities, Digital Humanities, Social Sciences)\tNo\t\t\tSTEM,Arts and Humanities\tA friend recommended me to do it.\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Shashank Reddy\tGadila\tgadilash@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tNo\tMechanical Engineering and Aerospace Engineering oriented - Thermal & Fluid Dynamics, Aerodynamics, Composite Materials, Propulsion, Control Groups\tI am eager to learning about UR research with some previous experience from high school. I want to take a step forward and gather some research experience here at MSU, and maybe pursue a more research-oriented career if it interests me more.\tSTEM (Science, Technology, Engineering, Mathematics)\tWet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)\tYes\tDr. Manoochehr Koochesfahani & Research Team\tNo\tSTEM\tInstagram & In-Person Session\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
luke\tbrydges\tbrydgesl@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tNo\tAny research in the material science field involving alloy-based testing or future innovations in aeronautical applications\tUndergrade research is the best way to get the foot in the doors to future carrier paths and real work experience besides an internship and it also helps build your resume.\tSTEM (Science, Technology, Engineering, Mathematics)\tWet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics),Not Sure\tYes\tCarl Boehlert\tYes\tSTEM\temail\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Amir\tChowdhury\tchowd168@msu.edu\tNo\tNo\t\tNo\t\tYes\t\tNo\tEngineering Mechanics, Energy Conservation, Fluid Mechanics, Propulsion\tAs a Mech E, I have heard a lot about industry and less about research. I am curious to see what research in engineering has to offer.\tSTEM (Science, Technology, Engineering, Mathematics)\tWet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)\tNo\t\t\tGeneral (No preference)\tEngineering Career Office\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Sahana\tShivakumar\tshivaku7@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tYes\tMechanical Engineering, Aircraft & Aerospace\tI want to pursue research in aeronautical and aerospace systems because I am deeply interested in understanding how complex engineering principles translate into real-world flight. Aircraft and spacecraft operate under extreme conditions where precision, efficiency, and safety are critical, and I am motivated by the challenge of contributing to systems where even small improvements can have a significant impact. Research in this field gives me the opportunity to go beyond applying existing knowledge and instead help develop new technologies, whether that involves improving material performance, optimizing aerodynamic designs, or enhancing propulsion systems. I am especially drawn to problems that require both strong theoretical understanding and practical innovation. In addition, aerospace research plays an important role in advancing global connectivity, exploration, and sustainability, and being part of that progress is meaningful to me. Ultimately, I want to contribute to pushing the boundaries of what is possible, and I see research in aeronautical and aerospace engineering as the best way to do that.\tSTEM (Science, Technology, Engineering, Mathematics)\tDry Lab (Computational, Physics, Applied Mathematics),Digital/Virtual (Humanities, Digital Humanities, Social Sciences)\tNo\t\t\tSTEM\tEmail.\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Pranjal\tPrithvi\tprithvip@msu.edu\tNo\tNo\t\tNo\t\tYes\tHonors College Seminar\tYes\tAerospace systems engineering, experimental engineering, unmanned aerial systems (UAVs), propulsion concepts, and hands-on mechanical design, integration, and testing.\tI want to get some real-world experience working on engineering systems and learn how different parts work together to make a full, working design. I am especially interested in systems-level thinking because it lets me help build, test, and improve real-world aerospace systems. As a rising sophomore, I want to learn through hands-on experience and build a strong base for my future work in aerospace engineering.\tSTEM (Science, Technology, Engineering, Mathematics)\tDry Lab (Computational, Physics, Applied Mathematics)\tNo\t\t\tSTEM\tThrough my advisor\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Rory\tWendt\twendtro3@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tYes\tEngineering research in automotive or manufacturing, but I’m open to anything\tI want to gain experience and develop a better understanding of the fields I want to enter\tSTEM (Science, Technology, Engineering, Mathematics)\tDry Lab (Computational, Physics, Applied Mathematics),Not Sure\tNo\t\t\tSTEM\tI saw a QR code in the STEM building\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Elias\tBourgeois\tbourge25@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tNo\tI am interested it anything related to machine learning are Ai\tTo have to experience and recourses to study deeper into my personal interests.\tSTEM (Science, Technology, Engineering, Mathematics)\tNot Sure\tNo\t\t\tSTEM\tmsu website\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Janetzi\tSanchez Marquez\tsanch712@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tNo\tEngineering\tI am unable to obtain a job due to my visa status and I would like to know more about different opportunities.\tSTEM (Science, Technology, Engineering, Mathematics)\tDry Lab (Computational, Physics, Applied Mathematics)\tNo\t\t\tSTEM\tGlobal Spartans\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Raed\tOsama\tosamasye@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tNo\tI am interested in applied engineering research. My main interests are sustainable manufacturing, mobility and EV systems, supply chain, operations analytics, product development, and technology management. I want to learn how engineering systems are designed and improved. I am also interested in how these systems can be used in real industries.\tI want to participate in undergraduate research because I am still exploring my academic and career direction in Applied Engineering Sciences. I want to learn how research works and how engineering problems are studied in more detail. I am also interested in seeing how technical knowledge can be used to solve real-world problems. Through research, I hope to explore areas like manufacturing, mobility, supply chain, sustainability, and technology management. I also want to build stronger analytical skills and gain experience working with faculty and research teams. This experience will help me prepare for graduate school and future industry roles.\tSTEM (Science, Technology, Engineering, Mathematics),Interdisciplinary\tDry Lab (Computational, Physics, Applied Mathematics)\tNo\t\t\tGeneral (No preference)\tI was recommended by a fellow research assistant\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Hitesh\tTirumalasetti\tHitesh.tsetti@gmail.com, tirumal6@msu.edu\tNo\tNo\t\tNo\t\tYes\tHonors College Seminar\tNo\tMachine Learning, Artificial Learning, Computer Science, Finance\tI want to learn more about Research and get to know how to implement first principles.\tSTEM (Science, Technology, Engineering, Mathematics)\tDry Lab (Computational, Physics, Applied Mathematics)\tNo\t\t\tSTEM\tSTEM Building\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Rahul\tP\tPataska1@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tNo\tManufacturing, AI\tI actually graduated last week\tSTEM (Science, Technology, Engineering, Mathematics)\tNot Sure\tNo\t\t\tSTEM\tStem building ad\tNo\t\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t
Delger\tByambasukh\tbyambasu@msu.edu\tNo\tNo\t\tNo\t\tNo\t\tNo\tArtificial Intelligence\tBecause I want to strengthen my understanding of AI, and help improve daily life.\tSTEM (Science, Technology, Engineering, Mathematics)\tDry Lab (Computational, Physics, Applied Mathematics)\tNo\t\t\tSTEM\tFriends\tYes\tI am currently in Mongolia, not in the USA. I won’t come back to the USA until late August.\tI acknowledge the above statement.\tI acknowledge the above statement.\tcomplete\t`;

function normalizeValue(value: string): string {
  return value.replaceAll("\r", "").trim();
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pickPrimaryEmail(raw: string): { primary: string; alternates: string[] } {
  const emails = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!emails.length) {
    return { primary: "", alternates: [] };
  }

  const msuEmail = emails.find((email) => /@msu\.edu$/i.test(email));
  const primary = msuEmail ?? emails[0];
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

function buildRosterStudents(): Student[] {
  const lines = ROSTER_TSV
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);

  const header = lines[0].split("\t").map(normalizeValue);
  const rows = lines.slice(1);

  return rows.map((row, index) => {
    const cols = row.split("\t");
    const record = Object.fromEntries(header.map((key, i) => [key, normalizeValue(cols[i] ?? "")]));

    const firstName = record["First Name"];
    const lastName = record["Last Name"];
    const { primary, alternates } = pickPrimaryEmail(record["MSU Email Address"]);

    return {
      id: `${toSlug(firstName)}-${toSlug(lastName)}-${index + 1}`,
      name: `${firstName} ${lastName}`.trim(),
      email: primary,
      alternateEmails: alternates,
      major: "",
      year: "",
      interest: record["Please list your research interest(s)."],
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
        firstGeneration: record["Do you identify as a first-generation student?"],
        transferStudent: record["Are you a transfer student?"],
        transferDetails: record["What school did you transfer from and when?"],
        previousResearchExperience: record[
          "Have you had a previous undergraduate research experience?"
        ],
        previousResearchDescription: record[
          "Please describe your previous undergraduate research experience."
        ],
        honorsCollege: record["Are you in the Honors College?"],
        additionalExperiences: record["Have you had any of the following experiences?"],
        workStudy: record[
          "Do you have work-study (listed as FED College Work Study on your financial aid notice)?"
        ],
        researchInterests: record["Please list your research interest(s)."],
        whyResearch: record[
          "Briefly describe why you want to participate in undergraduate research."
        ],
        fieldOfInterest: record[
          "What best describes your field of interest? (Select all that apply)"
        ],
        researchEnvironment: record[
          "What kind of research environment(s) interest you? (Select all that apply)"
        ],
        hasPotentialMentor: record["Do you have potential research mentor(s) in mind?"],
        mentorNames: record["Please list the mentor(s) you have in mind."],
        mentorContacted: record["Have you already been in contact with the mentor(s)?"],
        cohortPreference: record[
          "The program will consist of several cohorts. Please select the option(s) that interest you."
        ],
        referralSource: record["How did you hear about Pathway to Research?"],
        accessibilityNeeds: record[
          "Do you have any accessibility needs/concerns? - Selected Choice"
        ],
        accessibilityNotes: record[
          "Do you have any accessibility needs/concerns? - Yes - Text"
        ],
        acknowledgementPathway: record[
          "I acknowledge that the Pathway to Research program teaches me how to find and pursue an undergraduate research position and does not provide a list of openings or do the research placement for me."
        ],
        acknowledgementEligibility: record[
          "I acknowledge that the Pathway to Research program is for undergraduate students who have not had a previous research experience at MSU."
        ]
      },
      assignments: {},
      attendance: [],
      advisingSessions: []
    } satisfies Student;
  });
}

export function createSeedState(): AppState {
  const students = recalculateAllStudents(buildRosterStudents(), []);
  return {
    students,
    assignments: [],
    attendanceSessions: [],
    updatedAt: new Date().toISOString()
  };
}
