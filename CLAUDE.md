# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production 
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

## Project Architecture

This is a React-based AI voice calling management application built with Vite, TypeScript, and Supabase.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components + Tailwind CSS
- **Backend**: Supabase (PostgreSQL database + Edge Functions)
- **State Management**: TanStack Query for server state
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod validation

### Core Architecture

**Database Schema**: The application revolves around these main entities:
- `clients` - Client organizations
- `users` - Application users with role-based access
- `assistants` - AI voice assistants configured per client
- `phone_numbers` - Phone numbers assigned to clients
- `campaigns` - Batch calling campaigns
- `campaign_calls` - Individual calls within campaigns
- `call_reports` - Detailed call analytics and transcripts

**Role-Based Access**:
- Master users: Full admin access to all clients and data
- Client users: Access only to their client's data

**Key Routes**:
- `/` - Landing page
- `/auth` - Authentication
- `/dashboard` - Main dashboard (redirects based on role)
- `/master` - Master admin dashboard
- `/client` - Client-specific dashboard

### Important File Locations

**Core App Structure**:
- `src/App.tsx` - Main app component with routing setup
- `src/main.tsx` - Application entry point
- `src/pages/` - Page components for different routes

**Data Layer**:
- `src/integrations/supabase/` - Supabase client configuration and TypeScript types
- `src/services/` - Service layer for API calls (admin, batch calling, call reports)
- `src/hooks/useAuth.tsx` - Authentication context and logic

**UI Components**:
- `src/components/ui/` - Reusable shadcn/ui components
- `src/components/dashboard/` - Dashboard-specific components  
- `src/components/campaigns/` - Campaign management components
- `src/components/master/` - Master admin components

**Supabase Integration**:
- `supabase/migrations/` - Database schema migrations
- `supabase/functions/` - Edge functions for call handling and reports

### Development Notes

**Database Types**: The `src/integrations/supabase/types.ts` file contains auto-generated TypeScript types from the Supabase schema. These types are used throughout the application for type safety.

**Component Architecture**: The app uses shadcn/ui components as the foundation, with custom components built on top. All components follow TypeScript strict mode.

**State Management**: TanStack Query is used for server state management, caching, and synchronization. Authentication state is managed through a React context.

**Styling**: Tailwind CSS with a custom design system. CSS custom properties are used for theming support.