# STEmulus Coding Club Web Platform

An interactive, responsive, and beautifully designed web application for **STEmulus Coding Club**, a youth-focused STEM, coding, and robotics education platform. This repository houses the complete frontend web application, dynamic layouts, role-based dashboards, and interactive user-experience enhancements.

---

## 🚀 Key Features

*   **Interactive Parallax Hero & Custom Navigation:** Built with responsive navigation, mobile support, and GSAP/ScrollTrigger integrations for modern scroll-driven web experiences.
*   **Role-Based Web Dashboards:** Structured layout dashboards tailored for different user groups:
    *   **Student Dashboard:** Course tracking, resources, and progress indicators.
    *   **Tutor Dashboard:** Class schedule, student lists, and material uploading interface.
    *   **Parent Dashboard & Progress Tracker:** Live monitoring of student milestones, engagement, and achievements.
    *   **Referral Affiliate Dashboard:** Tracks marketing reach, commissions, and invite links.
*   **Dynamic Certificate Verification Portal:** A custom-designed frontend interface allowing students, parents, and employers to input certificate reference codes and verify authenticity.
*   **Comprehensive Program Directory:** Fully responsive course details pages for core programs like *Python Programming*, *Scratch Creators*, *Junior Robotics*, and *Web Wizards*.

---

## 🛠️ Tech Stack & Libraries

*   **HTML5 & CSS3:** Semantic structure and custom responsive grids/layouts.
*   **JavaScript (ES6+):** Dynamic client-side routing logic, certificate verification, and user interface control.
*   **GSAP (GreenSock Animation Platform):** ScrollTrigger and custom timeline animations for high-end aesthetic feedback.
*   **Netlify Ready:** Out-of-the-box configuration files (`netlify.toml` and redirects) for serverless deployment and clean URL routing.

---

## 📦 Project Directory Structure

```text
├── assets/                  # CSS stylesheets, JS modules, images, and video assets
│   ├── css/                 # Core stylesheets (style.css, preai-overhaul.css, responsive.css)
│   └── js/                  # Interactive modules (hero-parallax.js, mobile-nav.js, video-scrub.js)
├── index.html               # Main landing page
├── courses.html             # Program catalog
├── dashboard.html           # Student dashboard gateway
├── verify-certificate.html  # Public certificate verification page
├── issue-certificate.html   # Admin portal for issuing student certificates
├── tutor-dashboard.html     # Tutor management system
├── parent-dashboard.html    # Parent progress monitoring
├── join-as-tutor.html       # Onboarding application form
├── netlify.toml             # SPA redirects and deployment configurations
└── SQL_SETUP.sql            # Database schema for certificates & dashboards
```

---

## 🚦 Getting Started & Run Locally

### Prerequisites
To run this application locally, you only need a modern web browser.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ajimatimati/stemulus-web-platform.git
   ```
2. Navigate to the project directory:
   ```bash
   cd stemulus-web-platform
   ```
3. Open `index.html` in your browser, or run a local development server:
   ```bash
   # If you have Node/npm installed:
   npx serve .
   
   # Or using Python:
   python -m http.server 8000
   ```
   Access the site at `http://localhost:8000`.

---

## 📈 Future Roadmap
*   Integrate with a Firebase or Supabase backend to make the dashboards dynamic.
*   Add automated PDF certificate generation using `pdfkit`.
*   Link to a student registration and progress database.
