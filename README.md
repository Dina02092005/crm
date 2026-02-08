# TaxiBy Admin Dashboard

A modern admin dashboard built with Next.js 16, shadcn/ui, TanStack libraries, and more.

## Tech Stack

### Core Framework
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first CSS framework

### UI Components
- **shadcn/ui** - High-quality React components
- **React Icons** - Icon library (Font Awesome)
- **Leaflet** - Interactive maps

### Data Management
- **TanStack Query** - Data fetching and caching
- **TanStack Table** - Headless table library
- **TanStack Form** - Type-safe form handling

### Utilities
- **Axios** - HTTP client with interceptors
- **Winston** - Logging library
- **React Query DevTools** - Development tools

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
taxiby_admin/
├── app/                      # Next.js app directory
│   ├── examples/            # Example implementations
│   │   ├── tanstack-query/  # TanStack Query example
│   │   ├── tanstack-table/  # TanStack Table example
│   │   ├── tanstack-form/   # TanStack Form example
│   │   ├── leaflet-map/     # Leaflet Map example
│   │   └── react-icons/     # React Icons example
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   └── ui/                  # shadcn/ui components
├── lib/                     # Utility libraries
│   ├── axios.ts            # Axios instance configuration
│   ├── logger.ts           # Winston logger configuration
│   └── utils.ts            # Utility functions
├── providers/              # React providers
│   └── query-provider.tsx  # TanStack Query provider
└── logs/                   # Log files (auto-generated)
```

## Key Features

### Axios Instance (`lib/axios.ts`)
Pre-configured HTTP client with:
- Request/response interceptors
- Automatic authentication token handling
- Integrated logging
- Error handling

```typescript
import axiosInstance from '@/lib/axios';

// Usage
const response = await axiosInstance.get('/api/users');
```

### Logger (`lib/logger.ts`)
Winston logger with:
- Multiple log levels (error, warn, info, debug)
- File and console transports
- Custom formatting
- Automatic log rotation

```typescript
import { logger } from '@/lib/logger';

// Usage
logger.info('User logged in', { userId: 123 });
logger.error('API error', { error: err });
```

### TanStack Query Provider
Configured with:
- 1-minute stale time
- 5-minute cache time
- Automatic refetch disabled on window focus
- React Query DevTools in development

### shadcn/ui Components
Pre-installed components:
- Button
- Card
- Input
- Label
- Table
- Form
- Select
- Dialog

## Examples

Visit `/examples` to see working examples of:

1. **TanStack Query** - Data fetching with useQuery and useMutation
2. **TanStack Table** - Advanced tables with sorting, filtering, pagination
3. **TanStack Form** - Type-safe forms with validation
4. **Leaflet Map** - Interactive maps with custom markers
5. **React Icons** - Icon usage patterns

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NODE_ENV=development
```

## Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Adding New shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

## License

MIT
