# Lead & Sales Management CRM - Project Master Plan

## 1. Project Overview
A premium, full-stack CRM system designed to manage the entire lifecycle of a lead—from initial contact to final conversion. The system focuses on high efficiency, visual excellence, and seamless team collaboration.

## 2. Technology Stack (Core Architecture)

### Frontend (User Interface)
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS & Vanilla CSS (Custom Utilities)
- **State Management**: React Hooks & Context API
- **Icons**: Lucide React / Custom SVG
- **Animations**: Framer Motion (for smooth transitions and hover effects)

### Backend (Business Logic)
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy (with PostgreSQL)
- **API Documentation**: Swagger UI (Auto-generated)
- **Security**: JWT Authentication & Password Hashing (Bcrypt)
- **Email Service**: Resend (HTTP-based delivery)

### Database & Storage
- **Database**: Supabase PostgreSQL
- **Connection**: PsychoPG (with Connection Pooling)

## 3. Design Aesthetics & Theme

### Visual Direction: "Premium Modernity"
- **Color Palette**: 
    - **Primary**: Deep Slate (111827) / Carbon Black
    - **Accents**: Electric Blue (#4A90E2) / Royal Purple (#7C3AED)
    - **Status Colors**: Success (Emerald), Pipeline (Amber), Critical (Rose)
- **UI Elements**:
    - **Glassmorphism**: Translucent cards with subtle backdrop-blur filters.
    - **Typography**: Inter / Outfit (Modern Sans Serif)
    - **Micro-interactions**: Subtle scaling on hover, soft shadows, and smooth page transitions.
    - **Dark Mode First**: Optimized for a sleek dark aesthetic by default.

## 4. Core Modules & Business Logic

### A. Authentication & Security
- **Logic**: JWT-based stateless authentication.
- **Forgot Password**: Secure OTP flow via Resend API with time-limited (5 min) in-memory validation and 3-attempt lock.
- **User Roles**: Admin (Full control), Team Lead (Manager), Sales Agent (Own leads/assigned).

### B. Lead Management
- **Workflow**: Capture -> Assign -> Follow-up -> Convert.
- **Features**: 
    - Centralized table with advanced filtering (Priority, Status, Source).
    - Quick lead creation forms with validation.
    - Lead ownership and auto-assignment logic.

### C. Sales Pipeline (Kanban)
- **Logic**: Drag-and-drop workflow representing the sales funnel.
- **Stages**: New -> Contacted -> Qualified -> Proposal -> Negotiation -> Won/Lost.
- **Visuals**: Color-coded cards indicating priority and time since last activity.

### D. Activity & Follow-up Tracking
- **System**: Automatic logging for all status changes.
- **Follow-ups**: Scheduled task reminders for agents to ensure zero lead leakage.
- **Timeline**: Visual activity feed for every lead.

### E. Team & Performance Management
- **Analytics**: Leaderboards showing top-performing agents.
- **Management**: Admins can create agents and send secure credentials via Resend.

## 5. Deployment & Reliability Strategies

### Infrastructure
- **Hosting**: Render (Web Services for Backend, Static Sites for Frontend).
- **Network**: HTTP-based email delivery (Resend) to ensure high deliverability regardless of server port restrictions.
- **Resilience**: In-memory caching for sensitive data like OTPs to avoid database overhead.

## 6. Implementation Timeline (Current Phase)
1. **Foundation**: Database schema and core API structure (Completed).
2. **Security & Mail**: Resend integration and OTP systems (Completed).
3. **Frontend Polish**: Implementing the premium Design System (In-progress).
4. **Logic Integration**: Kanban drag-and-drop and automated status workflows (Next Phase).
