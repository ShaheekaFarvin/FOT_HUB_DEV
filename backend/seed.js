/**
 * FOT Student Hub — Seed Script
 * Populates the database with realistic sample data for:
 *   • Admin + Student users
 *   • Announcements (with duplicates / varied categories)
 *   • Lost & Found items
 *   • Elections (upcoming, ongoing, completed)
 *   • Complaints
 *
 * Usage:
 *   node seed.js          — insert seed data (skips if data already exists)
 *   node seed.js --fresh  — wipe collections first, then seed
 */

require('dotenv').config();
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');

const User         = require('./models/User');
const Announcement = require('./models/Announcement');
const LostFound    = require('./models/LostFound');
const Election     = require('./models/Election');
const Complaint    = require('./models/Complaint');

/* ─── helpers ─────────────────────────────────────────── */
const hash  = (pw) => bcrypt.hashSync(pw, 10);
const days  = (n)  => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

/* ─── connect ─────────────────────────────────────────── */
async function connectDB () {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  MongoDB connected');
}

/* ════════════════════════════════════════════════════════
   SEED DATA
════════════════════════════════════════════════════════ */

/* ── Users ─────────────────────────────────────────────── */
const ADMIN_EMAIL = 'admin@tec.rjt.ac.lk';
const seedUsers = [
  { name: 'Admin User',        email: ADMIN_EMAIL,               password: hash('admin123'),   studentId: 'ADMIN001',   department: 'ICT', year: 'N/A',  role: 'admin'   },
  { name: 'Kavindu Perera',    email: 'kavindu@tec.rjt.ac.lk',  password: hash('student123'), studentId: 'ICT22001',   department: 'ICT', year: 'Year 2', role: 'student' },
  { name: 'Dilini Jayawardena',email: 'dilini@tec.rjt.ac.lk',   password: hash('student123'), studentId: 'EET21003',   department: 'EET', year: 'Year 3', role: 'student' },
  { name: 'Sahan Wickramasinghe',email:'sahan@tec.rjt.ac.lk',   password: hash('student123'), studentId: 'BPT23007',   department: 'BPT', year: 'Year 1', role: 'student' },
  { name: 'Nethmi Rathnayake', email: 'nethmi@tec.rjt.ac.lk',   password: hash('student123'), studentId: 'FDT22015',   department: 'FDT', year: 'Year 2', role: 'student' },
  { name: 'Ravindu Fernando',  email: 'ravindu@tec.rjt.ac.lk',  password: hash('student123'), studentId: 'MTT21009',   department: 'MTT', year: 'Year 3', role: 'student' },
];

/* ── Announcements ─────────────────────────────────────── */
const mkAnnouncements = (adminId) => [
  /* ── General ── */
  {
    title: 'Welcome to FOT Student Hub — New Portal Launch',
    content: 'We are pleased to announce the official launch of the redesigned FOT Student Hub portal. This platform centralises announcements, lost & found, elections, and student complaints in one place. All students are encouraged to register and explore the features.',
    category: 'General', priority: 'high', createdBy: adminId, isActive: true,
  },
  {
    title: 'Campus Wi-Fi Upgrade Scheduled for This Weekend',
    content: 'The IT department will be upgrading the campus-wide Wi-Fi infrastructure on Saturday 31 May 2025 between 10:00 PM and 6:00 AM. Internet access in all buildings will be disrupted during this window. Please plan accordingly.',
    category: 'General', priority: 'medium', createdBy: adminId, isActive: true,
  },
  /* Duplicate-style General notice (same topic, re-issued) */
  {
    title: 'Reminder: Campus Wi-Fi Maintenance (Updated Time)',
    content: 'Please note the previously announced Wi-Fi maintenance has been rescheduled to Sunday 1 June 2025, 11:00 PM – 5:00 AM due to contractor availability. Apologies for any inconvenience.',
    category: 'General', priority: 'medium', createdBy: adminId, isActive: true,
  },
  /* ── Academic ── */
  {
    title: 'End-of-Semester Examination Timetable — Semester 2 2024/2025',
    content: 'The official examination timetable for Semester 2, academic year 2024/2025 has been published. Students can view their individual timetables via the Academic Portal. All examinations will be held in the Main Examination Hall. Please bring your student ID and stationery.',
    category: 'Academic', priority: 'high', createdBy: adminId, isActive: true,
  },
  {
    title: 'Assignment Submission Deadline Extended — ICT3202',
    content: 'Due to the network downtime experienced last week, the submission deadline for ICT3202 (Software Engineering) Assignment 2 has been extended by 5 days. The new deadline is 10 June 2025, 11:59 PM. Please submit via the LMS portal.',
    category: 'Academic', priority: 'medium', createdBy: adminId, isActive: true,
  },
  /* Duplicate-style Academic (second reminder) */
  {
    title: 'Second Reminder: ICT3202 Assignment 2 Deadline — 10 June',
    content: 'This is a final reminder that the ICT3202 Assignment 2 is due on 10 June 2025 at 11:59 PM. Late submissions will incur a 10% penalty per day. Contact your module coordinator for any academic concerns.',
    category: 'Academic', priority: 'medium', createdBy: adminId, isActive: true,
  },
  /* ── Event ── */
  {
    title: 'Tech Symposium 2025 — Call for Abstracts',
    content: 'The Annual FOT Tech Symposium will be held on 18–19 July 2025. Final-year students and postgraduates are invited to submit research abstracts by 15 June 2025. Selected papers will be published in the conference proceedings. Submit via the symposium portal.',
    category: 'Event', priority: 'medium', createdBy: adminId, isActive: true,
  },
  {
    title: 'Industrial Visit — Virtusa Colombo (ICT & EET Students)',
    content: 'An industrial visit to Virtusa (Pvt) Ltd, Colombo has been arranged for Year 2 ICT and EET students on 5 June 2025. Departure from FOT main gate at 7:00 AM. Registration closes 30 May 2025. A nominal transport fee of LKR 500 applies.',
    category: 'Event', priority: 'low', createdBy: adminId, isActive: true,
  },
  /* ── Election ── */
  {
    title: 'Student Union Elections 2025 — Nominations Open',
    content: 'Nominations for the FOT Student Union Elections 2025 are now open. Eligible students may submit nomination forms to the Examination Branch before 5 June 2025. All second and third-year students in good academic standing are eligible to contest.',
    category: 'Election', priority: 'high', createdBy: adminId, isActive: true,
  },
  /* Duplicate Election announcement (confirmation notice) */
  {
    title: 'Student Union Elections — Confirmed Candidates List',
    content: 'The final list of confirmed candidates for the FOT Student Union Elections 2025 has been published on the Faculty Notice Board and on this portal. Voting will take place from 20 June to 22 June 2025 exclusively through this digital platform.',
    category: 'Election', priority: 'high', createdBy: adminId, isActive: true,
  },
  /* ── Emergency ── */
  {
    title: 'Emergency: Water Supply Disruption — Main Building',
    content: 'Due to a burst pipe in the main water line, water supply to the Main Building (Blocks A, B and C) will be suspended from 8:00 AM today until further notice. Temporary water stations have been set up at the Library Entrance and the ICT Lab parking area. We apologise for the inconvenience.',
    category: 'Emergency', priority: 'high', createdBy: adminId, isActive: true,
  },
];

/* ── Lost & Found Items ────────────────────────────────── */
const mkLostFound = (students) => [
  /* ── Lost ── */
  {
    title: 'Lost — Blue Scientific Calculator (Casio fx-991EX)',
    description: 'I lost my Casio fx-991EX ClassWiz scientific calculator, dark blue colour, during the ICT Lab session on Monday afternoon. My name "K. Perera" is written on the back with a black marker. Please contact me if found.',
    type: 'lost', category: 'Electronics', location: 'ICT Lab 02, Block C',
    date: days(-2), contactInfo: '0712345678', status: 'active',
    submittedBy: students[0]._id,
  },
  {
    title: 'Lost — Black Leather Wallet',
    description: 'Lost my black bifold leather wallet somewhere between the Canteen and the Library on Thursday. It contains my National ID, student card, and some cash. Reward offered for safe return.',
    type: 'lost', category: 'Other', location: 'Between Canteen & Library',
    date: days(-4), contactInfo: '0723456789', status: 'active',
    submittedBy: students[1]._id,
  },
  /* Duplicate Lost — same student re-posts after no response */
  {
    title: 'URGENT — Still Missing: Black Wallet (Re-post)',
    description: 'Re-posting as I have not yet found my black leather wallet lost on Thursday near the canteen. If anyone has seen it or handed it in anywhere, please contact me immediately. Student card and IDs are inside.',
    type: 'lost', category: 'Other', location: 'Canteen / Library Area',
    date: days(-1), contactInfo: '0723456789', status: 'active',
    submittedBy: students[1]._id,
  },
  {
    title: 'Lost — ICT Department Lab Access Card',
    description: 'Lost my yellow ICT department lab access card (ID: ICT22001) on Wednesday. Without it I cannot access the labs. Please hand it in to the ICT department office or contact me directly.',
    type: 'lost', category: 'ID Card', location: 'Block C Corridor',
    date: days(-3), contactInfo: '0745678901', status: 'active',
    submittedBy: students[2]._id,
  },
  {
    title: 'Lost — Gray Backpack with Laptop Inside',
    description: 'Left my gray Laptop backpack (HP Pavilion 15" laptop inside + lecture notes folder) in Lecture Hall 03, Block A during the 2 PM session on Friday. Very urgent as the laptop has assignment submissions due. Please call immediately.',
    type: 'lost', category: 'Bag', location: 'Lecture Hall 03, Block A',
    date: days(-1), contactInfo: '0756789012', status: 'active',
    submittedBy: students[3]._id,
  },
  {
    title: 'Lost — Engineering Drawing Set',
    description: 'Lost a complete technical drawing set (compass, set squares, protractor in a black zip case) after the Engineering Drawing tutorial on Tuesday morning. It has a yellow sticker with "R. Fernando" on it.',
    type: 'lost', category: 'Other', location: 'Drawing Lab, Block B',
    date: days(-5), contactInfo: '0767890123', status: 'active',
    submittedBy: students[4]._id,
  },
  /* ── Found ── */
  {
    title: 'Found — Blue Water Bottle (Stainless Steel)',
    description: 'Found a blue stainless-steel water bottle (1-litre, no label) left on the bench outside the Library after the 4 PM session. Currently kept at the Library reception. Owner can collect on presentation of student ID.',
    type: 'found', category: 'Other', location: 'Library Entrance Bench',
    date: days(-1), contactInfo: 'Library Reception', status: 'active',
    submittedBy: students[0]._id,
  },
  {
    title: 'Found — Pair of Prescription Glasses',
    description: 'Found a pair of black-framed prescription glasses inside a gray soft case in the Canteen seating area after lunch. The glasses appear to be of high prescription strength. Contact me or the General Office.',
    type: 'found', category: 'Other', location: 'Canteen Seating Area',
    date: days(-2), contactInfo: '0712345678', status: 'active',
    submittedBy: students[1]._id,
  },
  /* Duplicate Found — someone else also reports the glasses */
  {
    title: 'Found — Black Glasses (Also Reported)',
    description: 'I also saw a pair of prescription glasses at the Canteen. Seems like the same pair already reported. Adding this post so the owner knows two people have spotted them — check with both reporters.',
    type: 'found', category: 'Other', location: 'Canteen',
    date: days(-2), contactInfo: '0723456789', status: 'active',
    submittedBy: students[2]._id,
  },
  {
    title: 'Found — USB Flash Drive (32GB, Kingston)',
    description: 'Found a 32GB Kingston DataTraveler USB drive near the printer station in the ICT Lab. It contains what appear to be assignment files. If yours, describe the folder names and collect from ICT Lab Coordinator.',
    type: 'found', category: 'Electronics', location: 'ICT Lab 01, Printer Station',
    date: days(-3), contactInfo: 'ICT Lab Coordinator', status: 'active',
    submittedBy: students[3]._id,
  },
  {
    title: 'Found — Student ID Card (Dilini J., EET Dept)',
    description: 'Found a student ID card belonging to a student in the EET department near the main gate security desk. Submitted to the Examination Branch for safekeeping. Owner can collect by presenting another form of ID.',
    type: 'found', category: 'ID Card', location: 'Main Gate / Examination Branch',
    date: days(-1), contactInfo: 'Examination Branch', status: 'claimed',
    submittedBy: students[4]._id,
  },
  {
    title: 'Found — Bunch of Keys (3 keys + FOT keyring)',
    description: 'Found a set of 3 keys on an FOT-branded keyring in the Block B stairwell. No name tag. Handed in to the block supervisor. Contact Block B ground-floor office to claim.',
    type: 'found', category: 'Keys', location: 'Block B Stairwell',
    date: days(-4), contactInfo: 'Block B Supervisor Office', status: 'active',
    submittedBy: students[0]._id,
  },
];

/* ── Elections ─────────────────────────────────────────── */
const mkElections = (adminId) => {
  const now = new Date();
  return [
    /* 1 — Ongoing University Level */
    {
      title: 'FOT Student Union General Election 2025',
      type: 'University Level', department: 'All',
      startDate: days(-1), endDate: days(2),
      status: 'ongoing', createdBy: adminId,
      candidates: [
        { name: 'Kavindu Perera',     position: 'President',          manifesto: 'Modernise student services, push for better lab facilities and 24/7 Wi-Fi campus-wide.', votes: 47 },
        { name: 'Dilini Jayawardena', position: 'President',          manifesto: 'Advocate for gender-inclusive policies and strengthen ties with industry partners.', votes: 39 },
        { name: 'Sahan Wickramasinghe',position: 'Secretary',         manifesto: 'Transparent administration and timely communication of all student-related decisions.', votes: 62 },
        { name: 'Nethmi Rathnayake',  position: 'Secretary',          manifesto: 'Digital-first approach — move all union paperwork to the Student Hub portal.', votes: 55 },
        { name: 'Ravindu Fernando',   position: 'Treasurer',          manifesto: 'Responsible budgeting and annual public financial disclosures for all union funds.', votes: 70 },
        { name: 'Amali Dissanayake',  position: 'Treasurer',          manifesto: 'Allocate more funds toward student welfare and mental health support.', votes: 44 },
      ],
      votes: [],
    },
    /* 2 — Upcoming Department Level */
    {
      title: 'ICT Department Representative Election 2025',
      type: 'Department Level', department: 'ICT',
      startDate: days(5), endDate: days(8),
      status: 'upcoming', createdBy: adminId,
      candidates: [
        { name: 'Lasith Bandara',     position: 'Department Rep',     manifesto: 'Voice ICT student concerns at faculty board meetings and push for updated computing resources.', votes: 0 },
        { name: 'Hiruni Silva',       position: 'Department Rep',     manifesto: 'Organise monthly ICT workshops and hackathons to build practical skills beyond the curriculum.', votes: 0 },
        { name: 'Pasan Madushanka',   position: 'Department Rep',     manifesto: 'Establish a peer-mentoring programme where seniors guide juniors through course content.', votes: 0 },
      ],
      votes: [],
    },
    /* 3 — Duplicate upcoming (another dept — shows variety) */
    {
      title: 'EET Department Representative Election 2025',
      type: 'Department Level', department: 'EET',
      startDate: days(7), endDate: days(10),
      status: 'upcoming', createdBy: adminId,
      candidates: [
        { name: 'Tharaka Wijesinghe', position: 'Department Rep',     manifesto: 'Negotiate better lab equipment upgrades with the faculty.', votes: 0 },
        { name: 'Nadeesha Kumari',    position: 'Department Rep',     manifesto: 'Promote women in engineering and run awareness campaigns.', votes: 0 },
      ],
      votes: [],
    },
    /* 4 — Completed */
    {
      title: 'Sports & Recreation Committee Election 2024',
      type: 'University Level', department: 'All',
      startDate: days(-60), endDate: days(-50),
      status: 'completed', createdBy: adminId,
      candidates: [
        { name: 'Chamara Weerasinghe',position: 'Sports Captain',     manifesto: 'Revive inter-faculty sports competitions and build a proper sports complex.', votes: 112 },
        { name: 'Janani Perera',      position: 'Sports Captain',     manifesto: 'Inclusive sports events for all students regardless of ability.', votes: 98 },
        { name: 'Dilan Rajapaksa',    position: 'Cultural Secretary', manifesto: 'Annual arts festival and inter-university cultural exchange programme.', votes: 130 },
        { name: 'Imesha Fernando',    position: 'Cultural Secretary', manifesto: 'Promote traditional Sri Lankan arts alongside modern performing arts.', votes: 87 },
      ],
      votes: [],
    },
    /* 5 — Duplicate completed (older election) */
    {
      title: 'Student Welfare Committee Election 2023',
      type: 'University Level', department: 'All',
      startDate: days(-365), endDate: days(-355),
      status: 'completed', createdBy: adminId,
      candidates: [
        { name: 'Sumudu Bandara',     position: 'Welfare Head',       manifesto: 'Subsidised canteen meals and affordable stationery shop.', votes: 200 },
        { name: 'Priyanka Senanayake',position: 'Welfare Head',       manifesto: 'Mental health first-aid training for all batch representatives.', votes: 175 },
      ],
      votes: [],
    },
  ];
};

/* ── Complaints ────────────────────────────────────────── */
const mkComplaints = (students) => [
  /* ── Academic ── */
  {
    title: 'Lecture slides not uploaded to LMS on time',
    description: 'For the past three weeks, the lecture materials for ICT3301 (Database Systems) have not been uploaded to the LMS before the lectures as per faculty policy. This makes it difficult to follow along and prepare adequately. Kindly request the module coordinator to comply with the upload policy.',
    category: 'Academic', priority: 'medium', status: 'pending',
    submittedBy: students[0]._id, isAnonymous: false, replies: [],
  },
  /* Duplicate Academic complaint (same issue, different student) */
  {
    title: 'ICT3301 LMS Materials Still Not Available',
    description: 'I am also affected by the missing LMS uploads for ICT3301. Multiple students have verbally raised this with the lecturer but no action has been taken. This is an academic integrity issue and we request formal administrative intervention.',
    category: 'Academic', priority: 'high', status: 'in-progress',
    submittedBy: students[1]._id, isAnonymous: false,
    replies: [
      { message: 'We have contacted the module coordinator. Upload schedule will be enforced from next week. Thank you for bringing this to our attention.', repliedAt: days(-1) }
    ],
  },
  {
    title: 'Unfair marking for EET2205 Mid-Semester Paper',
    description: 'I believe the marking scheme applied for EET2205 mid-semester examination was inconsistent. Identical answers received different marks across students. Requesting a formal re-evaluation of the paper and transparent marking rubric publication.',
    category: 'Academic', priority: 'high', status: 'pending',
    submittedBy: students[2]._id, isAnonymous: false, replies: [],
  },
  /* ── Facility ── */
  {
    title: 'Air conditioning in ICT Lab 02 non-functional for 2 weeks',
    description: 'The air conditioning unit in ICT Lab 02, Block C has been broken for over two weeks. The lab reaches unbearable temperatures by 10 AM, making it extremely uncomfortable for students attending practical sessions. This also risks overheating the computers. Urgent repair is needed.',
    category: 'Facility', priority: 'high', status: 'in-progress',
    submittedBy: students[3]._id, isAnonymous: false,
    replies: [
      { message: 'A service request has been submitted to the Maintenance Division. Repair is scheduled for this Thursday.', repliedAt: days(-3) }
    ],
  },
  /* Duplicate Facility complaint */
  {
    title: 'ICT Lab 02 AC Still Not Fixed — Follow-up',
    description: 'Following up on the earlier complaint about ICT Lab 02 air conditioning. Thursday has passed and the unit is still not repaired. Students are forced to conduct practicals in 34°C heat. Please escalate to the Dean\'s office.',
    category: 'Facility', priority: 'high', status: 'in-progress',
    submittedBy: students[0]._id, isAnonymous: false,
    replies: [
      { message: 'We sincerely apologise for the delay. The contractor has been rescheduled for Monday. A temporary standing fan has been arranged in the meantime.', repliedAt: days(-1) }
    ],
  },
  {
    title: 'Broken toilet facilities in Block B — 1st Floor',
    description: 'The male toilet on the 1st floor of Block B has had 2 out of 3 cubicles non-functional for over a month. This causes long queues and hygiene concerns. Please arrange urgent repairs.',
    category: 'Facility', priority: 'medium', status: 'resolved',
    submittedBy: students[1]._id, isAnonymous: true,
    replies: [
      { message: 'Repairs have been completed by the Maintenance Division as of 20 May 2025. Please report if issues persist.', repliedAt: days(-5) }
    ],
  },
  /* ── Staff ── */
  {
    title: 'Lecturer consistently arrives 20-30 minutes late',
    description: 'The lecturer for BPT2102 (Production Technology) has been arriving 20 to 30 minutes late to every lecture for the past month without informing students in advance. This disrupts our schedule and wastes valuable contact hours. Submitting anonymously to avoid academic repercussions.',
    category: 'Staff', priority: 'medium', status: 'pending',
    submittedBy: students[2]._id, isAnonymous: true, replies: [],
  },
  /* ── Administration ── */
  {
    title: 'Student ID card delay — applied 6 weeks ago, still not received',
    description: 'I submitted my student ID card application form 6 weeks ago and have followed up three times at the Examination Branch. I have been told it is "in process" each time. Without a student ID I cannot access the library or certain labs. Please expedite.',
    category: 'Administration', priority: 'high', status: 'resolved',
    submittedBy: students[4]._id, isAnonymous: false,
    replies: [
      { message: 'Your ID card is ready for collection at the Examination Branch. Please bring your payment receipt and a copy of your registration form.', repliedAt: days(-2) }
    ],
  },
  /* Duplicate Administration */
  {
    title: 'Examination Branch not responding to email enquiries',
    description: 'I have sent four emails to the Examination Branch over the past three weeks regarding my transcript request with zero response. This is needed for a scholarship application deadline. Requesting immediate attention.',
    category: 'Administration', priority: 'high', status: 'pending',
    submittedBy: students[3]._id, isAnonymous: false, replies: [],
  },
  /* ── Other ── */
  {
    title: 'Noise levels in the Library reading area are too high',
    description: 'The designated quiet reading area on Library Floor 2 is frequently disrupted by students holding loud group discussions and phone calls. Library staff seem unable to enforce silence rules. Requesting stricter enforcement or designated group study zones.',
    category: 'Other', priority: 'low', status: 'pending',
    submittedBy: students[0]._id, isAnonymous: false, isPublic: true, replies: [],
  },

  /* ── Extra items to exercise the "My Complaints / All Complaints" tabs
     and the anonymous-identity masking (super_admin sees real name,
     everyone else sees "Anonymous") ── */

  /* Anonymous + Public — Dilini (students[1]) reports a staff issue.
     In "All Complaints" every other student should see "Anonymous";
     only super_admin should see "Dilini Jayawardena". */
  {
    title: 'Canteen staff member rude to students during rush hour',
    description: 'On multiple occasions this week, a staff member at the main canteen counter has been dismissive and rude when students ask about menu items or make small requests. Several of us have noticed this and would like it addressed quietly.',
    category: 'Staff', priority: 'medium', status: 'pending',
    submittedBy: students[1]._id, isAnonymous: true, isPublic: true, replies: [],
  },

  /* Same student, same category — duplicate-style follow-up, still anonymous */
  {
    title: 'Follow-up: Canteen Staff Behaviour Complaint',
    description: 'Following up on my earlier anonymous complaint about canteen staff behaviour. The issue happened again yesterday. Requesting an update on whether this has been looked into.',
    category: 'Staff', priority: 'medium', status: 'pending',
    submittedBy: students[1]._id, isAnonymous: true, isPublic: true, replies: [],
  },

  /* Anonymous but Admin Only — should NEVER appear to other students,
     only in super_admin's admin panel (with real name) and the
     submitter's own "My Complaints" tab. */
  {
    title: 'Concern about grading bias in EET2205',
    description: 'I want to raise a sensitive concern about a possible grading bias in EET2205 without my classmates knowing it was me who reported it, since I still have to sit further exams with the same lecturer.',
    category: 'Academic', priority: 'high', status: 'pending',
    submittedBy: students[2]._id, isAnonymous: true, isPublic: false, replies: [],
  },

  /* Same title/category repeated by a different student — pure
     "duplicate complaint" scenario, both public and non-anonymous,
     so both names should be visible to everyone in All Complaints. */
  {
    title: 'Wi-Fi extremely slow in Block A during peak hours',
    description: 'Between 9 AM and 11 AM every weekday, the Wi-Fi in Block A becomes almost unusable — pages time out and the LMS won\'t load. This has been ongoing for two weeks. Please investigate the access points on this floor.',
    category: 'Facility', priority: 'medium', status: 'pending',
    submittedBy: students[3]._id, isAnonymous: false, isPublic: true, replies: [],
  },
  {
    title: 'Wi-Fi extremely slow in Block A during peak hours',
    description: 'Can confirm the same Wi-Fi slowdown in Block A every morning this week. Multiple students in my batch are affected during lectures that rely on online quizzes. Please prioritise this.',
    category: 'Facility', priority: 'medium', status: 'pending',
    submittedBy: students[4]._id, isAnonymous: false, isPublic: true, replies: [],
  },

  /* Non-anonymous, public — a second complaint from students[0] so their
     "My Complaints" tab has more than one entry to scroll through. */
  {
    title: 'Request for more charging points in the Library',
    description: 'The Library only has charging points near the entrance, leading to overcrowding in that corner while the rest of the reading area has none. Could a few more sockets be installed along the reading tables?',
    category: 'Facility', priority: 'low', status: 'pending',
    submittedBy: students[0]._id, isAnonymous: false, isPublic: true, replies: [],
  },
];

/* ════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════ */
async function seed () {
  const fresh = process.argv.includes('--fresh');

  await connectDB();

  if (fresh) {
    console.log('🗑️  Dropping existing data...');
    await Promise.all([
      User.deleteMany({}),
      Announcement.deleteMany({}),
      LostFound.deleteMany({}),
      Election.deleteMany({}),
      Complaint.deleteMany({}),
    ]);
    console.log('✅  Collections cleared');
  }

  /* ── Users ── */
  let admin, students;
  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
  if (existingAdmin && !fresh) {
    console.log('ℹ️  Users already exist — skipping user seed (use --fresh to reset)');
    admin    = existingAdmin;
    students = await User.find({ role: 'student' }).limit(5);
  } else {
    const inserted = await User.insertMany(seedUsers);
    admin    = inserted.find(u => u.role === 'admin');
    students = inserted.filter(u => u.role === 'student');
    console.log(`✅  Inserted ${inserted.length} users`);
  }

  /* ── Announcements ── */
  const annCount = await Announcement.countDocuments();
  if (annCount === 0 || fresh) {
    const anns = await Announcement.insertMany(mkAnnouncements(admin._id));
    console.log(`✅  Inserted ${anns.length} announcements`);
  } else {
    console.log(`ℹ️  ${annCount} announcements already exist — skipping`);
  }

  /* ── Lost & Found ── */
  const lfCount = await LostFound.countDocuments();
  if (lfCount === 0 || fresh) {
    const lf = await LostFound.insertMany(mkLostFound(students));
    console.log(`✅  Inserted ${lf.length} lost & found items`);
  } else {
    console.log(`ℹ️  ${lfCount} lost & found items already exist — skipping`);
  }

  /* ── Elections ── */
  const elCount = await Election.countDocuments();
  if (elCount === 0 || fresh) {
    const els = await Election.insertMany(mkElections(admin._id));
    console.log(`✅  Inserted ${els.length} elections`);
  } else {
    console.log(`ℹ️  ${elCount} elections already exist — skipping`);
  }

  /* ── Complaints ── */
  const cpCount = await Complaint.countDocuments();
  if (cpCount === 0 || fresh) {
    const cps = await Complaint.insertMany(mkComplaints(students));
    console.log(`✅  Inserted ${cps.length} complaints`);
  } else {
    console.log(`ℹ️  ${cpCount} complaints already exist — skipping`);
  }

  console.log('\n🎉  Seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('  Admin login   : admin@tec.rjt.ac.lk');
  console.log('  Admin password: admin123');
  console.log('  Student login : kavindu@tec.rjt.ac.lk');
  console.log('  Student pass  : student123');
  console.log('─────────────────────────────────────────\n');

  process.exit(0);
}

seed().catch(err => { console.error('❌  Seed error:', err); process.exit(1); });
