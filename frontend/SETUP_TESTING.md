# 🚀 Setup & Testing Instructions

## Prerequisites
- Node.js 18+ installed
- Git Bash or PowerShell
- VS Code (recommended)

---

## 🔧 Installation Steps

### 1. Navigate to Frontend Directory
```powershell
cd C:\Users\maths\Documents\InsightFlow-Edu\frontend
```

### 2. Install Dependencies
```powershell
npm install
```
This will install all packages including **Framer Motion** which was added for animations.

**Expected output:**
```
added 1 package, and audited 500 packages in 10s
...
```

### 3. Verify Installation
```powershell
npm list framer-motion
```
Should show: `framer-motion@9.0.0`

---

## 🎬 Running the Application

### Start Development Server
```powershell
npm run dev
```

**Expected output:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Open in Browser
Navigate to: **http://localhost:5173/**

---

## 🧪 Testing Next-Gen Effects

### 1. Homepage (`/`)
**Effects to observe:**
- ✨ **Animated Gradient Background** - Moving purple/cyan blobs in hero section
- ✨ **Magnetic Buttons** - "Get started" button follows cursor on hover
- ✨ **Stagger Animations** - Process steps (1-4) appear sequentially
- ✨ **3D Tilt Cards** - Feature cards rotate based on mouse position
- ✨ **Scroll Reveal** - Section headings fade in when scrolling

**Test steps:**
1. Move mouse over "Get started" button → should follow cursor
2. Scroll down → observe feature cards appearing one by one
3. Hover over feature cards → should tilt in 3D
4. Scroll to bottom CTA → should fade in smoothly

---

### 2. Dashboard (`/dashboard`)
**Effects to observe:**
- ✨ **Animated Counters** - Numbers count up from 0
- ✨ **Stagger KPI Cards** - Cards appear sequentially
- ✨ **Gradient Backgrounds** - Smooth color transitions on cards

**Test steps:**
1. Click "View Demo" on homepage or login
2. Watch KPI cards appear with stagger effect
3. Observe numbers counting from 0 to target values
4. Hover over KPI cards → shadow enlarges

**Expected animations:**
- Total Students: Counts to ~1250
- Flagged Students: Counts to ~87
- Average GPA: Counts to 3.42 with decimals
- Avg Attendance: Counts to 85.5% with suffix

---

### 3. Students List (`/students`)
**Effects to observe:**
- ✨ **3D Tilt Cards** - Student cards rotate on mouse movement
- ✨ **Stagger Grid** - Cards appear one by one
- ✨ **Gradient Badges** - Risk flags with smooth colors

**Test steps:**
1. Navigate to Students page
2. Watch student cards appear sequentially
3. Hover over student cards → should tilt in 3D
4. Move mouse across card → observe rotation following cursor

---

## 🎨 Animation Components Reference

### Components Created:
1. **FadeIn** - Basic fade-in animation
2. **StaggerContainer/StaggerItem** - Sequential animations
3. **TiltCard** - 3D mouse-tracking rotation
4. **AnimatedCounter** - Number counting
5. **MagneticButton** - Cursor-following button
6. **AnimatedGradient** - Moving gradient background
7. **ScrollReveal** - Scroll-triggered animations
8. **ParallaxSection** - Parallax scrolling
9. **GlassCard** - Glassmorphism effect

### Where They're Used:
| Component | HomePage | Dashboard | StudentsList |
|-----------|----------|-----------|--------------|
| FadeIn | ✅ | ✅ | ✅ |
| StaggerContainer | ✅ | ✅ | ✅ |
| TiltCard | ✅ | ❌ | ✅ |
| AnimatedCounter | ❌ | ✅ | ❌ |
| MagneticButton | ✅ | ❌ | ❌ |
| AnimatedGradient | ✅ | ❌ | ❌ |
| ScrollReveal | ✅ | ❌ | ❌ |

---

## 🐛 Troubleshooting

### Issue: `Cannot find module 'framer-motion'`
**Solution:**
```powershell
npm install framer-motion
```

### Issue: TypeScript errors about motion components
**Solution:**
1. Restart TypeScript server in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
2. Check `tsconfig.json` includes `src/**/*`

### Issue: Animations are janky/slow
**Causes:**
- Too many elements animating at once
- Low-end device/browser
**Solutions:**
- Reduce `staggerChildren` delay in StaggerContainer
- Disable animations on mobile: 
```css
@media (max-width: 768px) {
  * { animation: none !important; }
}
```

### Issue: MSW not intercepting API calls
**Check:**
1. `.env` file exists with `VITE_MOCK_MODE=true`
2. Browser console shows: `[MSW] Mocking enabled`
3. `public/mockServiceWorker.js` exists

**Fix:**
```powershell
# Regenerate MSW worker
npx msw init ./public --save
```

---

## 📊 Performance Monitoring

### Check Animation Performance:
1. Open Chrome DevTools (`F12`)
2. Go to **Performance** tab
3. Click Record, interact with page, stop recording
4. Check for dropped frames (green bars should be smooth)

### Target Metrics:
- **FPS:** 60fps (16.6ms per frame)
- **Animation duration:** 0.3-0.6s for micro-interactions
- **Page load:** < 3s

### Optimization Tips:
- Use `will-change` sparingly
- Prefer `transform` and `opacity` over other properties
- Lazy load heavy components
- Reduce motion for `prefers-reduced-motion`

---

## 🎯 Next Steps

### Phase 1: Complete Setup ✅
- [x] Install dependencies
- [x] Start dev server
- [x] Test all animations

### Phase 2: Assets & Polish
- [ ] Add real logo image (`public/logo.png`)
- [ ] Add real hero image (`public/hero.png`)
- [ ] Delete placeholder `.txt` files
- [ ] Test on mobile/tablet breakpoints

### Phase 3: Accessibility
- [ ] Add keyboard navigation
- [ ] Test with screen readers
- [ ] Implement `prefers-reduced-motion`
- [ ] Check color contrast (WCAG AA)

### Phase 4: Additional Effects
- [ ] Add loading skeletons
- [ ] Add toast notifications
- [ ] Add cursor trail (optional)
- [ ] Add micro-interactions (button ripples)

---

## 📂 Project Structure

```
frontend/
├── public/
│   ├── mockServiceWorker.js     # MSW worker
│   ├── logo.png.txt             # Replace with real logo
│   └── hero.png.txt             # Replace with real hero image
├── src/
│   ├── components/
│   │   └── Motion/              # 🆕 All animation components
│   │       ├── FadeIn.tsx
│   │       ├── StaggerContainer.tsx
│   │       ├── TiltCard.tsx
│   │       ├── AnimatedCounter.tsx
│   │       ├── MagneticButton.tsx
│   │       ├── AnimatedGradient.tsx
│   │       ├── ScrollReveal.tsx
│   │       ├── ParallaxSection.tsx
│   │       └── GlassCard.tsx
│   ├── features/
│   │   ├── home/
│   │   │   └── HomePage.tsx     # 🔄 Updated with all effects
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx # 🔄 Updated with counters
│   │   └── students/
│   │       └── StudentsListPage.tsx # 🔄 Updated with tilt cards
│   └── ...
├── .env                         # 🆕 Mock mode configuration
├── package.json                 # 🔄 Added framer-motion
├── tailwind.config.cjs          # 🔄 Updated with navy/mint palette
├── NEXT_GEN_EFFECTS.md          # 🆕 This guide
└── README.md
```

---

## 💡 Pro Tips

### 1. Inspect Animations in DevTools
- Chrome: **Animations** panel shows timeline
- Firefox: **Inspector** → **Animations** tab

### 2. Use React DevTools Profiler
```powershell
npm install -g react-devtools
```
Identify components causing re-renders.

### 3. Test on Real Devices
- Use Chrome Remote Debugging for mobile
- Test on iOS Safari (different rendering engine)
- Check performance on low-end devices

### 4. A11y Testing
- Use browser extensions: axe DevTools, WAVE
- Test keyboard navigation: `Tab`, `Enter`, `Esc`
- Test with screen reader: NVDA (Windows), VoiceOver (Mac)

---

## 📞 Support

**Documentation:**
- Framer Motion: https://www.framer.com/motion/
- Tailwind CSS: https://tailwindcss.com/
- React Query: https://tanstack.com/query/latest

**Debugging:**
- Check browser console for errors
- Review `NEXT_GEN_EFFECTS.md` for component usage
- Test components in isolation first

---

## ✨ Summary

You now have **8 advanced animation components** integrated across your application:

**Homepage:**
- Animated gradient hero background
- Magnetic CTAs
- 3D tilt feature cards
- Stagger animations
- Scroll reveals

**Dashboard:**
- Animated number counters
- Stagger KPI cards
- Gradient backgrounds

**Students List:**
- 3D tilt student cards
- Stagger grid animations
- Smooth transitions

**Run this to start:**
```powershell
cd frontend
npm install
npm run dev
```

**Then open:** http://localhost:5173/

Enjoy your next-gen UI! 🚀

---

**Last Updated:** December 2024  
**Project:** InsightFlow EDU  
**Tech Stack:** React 18 + TypeScript + Vite + Tailwind + Framer Motion
