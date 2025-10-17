# Design Guidelines: AI Content Repurposing Tool

## Design Approach

**Reference-Based: Notion + Jasper AI Fusion**

Drawing inspiration from Notion's clean document interface and Jasper AI's intuitive content generation workflow. The design prioritizes:
- **Clarity over decoration**: Every element serves a functional purpose
- **Progressive disclosure**: Show complexity only when needed
- **Workflow optimization**: Minimize friction in the content transformation process
- **Spatial breathing**: Generous whitespace prevents cognitive overload

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: #6366F1 (Indigo) - CTAs, interactive elements, focus states
- Secondary: #10B981 (Emerald) - Success states, completion indicators
- Background: #F9FAFB (Light Grey) - Main canvas
- Surface: #FFFFFF - Cards, modals, elevated content
- Text Primary: #111827 (Dark Grey) - Body text, headings
- Text Secondary: #6B7280 - Labels, helper text
- Accent: #F59E0B (Amber) - Processing states, warnings, highlights
- Success: #059669 (Green) - Confirmations, completed tasks
- Border: #E5E7EB - Dividers, card outlines

**Dark Mode:**
- Primary: #6366F1 (Indigo) - Maintains consistency
- Secondary: #10B981 (Emerald) - Success indicators
- Background: #111827 (Dark Grey) - Main canvas
- Surface: #1F2937 - Cards, elevated surfaces
- Text Primary: #F9FAFB (Light Grey) - Body text, headings
- Text Secondary: #9CA3AF - Labels, helper text
- Accent: #F59E0B (Amber) - Processing highlights
- Success: #059669 (Green) - Confirmations
- Border: #374151 - Subtle dividers

### B. Typography

**Font Stack:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

**Hierarchy:**
- Display/Hero: 2.5rem (40px), font-weight: 700, line-height: 1.2
- H1: 2rem (32px), font-weight: 700, line-height: 1.25
- H2: 1.5rem (24px), font-weight: 600, line-height: 1.3
- H3: 1.25rem (20px), font-weight: 600, line-height: 1.4
- Body Large: 1rem (16px), font-weight: 400, line-height: 1.6
- Body: 0.875rem (14px), font-weight: 400, line-height: 1.6
- Caption: 0.75rem (12px), font-weight: 500, line-height: 1.5
- Labels: 0.875rem (14px), font-weight: 500, uppercase tracking

### C. Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16, 24** for consistent rhythm
- Micro spacing (buttons, inputs): p-2, p-4
- Component spacing (cards, sections): p-6, p-8
- Section spacing: py-12, py-16, py-24
- Grid gaps: gap-4, gap-6, gap-8

**Container Strategy:**
- Main container: max-w-7xl (1280px) with px-4 sm:px-6 lg:px-8
- Content-focused sections: max-w-4xl for optimal readability
- Full-width upload zones: w-full with inner constraints

**Grid Patterns:**
- Two-column layout for upload + preview (lg:grid-cols-2 gap-8)
- Three-card feature display (grid-cols-1 md:grid-cols-3 gap-6)
- Single column for transformation results (max-w-3xl)

### D. Component Library

**Upload Area:**
- Large drag-and-drop zone with dashed border (border-2 border-dashed)
- Background: Subtle primary tint (indigo/50 in light, indigo/900 in dark)
- Icon: Upload cloud icon, size 48px, indigo-400 color
- Primary text: "Drag and drop your file" (text-lg, font-semibold)
- Secondary text: "or paste YouTube/Spotify link" (text-sm, text-gray-500)
- Supported formats badge: Pill-shaped, text-xs, gray-200 background
- Hover state: Border intensifies, slight scale transform
- Active upload: Animated gradient border, pulsing icon

**Input Cards:**
- White surface (dark: gray-800) with subtle shadow (shadow-sm)
- Rounded corners: rounded-xl (12px)
- Padding: p-6
- Border: 1px solid border-gray-200 (dark: border-gray-700)
- Hover: shadow-md transition

**Link Input Field:**
- Full-width input with icon prefix (YouTube/Spotify icon)
- Height: h-12
- Border-radius: rounded-lg
- Focus ring: ring-2 ring-indigo-500
- Placeholder: "Paste YouTube or Spotify link..."

**Progress Indicators:**
- Linear progress bar: h-2, rounded-full, indigo background
- Animated fill with transition-all duration-300
- Percentage text: Adjacent, text-sm, font-medium
- Processing spinner: Indigo-600 color, size 20px for inline, 40px for loading states

**Format Selection:**
- Three cards in horizontal row (grid-cols-1 md:grid-cols-3)
- Each card: Icon, title, description
- Selected state: border-2 border-indigo-500, ring-2 ring-indigo-100
- Unselected: border border-gray-200, hover:border-indigo-300
- Icons: Newsletter (envelope), Social Tutorial (video), Blog Post (document)

**Output Preview:**
- Clean document-like interface mimicking Notion
- Header with format badge and export buttons
- Content area: White background, max-w-prose, generous padding (p-8)
- Timestamp chips: Inline pills with time-400 background, text-xs
- Section dividers: Subtle 1px border-gray-200

**Navigation:**
- Top bar: Logo left, action buttons right
- Height: h-16
- Background: White with border-b (dark: gray-900)
- Logo: Text-xl font-bold or icon, indigo-600 color

**Buttons:**
- Primary: bg-indigo-600, text-white, px-6 py-2.5, rounded-lg, font-medium
- Secondary: border border-gray-300, text-gray-700, bg-white
- Ghost: text-indigo-600, hover:bg-indigo-50
- Icon buttons: p-2, rounded-lg, hover:bg-gray-100
- Disabled: opacity-50, cursor-not-allowed
- Loading state: Spinner inside button, text invisible

**Forms:**
- Label above input: text-sm, font-medium, mb-2
- Input height: h-10 or h-12 for prominent fields
- Error state: border-red-500, text-red-600 helper text
- Success state: border-green-500, check icon

### E. Animations

**Minimal & Purposeful:**
- Transitions: duration-200 for micro-interactions (hover, focus)
- Progress animations: Smooth bar fills, ease-in-out
- Page transitions: Fade-in for content loading (opacity transition)
- Upload feedback: Scale pulse on drop, checkmark on success
- NO gratuitous scroll animations
- NO decorative particle effects

### F. Images

**Hero Section:**
- Full-width hero with gradient overlay (indigo-600 to indigo-900, opacity-90)
- Hero image: Abstract illustration of content transformation (documents flowing into different formats)
- Height: 60vh on desktop, 50vh on tablet, 40vh on mobile
- Overlay content: Centered h1 + subtitle + primary CTA
- Content max-width: max-w-4xl

**Illustration Usage:**
- Upload state: Subtle background pattern or illustration when empty
- Processing state: Animated abstract visualization (optional, very subtle)
- Success state: Checkmark with subtle celebration micro-animation
- Error state: Warning icon with amber accent

**Image Placements:**
- Hero: Full-width with gradient overlay
- Feature cards: Small icons (32px) or illustrations (not photos)
- Empty states: Centered illustration, max-w-xs
- Tutorial section: Screenshot mockups of transformation outputs

## Critical Patterns

**Drag-and-Drop Excellence:**
- Clear visual affordance with dashed borders
- Immediate feedback on hover/drag-over (background color shift)
- Success confirmation with smooth transition to processing state

**Progressive Workflow:**
- Step 1: Upload/Input (prominent)
- Step 2: Format Selection (revealed after upload)
- Step 3: AI Processing (with progress indicator)
- Step 4: Preview/Edit (document interface)
- Step 5: Export (clear CTAs)

**Content-First Philosophy:**
- Output preview takes center stage (largest viewport space)
- Editing tools are contextual, not always visible
- Timestamp navigation on left sidebar (sticky)
- Export options in persistent header

**Responsive Behavior:**
- Mobile: Single column, stacked workflow
- Tablet: Two-column where appropriate (upload + preview)
- Desktop: Full three-column for selection, optimal use of space

This design creates a professional, efficient tool that feels familiar to Notion users while incorporating Jasper AI's content-focused workflow patterns.