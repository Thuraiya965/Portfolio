// ---------------------------------------------------------------------------
// All the portfolio content lives here. Edit this file to update the site.
// `tools` strings are matched against the skills list, so a tool written the
// same way in both places becomes a clickable link in the skills section.
// ---------------------------------------------------------------------------

const IMG = 'assets/img/';
export const GITHUB = 'https://github.com/Thuraiya2almarhoobi';

export const PROJECTS = [
  {
    id: 'smartsort',
    title: 'SmartSort',
    hook: 'AI waste detection and disposal guidance',
    cat: 'AI · Computer vision',
    when: '2025 – 2026 · UWE Bristol',
    role: 'Designed and developed end to end',
    fig: { n: '14', l: 'waste classes · 3-model detection ensemble' },
    summary:
      'A CNN-based system that detects waste items from a camera feed, classifies them into 14 operational categories and returns disposal guidance based on Bristol City Council rules. Low-confidence results are escalated for manual review.',
    problem:
      'Incorrect sorting reduces recycling quality, and a standard classifier only returns a label. A sorting process needs an actionable decision, and it needs to recognise when a prediction should not be trusted.',
    built: [
      'Perception layer with three YOLO-compatible detectors combined as a weighted ensemble (consensus weighted union, agreement IoU 0.45).',
      'Unified training dataset built from three sources (TACO, a local 10-class set and a 30-class Kaggle set) and mapped to a single 14-class taxonomy.',
      'Post-processing to remove weak, undersized and duplicate detections and assign confidence bands.',
      'Rules engine separated from the model, so disposal policy can change without retraining.',
      'Manual-review escalation below 0.60 confidence and for safety-sensitive items such as batteries and broken glass.',
      'React front end supporting image upload, live webcam and phone-camera input, served by a FastAPI backend.',
    ],
    numbers: [
      ['5,732', 'training images after merging three datasets'],
      ['14', 'operational waste classes'],
      ['3', 'detectors in the ensemble'],
      ['35', 'training epochs (≈2.5 h on GPU)'],
    ],
    tools: ['Python', 'PyTorch', 'YOLO', 'CNN', 'FastAPI', 'REST APIs', 'React', 'Vite'],
    features: [
      {
        src: IMG + 'smartsort-detection.jpg', title: 'Live detection with a disposal decision',
        text: 'Every detected item gets a bounding box, a confidence score and a waste stream. The Bristol rules engine then returns the material, whether it is recyclable, step-by-step disposal instructions and the reason behind the decision.',
      },
      {
        src: IMG + 'smartsort-guidance.jpg', title: 'Rules-based guidance for difficult items',
        text: 'Items that look recyclable but are not, such as disposable plastic cutlery, are routed to general waste with an explanation. Session counters track items detected, recyclable share, items sent for manual check and average confidence.',
      },
      {
        src: IMG + 'smartsort-model-quality.jpg', title: 'Model quality dashboard',
        text: 'A built-in view of model performance: 88.49% overall validation accuracy on 3,607 samples, per-class accuracy (for example clothes 97%, paper 90%, plastic 76%), the ensemble runtime configuration and the active Bristol City Council policy with 14 rules.',
      },
      {
        src: IMG + 'smartsort-mobile.jpg', title: 'Phone-camera mode',
        text: 'The same app runs on a phone over the local network, using the live camera. Detections are colour-coded by confidence band (high 65% and above, medium 40-65%, low under 40%) so uncertain results are easy to spot.',
      },
    ],
    evidence: [{ src: IMG + 'smartsort-pipeline.png', cap: 'SmartSort dataset construction and training pipeline' }],
    repo: 'https://github.com/Thuraiya2almarhoobi/SmartSort',
  },
  {
    id: 'tear-analysis',
    title: 'Tear Analysis System',
    hook: 'Automating SRP failure tracking at OXY',
    cat: 'Oil & gas · Enterprise application',
    when: 'Jul – Sep 2025 · OXY, Oman',
    role: 'System Developer Intern · Mentor: Abdullah Al Hamdi',
    fig: { n: '15k+', l: 'Excel rows migrated to a structured database' },
    summary:
      'A web application that replaced a shared Excel workbook used to document sucker-rod-pump failures, introducing a structured database, automated KPI entry and interactive reporting.',
    problem:
      'Failure records were maintained in a shared Excel file of more than 15,000 rows. The process was slow, prone to inconsistent data and multi-user editing conflicts, and increasingly difficult to manage as the data grew.',
    built: [
      'Failure submission form writing directly to a structured database.',
      'Engineer review and final confirmation stages to validate every record.',
      'Automatic calculations with interactive charts and tables for analysis.',
      'Data-quality controls at entry to reduce human error.',
      'Presented as a poster at the OXY intern showcase.',
    ],
    numbers: [
      ['45–60', 'failure events per week'],
      ['19–35', 'days of well downtime per failure'],
      ['1.5–2', 'days per week, per engineer, on manual entry'],
      ['50%+', 'expected reduction in processing time'],
    ],
    tools: ['Angular', 'Azure DevOps', 'SQL Server', 'Visual Studio', 'VS Code'],
    evidence: [
      { src: IMG + 'oxy-poster.jpg', cap: 'Tear Analysis System poster, OXY "Zero In" showcase' },
      { src: IMG + 'oxy-stand.jpg', cap: 'Presenting the project at OXY, Oman' },
    ],
  },
  {
    id: 'desd',
    title: 'Bristol Local Food Marketplace',
    hook: 'Multi-role marketplace for the Bristol Regional Food Network',
    cat: 'Full stack · E-commerce · AI',
    when: '2025 – 2026 · UWE Bristol (team project)',
    role: 'Full-stack developer',
    fig: { n: '5', l: 'user roles with dedicated dashboards' },
    summary:
      'A production-grade marketplace connecting customers, producers, restaurants, community buyers and administrators, with payments, delivery orchestration, reporting and optional AI-assisted content.',
    problem:
      'A regional food network serves five distinct user groups, each needing different workflows, payment terms and reporting, all within one consistent platform.',
    built: [
      'Django REST API with JWT authentication and role-based routing.',
      'React and TypeScript front end with cart, checkout, saved addresses and order history.',
      'Producer inventory and orders, recurring restaurant orders, surplus deals and notifications.',
      'Stripe test-mode payments, delivery simulation, and admin commission and settlement reports.',
      'Optional Gemini (Vertex AI) integration for recipe and producer-story generation.',
      'Docker Compose environment with seeded demo data and automated backend tests.',
    ],
    numbers: [
      ['5', 'user roles'],
      ['13+', 'application routes'],
      ['1', 'command to run the full stack with Docker'],
    ],
    tools: ['Django REST', 'React', 'TypeScript', 'Vite', 'PostgreSQL', 'Docker', 'Stripe', 'JWT', 'REST APIs', 'Gemini API', 'Tailwind CSS'],
    features: [
      {
        src: IMG + 'desd-browse.jpg', title: 'Public browse before signing in',
        text: 'Visitors can explore products and producers in a read-only marketplace with category and sort filters. Ordering is kept behind authenticated customer, community and restaurant accounts.',
      },
      {
        src: IMG + 'desd-product.jpg', title: 'Product detail with full context',
        text: 'Each product shows price per unit, order status, estimated fulfilment time and stock, alongside seasonality, organic certification, food miles, allergen information, storage advice, recipe suggestions and the farm location.',
      },
      {
        src: IMG + 'desd-marketplace.jpg', title: 'Signed-in marketplace and surplus deals',
        text: 'Buyers filter by category, organic certification, price, seasonality, allergens and stock, save favourite producers, and add to cart or buy now. A separate Surplus Deals tab highlights discounted surplus produce.',
      },
      {
        src: IMG + 'desd-producer-orders.jpg', title: 'Producer sales orders and recurring demand',
        text: 'Producers see live order counts by status and can filter by status, customer and date. Upcoming recurring restaurant templates give advance notice of demand, so harvest, kitchen prep and restocking can be planned before the orders arrive.',
      },
      {
        src: IMG + 'desd-order-detail.jpg', title: 'Order detail for fulfilment',
        text: 'Each order lists its items with unit prices and allergens, the delivery date and address, food miles, preparation notes with lead time, and the subtotal with the 5% platform commission.',
      },
      {
        src: IMG + 'desd-payouts.jpg', title: 'Weekly payouts and exports',
        text: 'Producers receive weekly settlement statements showing orders, total sales, the 5% commission and their earnings, with payout status (paid, pending bank transfer, processing) and CSV, PDF and Excel exports.',
      },
    ],
    evidence: [],
    repo: 'https://github.com/Thuraiya2almarhoobi/DESDProject',
  },
  {
    id: 'ccu-dashboard',
    title: 'CCU Referral AI',
    hook: 'AI model predicting dietitian referrals in critical care',
    cat: 'AI · Healthcare machine learning',
    when: '2024 – 2025 · UWE Bristol (team project)',
    role: 'Team: Mohammad Faraj Raeez Jaldin, Madjid Lachichi · Supervisor: Elias Pimenidis',
    fig: { n: 'AI', l: 'RandomForest model predicting dietitian referrals' },
    summary:
      'An AI model that predicts which critical care unit (CCU) patients should be referred to a dietitian. The model is the core of the project; a dashboard delivers its predictions, so dietitians can upload patient CSV files, see predicted referrals and review the data through charts and reports.',
    problem:
      'Dietitians in a critical care unit must prioritise referrals across many patients. They needed a fast, data-driven way to identify who should be seen first using measurements already recorded.',
    built: [
      'RandomForest classification model trained on feed volume, oxygen flow rate, respiratory rate and BMI to predict whether a patient needs a dietitian referral.',
      'ML API (Flask) serving the model predictions, alongside a data API for CSV ingestion.',
      'Next.js front end to search, filter and paginate referrals, with charts of patient metrics.',
      'Report export to image and PDF, and an Electron wrapper for desktop deployment.',
      'The project led to the team being selected for the UWE academic visit to Malaysia.',
    ],
    numbers: [
      ['4', 'clinical features used by the model'],
      ['2', 'Flask services (data and ML)'],
      ['2', 'deployment targets: web and desktop'],
    ],
    tools: ['Python', 'scikit-learn', 'pandas', 'Flask', 'REST APIs', 'Next.js', 'Electron'],
    features: [
      {
        src: IMG + 'ccu-screens.jpg', title: 'From model prediction to dietitian workflow',
        text: 'The app wraps the model in five screens: Home; Patient Referrals to Dietitian, listing the predicted referral for each patient; Analyse Patients Data, to search and filter by referral status; Reports & Data Visualisation, with charts of referrals and patient measurements; and Upload CSV, to score new patient data.',
      },
    ],
    evidence: [],
    repo: 'https://github.com/Thuraiya2almarhoobi/Medical-Dashboard',
  },
  {
    id: 'pr-agents',
    title: 'Marketing & BI Agents',
    hook: 'AI agents for marketing, case studies and business intelligence',
    cat: 'AI agents · LLMs',
    when: 'May – Jul 2026 · Perceptual Robotics, Bristol',
    role: 'AI & Marketing Automation Intern · with Lucía Roca Fernández-Vizarra',
    fig: { n: '3', l: 'AI agents developed and deployed' },
    summary:
      'Three specialised AI agents supporting a drone-inspection company with marketing content, case-study creation and business-intelligence research.',
    problem:
      'A small technical team needed to produce marketing material, case studies and market research alongside its engineering work, each involving significant repetitive writing and research.',
    built: [
      'Marketing agent for drafting content aligned with the company\'s voice.',
      'Case-study agent that turns project information into structured case studies.',
      'Business-intelligence agent for market research and opportunity discovery.',
      'Later used by UWE Bristol Business School students in a workshop I co-delivered (November 2026).',
    ],
    numbers: [
      ['3', 'agents built during the internship'],
      ['1', 'university workshop delivered with them'],
    ],
    tools: ['Python', 'LLMs', 'AI agents'],
    evidence: [],
  },
  {
    id: 'optimisation',
    title: 'AI Optimisation Study',
    hook: 'Comparative study of AI optimisation algorithms',
    cat: 'AI · Research',
    when: 'UWE Bristol',
    role: 'Individual study',
    summary:
      'A comprehensive study of solving optimisation problems with different AI algorithms, evaluating and comparing their performance on the same problem set.',
    problem:
      'Algorithm selection is often based on reputation rather than evidence. This study compared several approaches under the same conditions.',
    built: [
      'Implemented several AI optimisation algorithms against a common problem set.',
      'Evaluated and visualised their results side by side.',
    ],
    numbers: [],
    tools: ['Python', 'NumPy', 'Matplotlib'],
    evidence: [],
  },
  {
    id: 'issue-tracker',
    title: 'Issue Tracking System',
    hook: 'Issue tracking for large institutions',
    cat: 'Low-code · Enterprise tool',
    when: 'Aug – Sep 2024 · Digital Waves IT Solutions, Oman',
    role: 'IT Solutions Developer Intern',
    summary:
      'An issue-tracking system built with App Creator and Deluge scripting so that issues are logged, assigned and followed through to resolution.',
    problem: 'In large institutions, issues reported by email and phone are easily lost between teams.',
    built: [
      'Forms to log issues, with assignment and status tracking.',
      'Deluge scripts automating routing and status updates.',
      'Collaborated with mentors on networking solutions.',
    ],
    numbers: [],
    tools: ['App Creator', 'Deluge'],
    evidence: [],
  },
  {
    id: 'erp',
    title: 'Task Manager & ERP',
    hook: 'Laravel task management and ERP modules',
    cat: 'Full stack · Laravel',
    when: 'Jun – Aug 2024 · DataBoat, Oman',
    role: 'Full Stack Web Developer Intern',
    fig: { n: '3', l: 'Laravel projects delivered' },
    summary: 'Three Laravel projects, including a task-manager application and an ERP system for managing company tasks.',
    problem: 'Company tasks were spread across several tools without a single view of ownership and progress.',
    built: ['Task-manager application with assignments and statuses.', 'ERP modules for managing company tasks.'],
    numbers: [['3', 'Laravel projects']],
    tools: ['Laravel', 'PHP', 'MySQL', 'HTML', 'CSS', 'JavaScript'],
    evidence: [],
  },
];

export const EXPERIENCE = [
  {
    id: 'snt', hash: 'a1f0e26', ref: 'current', loc: 'Muscat, Oman',
    when: 'Sep 2026 – Present', role: 'AI Developer', org: 'Smart Network Trading',
    text: 'Developing and maintaining AI-powered solutions, including LLM-based applications, retrieval-augmented generation (RAG) pipelines and intelligent automation systems.',
    tools: ['Python', 'LLMs', 'RAG', 'Microsoft Azure', 'Docker', 'Linux'],
    // shown in the "current role" panel opened from the hero chip
    focus: [
      { n: 'LLM', title: 'LLM-based applications', text: 'Building applications on large language models that answer questions, draft content and support day-to-day work.' },
      { n: 'RAG', title: 'Retrieval-augmented generation', text: 'Designing RAG pipelines that ground model answers in the organisation\'s own documents and data.' },
      { n: 'AUTO', title: 'Intelligent automation', text: 'Replacing manual, repetitive processes with automated, AI-assisted workflows.' },
    ],
    evidence: [],
  },
  {
    id: 'pr', hash: '7c3d9b1', loc: 'Bristol, UK',
    when: 'May – Jul 2026', role: 'AI & Marketing Automation Intern', org: 'Perceptual Robotics',
    text: 'Developed three specialised AI agents supporting marketing content, case-study creation and business-intelligence research for a company delivering autonomous drone inspections of wind turbines. The agents were later used in a UWE Bristol Business School workshop that I co-delivered.',
    tools: ['Python', 'LLMs', 'AI agents'],
    project: 'pr-agents',
    evidence: [],
  },
  {
    id: 'rank', hash: '4e8a210', loc: 'Bristol, UK',
    when: 'Dec 2025 – May 2026', role: 'Digital Transformation Intern', org: 'Rank Engineering',
    text: 'Improved digital workflows and databases to support more efficient information management and operational processes.',
    tools: ['Databases', 'Digital workflows', 'Process improvement'],
    evidence: [],
  },
  {
    id: 'oxy', hash: 'f19c7e4', loc: 'Oman',
    when: 'Jul – Sep 2025', role: 'System Developer Intern', org: 'OXY Oil & Gas',
    text: 'Developed and implemented the Tear Analysis System to automate SRP failure tracking, migrating data from a 15,000+ row Excel workbook into a structured database with automated calculations and interactive reporting.',
    tools: ['Angular', 'Azure DevOps', 'SQL Server', 'Visual Studio', 'VS Code'],
    project: 'tear-analysis',
    evidence: [
      { src: IMG + 'oxy-stand.jpg', cap: 'Presenting the Tear Analysis System at OXY' },
      { src: IMG + 'oxy-poster.jpg', cap: 'Project poster' },
    ],
  },
  {
    id: 'su', hash: '2b6f0d8', loc: 'Bristol, UK',
    when: 'Sep 2024 – Jun 2026', role: 'Representative, Content Creator & Casual Staff', org: 'The Students\' Union at UWE',
    text: 'Hosted events, supported and engaged with new students, created content for the Union and served on the organising team for the Freshers Fair.',
    tools: ['Event management', 'Content creation', 'Public speaking'],
    evidence: [],
  },
  {
    id: 'dw', hash: '9d0e5a3', loc: 'Oman',
    when: 'Aug – Sep 2024', role: 'IT Solutions Developer Intern', org: 'Digital Waves IT Solutions',
    text: 'Developed an issue-tracking system using App Creator and Deluge scripting to streamline issue resolution for large institutions, and collaborated with mentors on networking solutions.',
    tools: ['App Creator', 'Deluge', 'Networking'],
    project: 'issue-tracker',
    evidence: [],
  },
  {
    id: 'db', hash: '0a7b3c2', loc: 'Oman',
    when: 'Jun – Aug 2024', role: 'Full Stack Web Developer Intern', org: 'DataBoat',
    text: 'Delivered three Laravel web projects, including a task-manager application and an ERP system for managing company tasks.',
    tools: ['Laravel', 'PHP', 'MySQL', 'HTML', 'CSS', 'JavaScript'],
    project: 'erp',
    evidence: [],
  },
  {
    id: 'oits', hash: '5f2c8e9', ref: 'voluntary', loc: 'Oman',
    when: 'Jun 2024 – Present', role: 'Ambassador', org: 'Oman Information Technology Society (OITS)',
    text: 'Organising technology events and workshops, representing the society at COMEX 2025, co-organising and presenting at a two-day tech camp, and delivering talks to school and university students on careers in technology.',
    tools: ['Event management', 'Public speaking'],
    evidence: [
      { src: IMG + 'comex.jpg', cap: 'The OITS team at COMEX Global Technology Show 2025' },
      { src: IMG + 'oits-cert.jpg', cap: 'Certificate of appreciation at the OITS stand, COMEX 2025' },
      { src: IMG + 'oits-camp.jpg', cap: 'OITS two-day tech camp' },
    ],
  },
];

// Skill groups. `also` lists extra tool strings that count as evidence.
export const SKILLS = [
  { fn: 'ai_ml', sig: 'AI & machine learning', items: [
    { n: 'LLMs' }, { n: 'RAG' }, { n: 'AI agents' }, { n: 'CNN' }, { n: 'YOLO' },
    { n: 'PyTorch' }, { n: 'scikit-learn' }, { n: 'Gemini API' },
  ] },
  { fn: 'languages', sig: 'programming languages', items: [
    { n: 'Python' }, { n: 'C#' }, { n: 'C++' }, { n: 'C' }, { n: 'JavaScript' }, { n: 'TypeScript' },
    { n: 'PHP' }, { n: 'SQL', also: ['SQL Server', 'MySQL', 'PostgreSQL'] }, { n: 'Assembly' }, { n: 'Deluge' },
  ] },
  { fn: 'frontend', sig: 'interfaces', items: [
    { n: 'React' }, { n: 'Next.js' }, { n: 'Angular' }, { n: 'Vite' }, { n: 'Electron' },
    { n: 'HTML' }, { n: 'CSS' }, { n: 'Tailwind CSS' },
  ] },
  { fn: 'backend', sig: 'APIs & services', items: [
    { n: 'FastAPI' }, { n: 'Flask' }, { n: 'Django REST' }, { n: 'Laravel' }, { n: '.NET' }, { n: 'Node.js' },
    { n: 'REST APIs' }, { n: 'JWT' }, { n: 'Stripe' },
  ] },
  { fn: 'data', sig: 'data & databases', items: [
    { n: 'pandas' }, { n: 'NumPy' }, { n: 'Matplotlib' }, { n: 'SQL Server' }, { n: 'MySQL' },
    { n: 'PostgreSQL' }, { n: 'NoSQL' }, { n: 'MySQL Workbench' }, { n: 'phpMyAdmin' },
  ] },
  { fn: 'cloud_devops', sig: 'cloud, DevOps & tools', items: [
    { n: 'Microsoft Azure', also: ['Azure DevOps'] }, { n: 'Azure DevOps' }, { n: 'Docker' }, { n: 'Linux' },
    { n: 'Git' }, { n: 'GitHub' }, { n: 'GitLab' }, { n: 'VMware' }, { n: 'Visual Studio' }, { n: 'VS Code' },
    { n: 'XAMPP' }, { n: 'App Creator' },
  ] },
];

export const CONTACT = {
  email: 'thurayashakir1@gmail.com',
  phone: '+968 9131 5181',
  phoneHref: 'tel:+96891315181',
  linkedin: 'https://www.linkedin.com/in/thuraiya-al-marhoobi-02302a2b2/',
  github: GITHUB,
};
