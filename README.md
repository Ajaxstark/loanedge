# 🏦 LoanEdge — NBFC Loan Management System

A production-grade **NBFC Loan Management System** built with **Laravel 11** (modular backend) and **React 18** (frontend). It covers the entire loan lifecycle — from customer onboarding to collection and NPA management.

![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📖 Overview

LoanEdge is a **modular, scalable, and RBI-compliant** loan management platform that handles:

- Customer onboarding with a **6-step loan application wizard**
- **KYC document** upload and verification
- **Automated underwriting** with risk assessment
- **Multi-level approval workflow**
- **EMI scheduling** with partial payment support
- **Collection and NPA management** with aging buckets

---

## ✨ Features

### 👤 Customer Portal
- OTP-based registration and login
- 6-step loan application (Personal → Address → Employment → Loan → Documents → Review)
- Real-time form validation and auto-save
- Document upload with status tracking
- Application progress tracking

### 🏢 Staff Portal
- **Dashboard** with KPI cards and charts
- **Lead Management** with filters and pagination
- **Product Configuration** (loan types, interest rates, tenure)
- **KYC Verification** workflow
- **Underwriting** with CIBIL-based risk categorization
- **Approval Workflow** (Branch Manager / Credit Committee)
- **Loan Sanction & Disbursement**
- **EMI Scheduling** with payment recording
- **Collection & NPA** tracking

---

## 🏗️ Architecture

### Backend (Laravel 11 — Modular)
Modules/
├── User/ # Authentication, Roles
├── Lead/ # Lead Management
├── Product/ # Loan Products
├── Application/ # Loan Applications (6-step wizard)
├── KYC/ # Document Management
├── Underwriting/ # Risk Assessment
├── Approval/ # Multi-level Approval
├── Loan/ # Loan Sanction & Disbursement
├── EMI/ # EMI Scheduling & Payments
└── Collection/ # Overdue & NPA Management


### Frontend (React 18 + Vite)
src/
├── api/ # Centralized Axios instance
├── components/ # Reusable UI components
├── constants/ # Status constants
├── pages/ # Route pages
├── utils/ # Formatters and helpers
└── App.jsx # Routing


---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Laravel 11, PHP 8.x |
| **Frontend** | React 18, Vite |
| **Database** | MySQL |
| **Auth** | Laravel Sanctum (Token-based) |
| **Styling** | Tailwind CSS |
| **API** | RESTful, JSON |
| **Architecture** | Modular (nWidart/Laravel-Modules) |

---

## 🚀 Getting Started

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL

### Backend and Frontend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

Frontend Setup
cd frontend
npm install
npm run dev

Environment Variables
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_STORAGE_BASE_URL=http://localhost:8000/storage

🔐 Authentication
Staff: Email + Password (Sanctum token)
Customer: Email + Password + OTP verification
Protected Routes: Role-based access on React (custom ProtectedRoute components)

📌 Loan Lifecycle
text
Lead → KYC → Underwriting → Approval → Loan Sanction → Disbursement → EMI → Collection

🎯 Roadmap
☑ Modular backend (10 modules)
☑ Customer onboarding (6-step wizard)
☑ KYC document management
☑ Underwriting with risk assessment
☑ Multi-level approval workflow
☑ EMI scheduling with partial payments
☑ Collection & NPA tracking
□ CRIF / TransUnion credit bureau integration
□ Account Aggregator (AA) for bank statements
□ eNACH for auto-debit mandates
□ eSign for digital loan agreements

## 👨‍💻 Author
**Vishal Negi**
- 📧 Email: negi06343@gmail.com
- 💼 [LinkedIn](https://www.linkedin.com/in/vishalnegi18)
- 🐙 [GitHub](https://github.com/Ajaxstark)

## 📄 License
This project is for **educational and portfolio purposes only**.


⭐ **If you find this project useful, please give it a star!**



