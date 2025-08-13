# CampusPe Localhost Development Setup - COMPLETE ✅

## Summary
Successfully configured CampusPe for localhost development. All API calls that were previously going to `https://campuspe-api-staging.azurewebsites.net` will now go to `http://localhost:5001`.

## Changes Made

### 1. Frontend Configuration (`apps/web/`)
- **Created**: `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:5001`
- **Updated**: `utils/api.ts` to prioritize localhost in development mode
- **Result**: All API calls now use `http://localhost:5001` in development

### 2. Backend Configuration (`apps/api/`)
- **Created**: `.env.local` with:
  - `PORT=5001` (matches existing hardcoded references)
  - `CORS_ORIGIN=http://localhost:3000` (allows frontend)
  - Cloud MongoDB connection (for convenience)
- **Updated**: CORS configuration comments to disable staging endpoints
- **Result**: API server runs on port 5001 and accepts localhost frontend requests

### 3. Environment Priorities
```
Development Mode (.env.local):
├── Frontend: localhost:3000 → Backend: localhost:5001
└── Staging URLs: DISABLED (commented out)

Production Mode (.env.production/.env.azure):
├── Frontend: Azure staging → Backend: Azure staging  
└── Used for Azure deployments
```

### 4. Port Configuration
- **Frontend**: localhost:3000 (Next.js development server)
- **Backend**: localhost:5001 (Express API server)
- **Database**: Cloud MongoDB (shared for convenience)

## Error Resolution
The original error:
```
GET https://campuspe-api-staging.azurewebsites.net/api/jobs net::ERR_NAME_NOT_RESOLVED
```

**Fixed by**:
1. Environment variable override (`NEXT_PUBLIC_API_URL=http://localhost:5001`)
2. Conditional API URL resolution in `utils/api.ts`
3. CORS configuration allowing localhost origin

## Usage Instructions

### Quick Start
```bash
# Start both servers
npm run dev

# Or manually:
# Terminal 1: npm run dev:api  (port 5001)
# Terminal 2: npm run dev:web  (port 3000)
```

### Available Scripts
- `./start-localhost.sh` - Comprehensive startup with checks
- `./test-localhost-config.sh` - Verify configuration
- `npm run dev` - Start both servers
- `npm run dev:api` - Start only API server
- `npm run dev:web` - Start only frontend server

### URLs
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:5001/health
- **API Jobs**: http://localhost:5001/api/jobs

## File Structure
```
CampusPe_Staging/
├── apps/
│   ├── api/
│   │   ├── .env.local          # ✅ NEW - Localhost API config
│   │   └── src/app.ts          # ✅ UPDATED - CORS comments
│   └── web/
│       ├── .env.local          # ✅ NEW - Localhost frontend config
│       └── utils/api.ts        # ✅ UPDATED - Localhost priority
├── start-localhost.sh          # ✅ NEW - Development runner
└── test-localhost-config.sh    # ✅ NEW - Configuration test
```

## Next Steps
1. **Run**: `npm run dev` to start both servers
2. **Open**: http://localhost:3000 in your browser
3. **Test**: Navigate to Jobs page - should load without ERR_NAME_NOT_RESOLVED
4. **Develop**: All API calls now target your local backend

## Reverting to Staging
To use staging URLs again:
1. Delete or rename `.env.local` files
2. The app will fall back to production environment variables
3. Or set `NODE_ENV=production` in your environment

---
**Status**: ✅ COMPLETE - Ready for localhost development
**API Endpoint**: http://localhost:5001 (was: Azure staging)
**Frontend**: http://localhost:3000
