# CoreTrack - Project Management Platform

A comprehensive full-stack project management platform built with Next.js, Supabase, and modern web technologies.

## Features

- **Authentication**: Secure email/password authentication with role-based access (admin/user)
- **Dashboard**: Overview with project stats, task completion, and recent activity
- **Project Management**: CRUD operations for projects with deadlines and budgets
- **Task Management**: Task creation, assignment, and dependency tracking
- **Goal Tracking**: Link tasks to goals with progress visualization
- **Expense Tracking**: Budget management and expense logging
- **User Management**: Admin-only user role management
- **Responsive Design**: Mobile-first design with dark mode support
- **Real-time Updates**: Live data synchronization with Supabase

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Radix UI, shadcn/ui
- **Animations**: Framer Motion
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd coretrack
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

4. Set up the database:
   - Go to your Supabase dashboard
   - Run the SQL commands from `supabase/schema.sql` in the SQL editor
   - Optionally run `supabase/seed.sql` for demo data

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Setup

1. Create a new Supabase project
2. Copy your project URL and anon key to `.env.local`
3. Run the schema SQL in your Supabase SQL editor:
   - Execute `supabase/schema.sql` to create tables and policies
   - Execute `supabase/seed.sql` to add demo data (optional)

### Deployment

Deploy to Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard and main app
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components
│   └── ui/               # UI components (shadcn/ui)
├── lib/                  # Utility functions
│   ├── auth.ts           # Authentication helpers
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # General utilities
├── supabase/             # Database schema and seeds
│   ├── schema.sql        # Database schema
│   └── seed.sql          # Demo data
└── README.md
\`\`\`

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Features Roadmap

### Implemented ✅
- User authentication and authorization
- Dashboard with overview statistics
- Project CRUD operations
- Task management system
- Goal tracking with progress bars
- Expense tracking and budget management
- Responsive design with dark mode
- Real-time data updates

### Coming Soon 🚧
- External API integrations (Trello, Jira, Slack)
- AI-powered project insights and predictions
- Advanced task dependencies visualization
- Team collaboration features
- File attachments and document management
- Advanced reporting and analytics
- Mobile app (React Native)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
