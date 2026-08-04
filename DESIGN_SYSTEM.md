# SentinelEdu Design System

**Project**: SentinelEdu - Enterprise IAM & Student Analytics Platform  
**Product Type**: Enterprise B2B SaaS / Analytics Dashboard  
**Style**: Dark Mode (OLED) + Enterprise Gateway  
**Generated**: 2026-08-05

---

## 🎨 Color System

### Semantic Color Tokens (Dark Mode Primary)

```css
:root {
  /* Primary Brand Colors */
  --color-primary: #0F172A;           /* Slate-950 - Primary background */
  --color-primary-hover: #1E293B;     /* Slate-800 */
  --color-primary-light: #334155;     /* Slate-700 */
  
  /* Accent / CTA Colors */
  --color-accent: #0369A1;            /* Sky-700 - Primary CTA */
  --color-accent-hover: #0284C7;      /* Sky-600 */
  --color-accent-light: #075985;      /* Sky-800 */
  --color-accent-muted: #0369A11A;    /* Sky-700 / 10% */
  
  /* Surface Colors */
  --color-surface: #1E293B;           /* Slate-800 - Card backgrounds */
  --color-surface-hover: #334155;     /* Slate-700 */
  --color-surface-elevated: #0F172A;  /* Slate-950 - Modals, dropdowns */
  
  /* Background */
  --color-background: #020617;        /* Slate-950 - Page background */
  --color-background-secondary: #0F172A; /* Slate-900 */
  
  /* Text Colors */
  --color-foreground: #F8FAFC;        /* Slate-50 - Primary text */
  --color-foreground-muted: #94A3B8;  /* Slate-400 - Secondary text */
  --color-foreground-subtle: #64748B; /* Slate-500 - Placeholder text */
  
  /* Border */
  --color-border: #334155;            /* Slate-700 */
  --color-border-light: #475569;      /* Slate-600 */
  
  /* Status Colors */
  --color-success: #22C55E;           /* Green-500 */
  --color-success-bg: #14532E;        /* Green-900 */
  --color-warning: #F59E0B;           /* Amber-500 */
  --color-warning-bg: #78350F;        /* Amber-900 */
  --color-error: #EF4444;             /* Red-500 */
  --color-error-bg: #7F1D1D;          /* Red-900 */
  --color-info: #06B6D4;              /* Cyan-500 */
  --color-info-bg: #164E63;           /* Cyan-900 */
  
  /* Risk Level Colors */
  --color-risk-critical: #EF4444;     /* Red-500 */
  --color-risk-critical-bg: #7F1D1D;  /* Red-900 */
  --color-risk-high: #F97316;         /* Orange-500 */
  --color-risk-high-bg: #7C2D12;      /* Orange-900 */
  --color-risk-medium: #F59E0B;       /* Amber-500 */
  --color-risk-medium-bg: #78350F;    /* Amber-900 */
  --color-risk-low: #22C55E;          /* Green-500 */
  --color-risk-low-bg: #14532E;       /* Green-900 */
  
  /* Focus Ring */
  --color-ring: #0369A1;              /* Sky-700 */
  --color-ring-offset: #0F172A;
  
  /* Shadow System */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3);
  --shadow-glow: 0 0 20px rgb(3 105 161 / 0.3);
  --shadow-glow-accent: 0 0 30px rgb(3 105 161 / 0.4);
}
```

---

## 📝 Typography

### Font Family
```css
--font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale
```css
--text-xs: 0.75rem;      /* 12px - Captions, labels */
--text-sm: 0.875rem;     /* 14px - Body small, form labels */
--text-base: 1rem;       /* 16px - Body text */
--text-lg: 1.125rem;     /* 18px - Body large */
--text-xl: 1.25rem;      /* 20px - Subheadings */
--text-2xl: 1.5rem;      /* 24px - Section headings */
--text-3xl: 1.875rem;    /* 30px - Page titles */
--text-4xl: 2.25rem;     /* 36px - Hero titles */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

---

## 📐 Spacing System

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

---

## 🔲 Border Radius

```css
--radius-none: 0;
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-2xl: 1rem;     /* 16px */
--radius-full: 9999px;
```

---

## ⚡ Animation & Transitions

```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 400ms;

--ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-in: cubic-bezier(0.55, 0.055, 0.675, 0.19);
--ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);

--transition-fast: all var(--duration-fast) var(--ease-out);
--transition-normal: all var(--duration-normal) var(--ease-out);
--transition-slow: all var(--duration-slow) var(--ease-out);
```

---

## 🧩 Component Specifications

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-accent);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  transition: var(--transition-fast);
  min-height: 44px;  /* Touch target */
}

.btn-primary:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-glow-accent);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}

/* Secondary Button */
.btn-secondary {
  background: var(--color-surface);
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: var(--transition-fast);
  min-height: 44px;
}

.btn-secondary:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-light);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--color-foreground-muted);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: var(--transition-fast);
}

.btn-ghost:hover {
  background: var(--color-primary-hover);
  color: var(--color-foreground);
}

/* Destructive Button */
.btn-destructive {
  background: var(--color-error);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  transition: var(--transition-fast);
  min-height: 44px;
}

.btn-destructive:hover {
  background: #DC2626CC;
}

/* Button Sizes */
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); min-height: 36px; }
.btn-lg { padding: var(--space-4) var(--space-8); font-size: var(--text-base); min-height: 48px; }
```

### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  transition: var(--transition-normal);
}

.card:hover {
  border-color: var(--color-border-light);
  box-shadow: var(--shadow-lg);
}

.card-elevated {
  background: var(--color-surface-elevated);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-border);
}

.card-interactive {
  cursor: pointer;
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}
```

### Inputs

```css
.input {
  width: 100%;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-foreground);
  transition: var(--transition-fast);
  min-height: 44px;  /* Touch target */
}

.input::placeholder {
  color: var(--color-foreground-subtle);
}

.input:hover {
  border-color: var(--color-border-light);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-error {
  border-color: var(--color-error);
}

.input-error:focus {
  box-shadow: 0 0 0 3px var(--color-error-bg);
}

.label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-foreground);
  margin-bottom: var(--space-2);
}

.helper-text {
  font-size: var(--text-xs);
  color: var(--color-foreground-muted);
  margin-top: var(--space-1);
}

.error-text {
  font-size: var(--text-xs);
  color: var(--color-error);
  margin-top: var(--space-1);
}
```

### Badges / Status Indicators

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  line-height: 1;
}

.badge-critical {
  background: var(--color-risk-critical-bg);
  color: var(--color-risk-critical);
}

.badge-high {
  background: var(--color-risk-high-bg);
  color: var(--color-risk-high);
}

.badge-medium {
  background: var(--color-risk-medium-bg);
  color: var(--color-risk-medium);
}

.badge-low {
  background: var(--color-risk-low-bg);
  color: var(--color-risk-low);
}

.badge-success {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.badge-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.badge-info {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.badge-neutral {
  background: var(--color-primary-light);
  color: var(--color-foreground-muted);
}
```

### Tables

```css
.table-container {
  overflow-x: auto;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.table th {
  background: var(--color-primary);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font-weight: var(--font-semibold);
  color: var(--color-foreground-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
}

.table td {
  padding: var(--space-3) var(--space-4);
  color: var(--color-foreground);
  border-bottom: 1px solid var(--color-border);
  transition: var(--transition-fast);
}

.table tbody tr {
  background: var(--color-surface);
  transition: var(--transition-fast);
}

.table tbody tr:hover {
  background: var(--color-surface-hover);
}

.table tbody tr:last-child td {
  border-bottom: none;
}
```

### Sidebar Navigation

```css
.sidebar {
  width: 260px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  transition: var(--transition-normal);
}

.sidebar-collapsed {
  width: 72px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  color: var(--color-foreground-muted);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: var(--transition-fast);
  margin: var(--space-1) var(--space-3);
  min-height: 44px;  /* Touch target */
  text-decoration: none;
}

.nav-item:hover {
  background: var(--color-primary-hover);
  color: var(--color-foreground);
}

.nav-item.active {
  background: var(--color-accent-muted);
  color: var(--color-accent);
}

.nav-item.active:hover {
  background: var(--color-accent);
  color: white;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-collapsed .nav-label {
  display: none;
}

.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: var(--space-3);
}
```

### Layout

```css
.page-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-background);
}

.main-content {
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: var(--transition-normal);
}

.main-content-expanded {
  margin-left: 72px;
}

.page-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-6) var(--space-8);
  position: sticky;
  top: 0;
  z-index: 20;
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-foreground);
  margin: 0;
}

.page-subtitle {
  font-size: var(--text-sm);
  color: var(--color-foreground-muted);
  margin: var(--space-1) 0 0 0;
}

.page-content {
  flex: 1;
  padding: var(--space-6) var(--space-8);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
```

---

## 📱 Responsive Breakpoints

```css
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;

/* Mobile sidebar */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content,
  .main-content-expanded {
    margin-left: 0;
  }
  
  .page-content {
    padding: var(--space-4);
  }
  
  .page-header {
    padding: var(--space-4);
  }
}

@media (max-width: 640px) {
  .page-header {
    padding: var(--space-3);
  }
  
  .page-content {
    padding: var(--space-3);
  }
  
  .card {
    border-radius: var(--radius-lg);
  }
}
```

---

## ♿ Accessibility

```css
/* Focus visible for keyboard navigation */
*:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}

/* Skip to main content */
.skip-link {
  position: absolute;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-accent);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  z-index: 100;
  transition: var(--transition-fast);
}

.skip-link:focus {
  top: var(--space-4);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --color-border: var(--color-foreground);
    --color-border-light: var(--color-foreground);
  }
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## 🌗 Light Mode (Optional)

```css
@media (prefers-color-scheme: light) {
  :root {
    --color-primary: #F8FAFC;
    --color-primary-hover: #F1F5F9;
    --color-primary-light: #E2E8F0;
    --color-accent: #0369A1;
    --color-accent-hover: #0284C7;
    --color-accent-light: #075985;
    --color-accent-muted: #E0F2FE;
    --color-surface: #FFFFFF;
    --color-surface-hover: #F8FAFC;
    --color-surface-elevated: #FFFFFF;
    --color-background: #F8FAFC;
    --color-background-secondary: #FFFFFF;
    --color-foreground: #0F172A;
    --color-foreground-muted: #475569;
    --color-foreground-subtle: #94A3B8;
    --color-border: #E2E8F0;
    --color-border-light: #CBD5E1;
    --color-ring: #0369A1;
    --color-ring-offset: #FFFFFF;
  }
}
```

---

## 📋 Implementation Checklist

- [ ] Apply design tokens to `src/index.css`
- [ ] Update `src/components/Layout.tsx` with new sidebar/header
- [ ] Redesign `src/pages/Login.tsx` with new design
- [ ] Redesign `src/components/RiskDashboard.tsx` with new card/chart styles
- [ ] Create reusable component library in `src/components/ui/`
- [ ] Add dark mode toggle with persistence
- [ ] Ensure all touch targets ≥44px
- [ ] Verify focus states on all interactive elements
- [ ] Test reduced motion support
- [ ] Validate color contrast (WCAG AA)
- [ ] Test responsive breakpoints (375px, 768px, 1024px, 1440px)