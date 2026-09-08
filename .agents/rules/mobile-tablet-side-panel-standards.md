# Mobile & Tablet Responsive Navigation & Side Panel Drawer Standards

Universal architectural invariants for responsive mobile and tablet viewports in web applications and portals.

## 1. Drawer vs. Inline Flow
- **Never render navigation sidebars inline in the document flow on mobile/tablet screens (`< lg`)**:
  Setting a sidebar to `w-full` on screens `< md` causes the entire menu to stack directly on top of the page content, pushing hero banners, search bars, and main data views off-screen.
- On viewports `< lg`, navigation sidebars must be hidden from normal flow (`hidden lg:flex`) and rendered as an accessible off-canvas **Slide-Out Side Panel Drawer** (`fixed inset-0 z-50`) with an overlay backdrop (`bg-slate-900/60 backdrop-blur-xs`).

## 2. Complete Portal Feature Exposure in Side Panels
- The side panel drawer must provide comprehensive, first-class access to all portal features:
  - Header: Portal Brand Logo + accessible Close Button (`<X />`).
  - User Profile Card: Name, Avatar, Role badge, Location, Quick stats.
  - Categorized Navigation Items: Crisp icons, bilingual labels (Hindi/English), active route highlights, and dynamic badge counters.
  - Interactive Action Controls: AI Assistant launcher (Krishi AI / Shopping Assistant), Language Selector, Dark Mode toggle, and Role Switcher.
- Selecting any navigation item must immediately navigate to that view, dismiss the side panel drawer, and scroll smoothly to the content canvas.

## 3. Accessible Header Trigger
- Mobile and tablet headers must feature a prominent, easily tappable menu icon (`<Menu className="w-5 h-5" />`, min touch target 44x44px) positioned beside the brand mark for effortless one-tap discovery.
