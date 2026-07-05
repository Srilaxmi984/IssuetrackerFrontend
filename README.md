🚀 IssueTrack Pro – Smart Issue Tracking & Project Management System

> A full-stack Issue Tracking and Project Management platform that streamlines bug reporting, task assignment, collaboration, and issue resolution through role-based dashboards and a modern responsive interface.



🌐 Live Demo:
https://issuetracker-frontend-ccop0wpi9-srilaxmi984s-projects.vercel.app/


---

📌 Overview

IssueTrack Pro is a scalable issue management system built using React.js, Spring Boot, and MySQL. It enables organizations to efficiently manage software bugs, feature requests, and project tasks through dedicated Reporter, Manager, and Developer workflows.

The application follows a three-tier architecture with a RESTful backend, responsive frontend, and relational database, supporting real-time issue lifecycle management from creation to resolution.


---

✨ Features

👤 Authentication & Authorization

Secure Login System

Role-Based Access Control (RBAC)

Separate Dashboards

Reporter

Manager

Developer




---

📋 Issue Management

Create Issues

Assign Issues

Update Issue Status

Priority Management

Category Management

Due Date Tracking

Search & Filter Issues

View Issue History



---

📁 Project Management

Create Projects

Assign Managers

Assign Developers

Project-wise Issue Tracking

Project Statistics



---

📂 File Attachment Support

Upload screenshots

Upload supporting documents

Image Preview

PDF Preview

Multipart File Upload (10 MB)



---

💬 Collaboration

Comments

Ratings

Notifications

Issue Discussions



---

📊 Dashboard Analytics

Total Issues

Open Issues

In Progress Issues

Resolved Issues

Closed Issues

Reopened Issues



---

🛠 Tech Stack

Frontend

React.js

JavaScript (ES6)

Axios

React Context API

CSS3

HTML5



---

Backend

Java

Spring Boot

Spring MVC

Spring Data JPA

Hibernate

REST APIs

Multipart File Upload



---

Database

MySQL



---

Build Tools

Maven

npm



---

Deployment

Frontend → Vercel

Backend → Render

Database → MySQL



---

🏗 System Architecture

React Frontend
        │
        │ Axios REST APIs
        ▼
Spring Boot Backend
        │
        │ Spring Data JPA
        ▼
      MySQL


---

📂 Project Structure

Frontend
│
├── Components
├── Pages
├── Context
├── API
├── Utils
├── CSS
└── Assets

Backend
│
├── Controller
├── Service
├── Repository
├── Model
├── DTO
├── Config
├── Exception
└── Resources


---

🔄 Workflow

Reporter
    │
Creates Issue
    │
Manager Reviews
    │
Assigns Developer
    │
Developer Resolves
    │
Reporter Verifies
    │
Issue Closed


---

⚡ Performance

Initial Page Load: ~298 ms

DOM Content Loaded: ~286 ms

Average REST API Response Time: ~400 ms

Total Initial Request Completion: ~803 ms

Multipart File Upload Support: Up to 10 MB

Component-Based Dynamic Rendering

Asynchronous REST Communication using Axios



---

🔐 Security Features

Role-Based Authorization

RESTful API Architecture

Secure Authentication

CORS Configuration

Input Validation

Exception Handling



---

📈 Key Highlights

Three-Tier Architecture

Responsive UI

RESTful Backend

Dynamic Dashboard

Real-Time Issue Status Tracking

File Attachment Support

Project-Based Issue Management

Notification System

Comment & Rating System

Clean Modular Code Structure



---

📸 Screenshots

Login Page

Reporter Dashboard

Manager Dashboard

Developer Dashboard

Issue Details

Project Management

Analytics Dashboard



---

🚀 Getting Started

Clone Repository

git clone https://github.com/Srilaxmi984/IssuetrackerBackend.git

git clone https://github.com/Srilaxmi984/IssuetrackerFrontend.git


---

Backend Setup

cd IssuetrackerBackend

mvn clean install

mvn spring-boot:run


---

Frontend Setup

cd frontend

npm install

npm start


---

Database Configuration

Configure the following properties inside application.properties:

spring.datasource.url=YOUR_DATABASE_URL
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD

server.port=8080


---

Deployment

Frontend

Vercel


Backend

Render


Database

MySQL



---

⚠ Known Limitation

The application stores uploaded attachments on the backend server's local filesystem. Since the backend is deployed on Render, uploaded files are temporary and may not persist after server restarts or redeployments due to Render's ephemeral filesystem. In a production environment, this can be resolved by integrating cloud object storage services such as AWS S3, Cloudinary, or Google Cloud Storage.


---

Future Enhancements

JWT Authentication

Email Notifications

Activity Logs

Cloud Storage for Attachments

Advanced Analytics Dashboard

WebSocket Real-Time Notifications

Dark/Light Theme

Docker Compose Deployment

Kubernetes Support



---

👩‍💻 Author

Srilaxmi

B.Tech – Computer Science (AI & ML)

Kakatiya Institute of Technology & Science, Warangal


---

⭐ If you found this project useful, consider giving it a star on GitHub!
