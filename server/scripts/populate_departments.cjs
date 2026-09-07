const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "ems_database.json");
if (!fs.existsSync(dbPath)) {
  console.error("Database file not found at", dbPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

const avatars = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80"
];

const cities = [
  { city: "Bengaluru", state: "Karnataka", address: "Indiranagar 100ft Road" },
  { city: "Bengaluru", state: "Karnataka", address: "HSR Layout Sector 2" },
  { city: "Bengaluru", state: "Karnataka", address: "Koramangala 4th Block" },
  { city: "Bengaluru", state: "Karnataka", address: "Whitefield Main Road" },
  { city: "Gurugram", state: "Haryana", address: "Cyber City Phase 2" },
  { city: "Gurugram", state: "Haryana", address: "Golf Course Road Sector 54" },
  { city: "Mumbai", state: "Maharashtra", address: "Bandra Kurla Complex (BKC)" },
  { city: "Mumbai", state: "Maharashtra", address: "Powai Hiranandani Gardens" },
  { city: "Hyderabad", state: "Telangana", address: "HITEC City Madhapur" },
  { city: "Hyderabad", state: "Telangana", address: "Gachibowli Financial District" },
  { city: "Pune", state: "Maharashtra", address: "Baner High Street" },
  { city: "Noida", state: "Uttar Pradesh", address: "Sector 62 Tech Zone" }
];

const deptConfigs = [
  {
    deptId: "dept-1",
    deptName: "Human Resources",
    managerId: "emp-2",
    managerName: "Priya Patel",
    prefix: "hr",
    positions: [
      { title: "Senior HR Business Partner", role: "HR Admin", salary: 1800000 },
      { title: "Talent Acquisition Specialist", role: "HR Admin", salary: 1200000 },
      { title: "Compensation & Benefits Lead", role: "HR Admin", salary: 1500000 },
      { title: "Employee Relations Manager", role: "Manager", salary: 1700000 },
      { title: "People Operations Specialist", role: "Employee", salary: 950000 },
      { title: "Senior Technical Recruiter", role: "Employee", salary: 1100000 },
      { title: "Learning & Development Lead", role: "Employee", salary: 1400000 },
      { title: "HR Analytics & Metrics Specialist", role: "Employee", salary: 1300000 },
      { title: "Corporate Wellness Coordinator", role: "Employee", salary: 850000 },
      { title: "Talent Onboarding Partner", role: "Employee", salary: 900000 },
      { title: "Diversity & Inclusion Specialist", role: "Employee", salary: 1250000 },
      { title: "HR Compliance & Labor Officer", role: "HR Admin", salary: 1350000 },
      { title: "Payroll & Benefits Executive", role: "HR Admin", salary: 1050000 },
      { title: "Organizational Culture Lead", role: "Employee", salary: 1600000 },
      { title: "Talent Sourcing Specialist", role: "Employee", salary: 880000 },
      { title: "Performance Management Specialist", role: "Employee", salary: 1150000 },
      { title: "Campus Recruitment Lead", role: "Employee", salary: 1000000 },
      { title: "HR Operations Associate", role: "Employee", salary: 780000 },
      { title: "Internal Mobility Coordinator", role: "Employee", salary: 920000 },
      { title: "Junior HR Generalist", role: "Employee", salary: 720000 }
    ],
    names: [
      { firstName: "Rohan", lastName: "Verma", gender: "Male" },
      { firstName: "Sneha", lastName: "Kulkarni", gender: "Female" },
      { firstName: "Tanvi", lastName: "Deshmukh", gender: "Female" },
      { firstName: "Arjun", lastName: "Nambiar", gender: "Male" },
      { firstName: "Deepika", lastName: "Rao", gender: "Female" },
      { firstName: "Gaurav", lastName: "Kapoor", gender: "Male" },
      { firstName: "Isha", lastName: "Chawla", gender: "Female" },
      { firstName: "Karan", lastName: "Singhania", gender: "Male" },
      { firstName: "Lavanya", lastName: "Bhatt", gender: "Female" },
      { firstName: "Manish", lastName: "Tiwari", gender: "Male" },
      { firstName: "Nisha", lastName: "Reddy", gender: "Female" },
      { firstName: "Pranav", lastName: "Pillai", gender: "Male" },
      { firstName: "Rhea", lastName: "Fernandes", gender: "Female" },
      { firstName: "Siddharth", lastName: "Choudhury", gender: "Male" },
      { firstName: "Tara", lastName: "Menon", gender: "Female" },
      { firstName: "Varun", lastName: "Sengupta", gender: "Male" },
      { firstName: "Vidya", lastName: "Subramanian", gender: "Female" },
      { firstName: "Yash", lastName: "Malhotra", gender: "Male" },
      { firstName: "Zoya", lastName: "Mirza", gender: "Female" },
      { firstName: "Aniket", lastName: "Joshi", gender: "Male" }
    ]
  },
  {
    deptId: "dept-2",
    deptName: "Information Technology",
    managerId: "emp-4",
    managerName: "Rajesh Kumar",
    prefix: "it",
    positions: [
      { title: "Principal Cloud Architect", role: "Manager", salary: 3200000 },
      { title: "Senior Full-Stack Engineer", role: "Employee", salary: 2400000 },
      { title: "Staff Frontend Architect", role: "Employee", salary: 2600000 },
      { title: "Senior DevOps & CI/CD Lead", role: "Employee", salary: 2200000 },
      { title: "AI & Machine Learning Specialist", role: "Employee", salary: 2500000 },
      { title: "Cybersecurity & Infosec Lead", role: "Employee", salary: 2300000 },
      { title: "Lead QA Automation Architect", role: "Employee", salary: 1900000 },
      { title: "Senior Backend Engineer (Node/Go)", role: "Employee", salary: 2100000 },
      { title: "Site Reliability Engineer (SRE)", role: "Employee", salary: 2000000 },
      { title: "Database Architect (PostgreSQL)", role: "Employee", salary: 2200000 },
      { title: "Mobile App Engineer (React Native)", role: "Employee", salary: 1800000 },
      { title: "Senior UI/UX Design System Lead", role: "Employee", salary: 1750000 },
      { title: "Full-Stack Software Engineer", role: "Employee", salary: 1500000 },
      { title: "Cloud Security Specialist", role: "Employee", salary: 1900000 },
      { title: "Frontend Software Engineer", role: "Employee", salary: 1350000 },
      { title: "Backend Systems Developer", role: "Employee", salary: 1400000 },
      { title: "QA Automation Test Engineer", role: "Employee", salary: 1200000 },
      { title: "IT Systems & Infrastructure Admin", role: "Employee", salary: 1100000 },
      { title: "Data Platform Engineer", role: "Employee", salary: 1650000 },
      { title: "Associate Software Engineer", role: "Employee", salary: 850000 }
    ],
    names: [
      { firstName: "Abhishek", lastName: "Banerjee", gender: "Male" },
      { firstName: "Bhavna", lastName: "Nair", gender: "Female" },
      { firstName: "Chirag", lastName: "Mehta", gender: "Male" },
      { firstName: "Divya", lastName: "Sundaram", gender: "Female" },
      { firstName: "Eshan", lastName: "Goel", gender: "Male" },
      { firstName: "Farhan", lastName: "Qureshi", gender: "Male" },
      { firstName: "Geetika", lastName: "Saxena", gender: "Female" },
      { firstName: "Harsh", lastName: "Vardhan", gender: "Male" },
      { firstName: "Ishaan", lastName: "Mukherjee", gender: "Male" },
      { firstName: "Jaya", lastName: "Lakshmi", gender: "Female" },
      { firstName: "Kavya", lastName: "Krishnamurthy", gender: "Female" },
      { firstName: "Lalit", lastName: "Modi", gender: "Male" },
      { firstName: "Mehul", lastName: "Parekh", gender: "Male" },
      { firstName: "Nikita", lastName: "Bansal", gender: "Female" },
      { firstName: "Omkar", lastName: "Kadam", gender: "Male" },
      { firstName: "Pooja", lastName: "Hegde", gender: "Female" },
      { firstName: "Rahul", lastName: "Bose", gender: "Male" },
      { firstName: "Sanjana", lastName: "Goyal", gender: "Female" },
      { firstName: "Tushar", lastName: "Pandey", gender: "Male" },
      { firstName: "Urvi", lastName: "Shah", gender: "Female" }
    ]
  },
  {
    deptId: "dept-3",
    deptName: "Finance & Accounts",
    managerId: "emp-5",
    managerName: "Neha Gupta",
    prefix: "fin",
    positions: [
      { title: "Senior Financial Controller", role: "Manager", salary: 2500000 },
      { title: "Lead Chartered Accountant (CA)", role: "Employee", salary: 2100000 },
      { title: "Corporate Tax & GST Lead", role: "Employee", salary: 1850000 },
      { title: "Treasury & Cash Flow Manager", role: "Employee", salary: 1950000 },
      { title: "Senior Financial Analyst", role: "Employee", salary: 1600000 },
      { title: "Internal Audit & Risk Specialist", role: "Employee", salary: 1700000 },
      { title: "Accounts Payable Manager", role: "Employee", salary: 1350000 },
      { title: "Accounts Receivable Lead", role: "Employee", salary: 1300000 },
      { title: "Senior Payroll Accountant", role: "Employee", salary: 1250000 },
      { title: "Budgeting & Forecasting Specialist", role: "Employee", salary: 1550000 },
      { title: "Cost & Management Accountant", role: "Employee", salary: 1400000 },
      { title: "Statutory Compliance Officer", role: "Employee", salary: 1300000 },
      { title: "Billing & Revenue Operations Lead", role: "Employee", salary: 1200000 },
      { title: "Fixed Assets & Depreciation Analyst", role: "Employee", salary: 1150000 },
      { title: "Financial Reporting Specialist", role: "Employee", salary: 1450000 },
      { title: "Senior Audit Associate", role: "Employee", salary: 1100000 },
      { title: "Corporate Banking Coordinator", role: "Employee", salary: 1050000 },
      { title: "Tax Compliance Associate", role: "Employee", salary: 950000 },
      { title: "Junior Financial Analyst", role: "Employee", salary: 850000 },
      { title: "Accounts & Billing Executive", role: "Employee", salary: 750000 }
    ],
    names: [
      { firstName: "Aditya", lastName: "Chopra", gender: "Male" },
      { firstName: "Anjali", lastName: "Mishra", gender: "Female" },
      { firstName: "Bharat", lastName: "Agarwal", gender: "Male" },
      { firstName: "Chandana", lastName: "Murthy", gender: "Female" },
      { firstName: "Dhruv", lastName: "Kapoor", gender: "Male" },
      { firstName: "Ekta", lastName: "Bhargava", gender: "Female" },
      { firstName: "Girish", lastName: "Pai", gender: "Male" },
      { firstName: "Himani", lastName: "Singhal", gender: "Female" },
      { firstName: "Inder", lastName: "Sahni", gender: "Male" },
      { firstName: "Juhi", lastName: "Chawla", gender: "Female" },
      { firstName: "Kunal", lastName: "Soni", gender: "Male" },
      { firstName: "Leela", lastName: "Nathan", gender: "Female" },
      { firstName: "Mohit", lastName: "Bhandari", gender: "Male" },
      { firstName: "Namrata", lastName: "Kaur", gender: "Female" },
      { firstName: "Pankaj", lastName: "Tripathi", gender: "Male" },
      { firstName: "Radhika", lastName: "Apte", gender: "Female" },
      { firstName: "Suresh", lastName: "Prabhu", gender: "Male" },
      { firstName: "Trisha", lastName: "Krishnan", gender: "Female" },
      { firstName: "Utkarsh", lastName: "Dwivedi", gender: "Male" },
      { firstName: "Vaishali", lastName: "Desai", gender: "Female" }
    ]
  },
  {
    deptId: "dept-4",
    deptName: "Marketing & Growth",
    managerId: "emp-4",
    managerName: "Rajesh Kumar",
    prefix: "mkt",
    positions: [
      { title: "Head of Growth Marketing", role: "Manager", salary: 2400000 },
      { title: "Senior Performance Marketing Lead", role: "Employee", salary: 1900000 },
      { title: "Principal Brand Strategist", role: "Employee", salary: 2000000 },
      { title: "Product Marketing Manager (PMM)", role: "Employee", salary: 1800000 },
      { title: "Content Strategy & Editorial Lead", role: "Employee", salary: 1500000 },
      { title: "SEO & Organic Growth Specialist", role: "Employee", salary: 1350000 },
      { title: "Digital Advertising Lead (SEM/PPC)", role: "Employee", salary: 1450000 },
      { title: "Enterprise PR & Media Manager", role: "Employee", salary: 1600000 },
      { title: "Social Media & Community Lead", role: "Employee", salary: 1200000 },
      { title: "Email Marketing & Lifecycle Lead", role: "Employee", salary: 1300000 },
      { title: "Creative Visual Media Director", role: "Employee", salary: 1700000 },
      { title: "Senior Video Producer & Motion Lead", role: "Employee", salary: 1400000 },
      { title: "Market Research & Insights Analyst", role: "Employee", salary: 1350000 },
      { title: "Conversion Rate Optimization Lead", role: "Employee", salary: 1550000 },
      { title: "Influencer & Partner Relations Lead", role: "Employee", salary: 1250000 },
      { title: "Corporate Events & Trade Show Lead", role: "Employee", salary: 1300000 },
      { title: "Associate Content Strategist", role: "Employee", salary: 900000 },
      { title: "Graphic Designer & Brand Artist", role: "Employee", salary: 950000 },
      { title: "Digital Campaign Coordinator", role: "Employee", salary: 850000 },
      { title: "Junior Marketing Associate", role: "Employee", salary: 720000 }
    ],
    names: [
      { firstName: "Aakash", lastName: "Malhotra", gender: "Male" },
      { firstName: "Bipasha", lastName: "Basu", gender: "Female" },
      { firstName: "Chetan", lastName: "Bhagat", gender: "Male" },
      { firstName: "Disha", lastName: "Patani", gender: "Female" },
      { firstName: "Eklavya", lastName: "Prasad", gender: "Male" },
      { firstName: "Fatima", lastName: "Sana", gender: "Female" },
      { firstName: "Gautam", lastName: "Gambhir", gender: "Male" },
      { firstName: "Huma", lastName: "Qureshi", gender: "Female" },
      { firstName: "Imran", lastName: "Khan", gender: "Male" },
      { firstName: "Janhavi", lastName: "Kapoor", gender: "Female" },
      { firstName: "Kartik", lastName: "Aaryan", gender: "Male" },
      { firstName: "Laxmi", lastName: "Manchu", gender: "Female" },
      { firstName: "Madhav", lastName: "Seth", gender: "Male" },
      { firstName: "Nandini", lastName: "Rao", gender: "Female" },
      { firstName: "Ojas", lastName: "Patwardhan", gender: "Male" },
      { firstName: "Payal", lastName: "Ghosh", gender: "Female" },
      { firstName: "Raghav", lastName: "Juyal", gender: "Male" },
      { firstName: "Shruti", lastName: "Haasan", gender: "Female" },
      { firstName: "Tejas", lastName: "Patil", gender: "Male" },
      { firstName: "Upasana", lastName: "Kamineni", gender: "Female" }
    ]
  },
  {
    deptId: "dept-5",
    deptName: "Sales & Enterprise Partnerships",
    managerId: "emp-1",
    managerName: "Aarav Sharma",
    prefix: "sales",
    positions: [
      { title: "Strategic Partnerships Director", role: "Manager", salary: 2800000 },
      { title: "Senior Enterprise Account Executive", role: "Employee", salary: 2200000 },
      { title: "Enterprise Solution Consultant", role: "Employee", salary: 2000000 },
      { title: "Regional Sales Manager (South)", role: "Manager", salary: 2300000 },
      { title: "Regional Sales Manager (North & West)", role: "Manager", salary: 2300000 },
      { title: "Senior Business Development Lead", role: "Employee", salary: 1750000 },
      { title: "Inbound Sales Operations Lead", role: "Employee", salary: 1600000 },
      { title: "Key Account Manager - Fortune 500", role: "Employee", salary: 1950000 },
      { title: "Sales Enablement & Training Lead", role: "Employee", salary: 1550000 },
      { title: "Pre-Sales Technical Specialist", role: "Employee", salary: 1700000 },
      { title: "Mid-Market Account Executive", role: "Employee", salary: 1500000 },
      { title: "Customer Success Account Lead", role: "Employee", salary: 1450000 },
      { title: "Commercial Contract Negotiator", role: "Employee", salary: 1650000 },
      { title: "Channel Partner Lead", role: "Employee", salary: 1600000 },
      { title: "Renewal & Expansion Specialist", role: "Employee", salary: 1350000 },
      { title: "Senior SDR Lead", role: "Employee", salary: 1100000 },
      { title: "Inside Sales Specialist", role: "Employee", salary: 1050000 },
      { title: "Business Development Associate", role: "Employee", salary: 900000 },
      { title: "Enterprise Outbound Representative", role: "Employee", salary: 850000 },
      { title: "Junior Sales Associate", role: "Employee", salary: 700000 }
    ],
    names: [
      { firstName: "Alok", lastName: "Nath", gender: "Male" },
      { firstName: "Bhavani", lastName: "Reddy", gender: "Female" },
      { firstName: "Chaitanya", lastName: "Prasad", gender: "Male" },
      { firstName: "Devika", lastName: "Rani", gender: "Female" },
      { firstName: "Faraz", lastName: "Ahmed", gender: "Male" },
      { firstName: "Garima", lastName: "Jain", gender: "Female" },
      { firstName: "Hemant", lastName: "Karkare", gender: "Male" },
      { firstName: "Indrani", lastName: "Mukerjea", gender: "Female" },
      { firstName: "Jaideep", lastName: "Ahlawat", gender: "Male" },
      { firstName: "Kritika", lastName: "Kamra", gender: "Female" },
      { firstName: "Lokesh", lastName: "Kanagaraj", gender: "Male" },
      { firstName: "Monika", lastName: "Panwar", gender: "Female" },
      { firstName: "Naveen", lastName: "Polishetty", gender: "Male" },
      { firstName: "Pallavi", lastName: "Sharda", gender: "Female" },
      { firstName: "Rajat", lastName: "Barmecha", gender: "Male" },
      { firstName: "Swathi", lastName: "Reddy", gender: "Female" },
      { firstName: "Tarun", lastName: "Mansukhani", gender: "Male" },
      { firstName: "Urvashi", lastName: "Rautela", gender: "Female" },
      { firstName: "Vikrant", lastName: "Massey", gender: "Male" },
      { firstName: "Yamini", lastName: "Gautam", gender: "Female" }
    ]
  },
  {
    deptId: "dept-6",
    deptName: "Operations & Logistics",
    managerId: "emp-1",
    managerName: "Aarav Sharma",
    prefix: "ops",
    positions: [
      { title: "Supply Chain & Procurement Director", role: "Manager", salary: 2600000 },
      { title: "Pan-India Logistics Coordinator Lead", role: "Employee", salary: 1800000 },
      { title: "Corporate Facilities & Real Estate Lead", role: "Employee", salary: 1650000 },
      { title: "Strategic Vendor Management Lead", role: "Employee", salary: 1700000 },
      { title: "Quality Assurance & Six Sigma Lead", role: "Employee", salary: 1850000 },
      { title: "Warehouse & Inventory Operations Lead", role: "Employee", salary: 1500000 },
      { title: "Fleet & Transportation Manager", role: "Employee", salary: 1450000 },
      { title: "Health, Safety & Environment (HSE) Officer", role: "Employee", salary: 1400000 },
      { title: "Procurement & Sourcing Specialist", role: "Employee", salary: 1350000 },
      { title: "Facility Operations Supervisor", role: "Employee", salary: 1250000 },
      { title: "Operations Analyst & Process Engineer", role: "Employee", salary: 1300000 },
      { title: "Inventory Control & Audit Specialist", role: "Employee", salary: 1150000 },
      { title: "Dispatch & Fulfillment Coordinator", role: "Employee", salary: 1050000 },
      { title: "Asset Management & IT Tracking Lead", role: "Employee", salary: 1100000 },
      { title: "Vendor Relations Executive", role: "Employee", salary: 980000 },
      { title: "Security & Physical Infrastructure Supervisor", role: "Employee", salary: 1020000 },
      { title: "Logistics Operations Associate", role: "Employee", salary: 880000 },
      { title: "Procurement Associate", role: "Employee", salary: 850000 },
      { title: "Facility Helpdesk Coordinator", role: "Employee", salary: 780000 },
      { title: "Junior Operations Associate", role: "Employee", salary: 680000 }
    ],
    names: [
      { firstName: "Anand", lastName: "Mahindra", gender: "Male" },
      { firstName: "Bina", lastName: "Paul", gender: "Female" },
      { firstName: "Cyrus", lastName: "Mistry", gender: "Male" },
      { firstName: "Damini", lastName: "Bhatia", gender: "Female" },
      { firstName: "Eshwar", lastName: "Prasad", gender: "Male" },
      { firstName: "Falguni", lastName: "Nayar", gender: "Female" },
      { firstName: "Govind", lastName: "Nihalani", gender: "Male" },
      { firstName: "Harini", lastName: "Amirthalingam", gender: "Female" },
      { firstName: "Inderjit", lastName: "Singh", gender: "Male" },
      { firstName: "Jyoti", lastName: "Bansal", gender: "Female" },
      { firstName: "Kamlesh", lastName: "Tiwari", gender: "Male" },
      { firstName: "Lalitha", lastName: "Kumaramangalam", gender: "Female" },
      { firstName: "Murli", lastName: "Sharma", gender: "Male" },
      { firstName: "Nalini", lastName: "Chidambaram", gender: "Female" },
      { firstName: "Om", lastName: "Puri", gender: "Male" },
      { firstName: "Pratibha", lastName: "Patil", gender: "Female" },
      { firstName: "Ramesh", lastName: "Sixty", gender: "Male" },
      { firstName: "Saroj", lastName: "Khan", gender: "Female" },
      { firstName: "Taran", lastName: "Adarsh", gender: "Male" },
      { firstName: "Usha", lastName: "Uthup", gender: "Female" }
    ]
  }
];

let addedCount = 0;
let empIdCounter = 100;

deptConfigs.forEach((cfg) => {
  const dept = data.departments.find((d) => d.id === cfg.deptId);
  if (!dept) return;

  console.log(`\nAdding 20 employees to ${cfg.deptName} (${cfg.deptId})...`);

  for (let i = 0; i < 20; i++) {
    empIdCounter++;
    const pos = cfg.positions[i];
    const person = cfg.names[i];
    const avatar = avatars[i % avatars.length];
    const loc = cities[(empIdCounter + i) % cities.length];

    const uniqueId = `emp-${cfg.prefix}-${i + 1}`;
    const employeeCode = `EMP-${cfg.prefix.toUpperCase()}-${1000 + i + 1}`;
    const email = `${person.firstName.toLowerCase()}.${person.lastName.toLowerCase()}.${cfg.prefix}@ems.enterprise`;
    const phone = `+91 ${98000 + (empIdCounter % 900)} ${String(10000 + (empIdCounter * 37) % 90000).slice(0, 5)}`;
    const dobYear = 1986 + (i % 12);
    const dobMonth = String(1 + (i % 12)).padStart(2, "0");
    const dobDay = String(1 + (i * 3) % 28).padStart(2, "0");
    const dob = `${dobYear}-${dobMonth}-${dobDay}`;
    const joinYear = 2022 + (i % 4);
    const joinMonth = String(1 + (i * 2) % 12).padStart(2, "0");
    const joinDate = `${joinYear}-${joinMonth}-15`;

    // Check if already exists by uniqueId
    const existingIndex = data.employees.findIndex((e) => e.id === uniqueId || e.employeeId === employeeCode);

    const empRecord = {
      id: uniqueId,
      employeeId: employeeCode,
      firstName: person.firstName,
      lastName: person.lastName,
      email: email,
      phone: phone,
      gender: person.gender,
      dob: dob,
      address: `${100 + i * 7}, ${loc.address}`,
      city: loc.city,
      state: loc.state,
      country: "India",
      departmentId: cfg.deptId,
      departmentName: cfg.deptName,
      position: pos.title,
      role: pos.role,
      joiningDate: joinDate,
      employmentType: i === 19 ? "Contract" : "Full-Time",
      managerId: cfg.managerId,
      managerName: cfg.managerName,
      salary: pos.salary,
      status: i === 18 ? "Probation" : i === 17 ? "On Leave" : "Active",
      emergencyContact: {
        name: `${person.firstName}'s Family`,
        relationship: person.gender === "Male" ? "Spouse" : "Parent",
        phone: `+91 97000 ${String(12000 + i * 350).slice(0, 5)}`
      },
      avatar: avatar,
      notes: `${pos.title} in the ${cfg.deptName} department.`,
      createdAt: `${joinDate}T09:00:00.000Z`,
      updatedAt: "2026-09-01T09:00:00.000Z"
    };

    if (existingIndex >= 0) {
      data.employees[existingIndex] = empRecord;
    } else {
      data.employees.push(empRecord);
      addedCount++;
    }

    // Leave Balances
    if (!data.leaveBalances) {
      data.leaveBalances = {};
    }
    data.leaveBalances[uniqueId] = {
      casualLeave: { total: 12, used: 2 + (i % 3), remaining: 10 - (i % 3) },
      sickLeave: { total: 10, used: 1 + (i % 2), remaining: 9 - (i % 2) },
      earnedLeave: { total: 15, used: 3 + (i % 4), remaining: 12 - (i % 4) },
      emergencyLeave: { total: 5, used: (i % 2), remaining: 5 - (i % 2) }
    };
  }

  // Update department employee count
  const allEmpsInDept = data.employees.filter((e) => e.departmentId === cfg.deptId);
  dept.employeeCount = allEmpsInDept.length;
  console.log(`Total employees in ${cfg.deptName} now: ${allEmpsInDept.length}`);
});

fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
console.log(`\nSuccessfully added/updated employees! Total company employees now: ${data.employees.length}`);
