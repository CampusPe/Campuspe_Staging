# CampusPe Development Guide - Optimized for Fast Loading 🚀

## Quick Start (Optimized)

### Option 1: Use the Optimization Script (Recommended)

```bash
./optimize-dev.sh
```

### Option 2: Manual Setup

```bash
# Install dependencies
npm run setup

# Start both frontend and backend with optimizations
npm run dev:fast
```

## Performance Optimizations Applied

### 1. Next.js Optimizations

- ✅ Turbo mode enabled for faster development builds
- ✅ SWC minification enabled
- ✅ Image optimization with WebP/AVIF support
- ✅ CSS optimization enabled
- ✅ Console removal in production
- ✅ Memory optimization (8GB allocation)

### 2. Development Server Optimizations

- ✅ Cache clearing on startup
- ✅ Telemetry disabled for faster startup
- ✅ Concurrent server startup with colored output
- ✅ Automatic server restart on failure

### 3. CSS & Performance Optimizations

- ✅ GPU acceleration for animations
- ✅ Content visibility for images
- ✅ Reduced motion support
- ✅ Loading skeletons for better UX

## Servers & Ports

- **Frontend (Next.js)**: http://localhost:3000
- **Backend (Express)**: http://localhost:5000 (or check API config)

## New Home Page Features

The home page has been completely redesigned to match the provided design with:

### ✨ Hero Section

- Modern gradient background
- Professional imagery with floating stats
- Clear call-to-action buttons
- Responsive design

### 📚 Featured Courses Section

- Course cards with ratings and pricing
- Interactive hover effects
- "Browse all courses" functionality

### 🎓 Student Section

- Step-by-step guidance
- Professional imagery
- Certificate and community highlights

### 🏢 Employer Section

- Talent hiring features
- Feature grid with icons
- Professional team imagery

### 💼 College Placement Section

- 100% digital placement process
- Floating feature cards
- Automation highlights

### ❓ FAQ Section

- Interactive question cards
- Support contact options
- Customer testimonials

### 🎯 Call-to-Action Section

- Multiple user type buttons
- Statistics display
- Professional design

## Performance Tips

1. **First Run**: Use `./optimize-dev.sh` for best performance
2. **Subsequent Runs**: Use `npm run dev:fast`
3. **Clean Install**: Use `npm run fresh-install` if having issues
4. **Memory Issues**: The script sets 8GB memory limit automatically

## Troubleshooting

### Slow Loading?

1. Clear browser cache
2. Run `npm run fresh-install`
3. Use the optimization script

### Port Conflicts?

- Frontend: Change port in `apps/web/package.json`
- Backend: Check `apps/api/src/app.ts` for port configuration

### Image Issues?

- Images are stored in `apps/web/images/`
- Using Next.js Image component for optimization
- Supports WebP and AVIF formats

## File Structure

```
├── apps/
│   ├── web/           # Next.js Frontend (Port 3000)
│   │   ├── pages/     # Page components
│   │   ├── components/# Reusable components
│   │   ├── images/    # Optimized images
│   │   └── styles/    # Global styles
│   └── api/           # Express Backend (Port 5000)
├── optimize-dev.sh    # Development optimization script
└── package.json       # Root package with dev scripts
```

## Contributing

1. Always use the optimization script for development
2. Test on localhost:3000 before committing
3. Ensure images are properly optimized
4. Follow the responsive design patterns

---

**Ready to develop? Run `./optimize-dev.sh` and visit http://localhost:3000** 🎉
