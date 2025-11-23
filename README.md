# AveronAI - Frontend Application

A modern Next.js frontend for the AveronAI financial transaction categorization system. This frontend-only application connects to an external backend API for all data processing and AI predictions.

## Overview

This is the **frontend-only** version of AveronAI. It provides a sleek, modern UI for:

- **Transaction Upload**: Batch process CSV/JSON files
- **Real-Time Predictions**: View categorization results with confidence scores
- **Explainability**: Understand which tokens influenced each prediction
- **Feedback Loop**: Correct mispredictions to improve model accuracy
- **Taxonomy Management**: Customize transaction categories
- **Performance Metrics**: View model accuracy and performance stats

**Important**: This application requires a separate backend API server running. See [Backend Setup](#backend-setup) section.

## Features

### User Interface

- **Modern Design**: Clean, minimalist interface with Tailwind CSS
- **Responsive**: Works seamlessly on desktop and mobile
- **Real-Time Updates**: Instant feedback on predictions and corrections
- **Explainable AI**: Token-level attribution for each prediction
- **Batch Processing**: Handle thousands of transactions at once
- **Custom Categories**: Define and manage your own taxonomy

### Technical Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: better-auth client
- **State Management**: React hooks
- **API Client**: Fetch with bearer token auth

## Project Structure

```
/src
  ├── app/
  │   ├── page.tsx              # Landing page
  │   ├── upload/page.tsx       # File upload interface
  │   ├── results/page.tsx      # Predictions dashboard
  │   ├── taxonomy/page.tsx     # Category management
  │   ├── evaluation/page.tsx   # Model metrics
  │   ├── dashboard/page.tsx    # User dashboard
  │   ├── login/page.tsx        # Login page
  │   └── signup/page.tsx       # Registration page
  │
  ├── components/
  │   ├── ui/                   # shadcn/ui components
  │   └── auth/                 # Auth-related components
  │
  └── lib/
      ├── api.ts               # API client utilities
      ├── auth-client.ts       # Authentication client
      ├── types.ts             # TypeScript interfaces
      └── constants.ts         # Configuration

```

## Getting Started

### Prerequisites

- **Node.js 18+** or **Bun**
- **Backend API** running (see [Backend Setup](#backend-setup))

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/averonaI.git
cd averonaI
```

2. **Install dependencies**:
```bash
npm install
# or
bun install
```

3. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and set your backend API URL:
```env
# External API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Site URL (for local development)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Run the development server**:
```bash
npm run dev
# or
bun run dev
```

5. **Open your browser**:
```
http://localhost:3000
```

## Backend Setup

This frontend requires a compatible backend API server. Your backend must implement the following endpoints:

### Required API Endpoints

#### Authentication
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session

#### Transactions
- `POST /api/predict` - Predict transaction category
- `POST /api/explain` - Get prediction explanation
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

#### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `DELETE /api/categories/:id` - Delete category

#### Feedback & Metrics
- `POST /api/feedback` - Submit prediction feedback
- `GET /api/metrics` - Get model performance metrics

### Backend Requirements

Your backend API should:
- Accept Bearer token authentication via `Authorization: Bearer <token>` header
- Return JSON responses
- Handle CORS for your frontend domain
- Implement better-auth compatible authentication endpoints

## Usage

### 1. Create an Account

Navigate to `/signup` and create a new account with:
- Name
- Email
- Password

### 2. Upload Transactions

Go to `/upload` and upload a CSV or JSON file:

**CSV Format:**
```csv
description,amount,merchant_name
STARBUCKS COFFEE #2390,5.45,Starbucks
SHELL PETROL STATION,45.00,Shell
AMAZON MARKETPLACE,89.99,Amazon
```

**JSON Format:**
```json
[
  {
    "description": "STARBUCKS COFFEE #2390",
    "amount": 5.45,
    "merchant_name": "Starbucks"
  }
]
```

### 3. View Predictions

Results appear at `/results` with:
- Predicted category
- Confidence score
- Influential tokens
- Feedback options

### 4. Manage Categories

Visit `/taxonomy` to:
- Add custom categories
- Remove categories
- Load category templates
- View all categories

### 5. Track Performance

Check `/evaluation` for:
- Model accuracy metrics
- F1 scores
- Confusion matrix
- Performance trends

## API Client

The frontend uses a centralized API client (`src/lib/api.ts`) that:

- Automatically includes bearer tokens from localStorage
- Points to `NEXT_PUBLIC_API_URL` environment variable
- Handles errors consistently
- Provides typed responses

Example usage:
```typescript
import { predictTransaction } from '@/lib/api';

const result = await predictTransaction(
  'STARBUCKS COFFEE',
  5.45,
  'Starbucks'
);

console.log(result.category); // 'Dining'
console.log(result.confidence); // 0.96
```

## Authentication

Authentication is handled client-side using better-auth:

```typescript
import { authClient, useSession } from '@/lib/auth-client';

// Sign up
await authClient.signUp.email({
  email: 'user@example.com',
  password: 'password',
  name: 'John Doe'
});

// Sign in
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password'
});

// Get session
const { data: session, isPending } = useSession();

// Sign out
await authClient.signOut();
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | `http://localhost:3000` |

### API Client Configuration

Edit `src/lib/api.ts` to customize:
- Request timeout
- Error handling
- Response parsing
- Authentication headers

## Development

### Build for Production

```bash
npm run build
# or
bun run build
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Preview Production Build

```bash
npm run build && npm run start
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your backend API URL
   - `NEXT_PUBLIC_SITE_URL` = your frontend domain
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t averon-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://api.example.com averon-frontend
```

## Architecture

```
┌─────────────────────────────────────┐
│     User Interface (Next.js)        │
│  - React Components                 │
│  - Tailwind CSS                     │
│  - shadcn/ui                        │
└──────────────┬──────────────────────┘
               │
               │ HTTP/JSON
               │
┌──────────────▼──────────────────────┐
│      External Backend API           │
│  - Authentication                   │
│  - ML Predictions (DistilBERT)      │
│  - Database (PostgreSQL/Turso)      │
│  - Business Logic                   │
└─────────────────────────────────────┘
```

### Data Flow

1. **User Action**: User uploads transactions via `/upload`
2. **API Call**: Frontend sends request to `NEXT_PUBLIC_API_URL/api/predict`
3. **Authentication**: Bearer token included in Authorization header
4. **Processing**: Backend processes request and returns predictions
5. **Display**: Frontend shows results with confidence and explanations
6. **Feedback**: User can correct predictions via feedback system

## Security

- **Token Storage**: Bearer tokens stored in localStorage
- **HTTPS**: Always use HTTPS in production
- **CORS**: Configure backend to allow your frontend domain
- **Env Variables**: Never commit `.env` files
- **Authentication**: All API calls require valid bearer token

## Troubleshooting

### "Failed to fetch" errors

- Verify backend API is running
- Check `NEXT_PUBLIC_API_URL` is correct
- Ensure CORS is configured on backend
- Check browser console for detailed errors

### Authentication issues

- Clear localStorage: `localStorage.clear()`
- Check token format in backend
- Verify authentication endpoints match better-auth spec

### Build errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Contributing

Contributions welcome! Areas for improvement:
- Enhanced UI/UX features
- Additional visualization options
- Offline support
- Progressive Web App (PWA) features
- Accessibility improvements
- Performance optimizations

## License

MIT

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Verify backend API is running and accessible
4. Check environment variables are set correctly

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [better-auth](https://better-auth.com/) - Authentication
- [Sonner](https://sonner.emilkowal.ski/) - Toast notifications
- [Lucide React](https://lucide.dev/) - Icons

---

**AveronAI Frontend** - Modern UI for AI-powered transaction categorization