# **App Name**: NoCorre

## Core Features:

- Intelligent Shift Control: Streamlined start/finish logic for total 'Shifts' versus active 'Work Sessions' to capture accurate productivity and overhead.
- Live Performance Tracker: Real-time cards displaying elapsed time, productive time, current net profit, and km status while on a shift.
- Automated Profit Engine: Calculates net earnings by subtracting fuel, maintenance (oil, tires), and wear costs based on total gain input.
- AI Productivity Assistant: A feature that acts as a tool to analyze historical sessions and suggest optimal work hours and routes to maximize earnings per hour.
- Unified Analytics Dashboard: Visualizing earnings, expenses, and key KPIs (gain per hour/km) using advanced data visualization components.
- Dynamic Expense Configuration: Global settings for vehicle-specific variables including fuel prices and per-km wear-and-tear coefficients.
- JWT Auth & Persistence: Secure login and registration with automated token interceptors for seamless session persistence against the custom backend API.

## Style Guidelines:

- Primary color: Electric Emerald (#10B981) chosen to evoke financial growth and reliability, contrasting sharply against a dark background.
- Background: Deep Charcoal Slate (#0D1011) to provide a premium, modern dashboard feel suitable for low-light driving conditions.
- Accent: Analogous Lime (#84E1A3) used for high-visibility success states and highlights, roughly 30 degrees left on the hue spectrum from primary.
- Font pairing: 'Space Grotesk' (sans-serif) for technical headlines to give a precision, data-heavy feel, and 'Inter' (sans-serif) for high legibility in UI components and data tables.
- Line-based minimalist icons with slight corner rounding to match the sleek Nubank-inspired UI.
- Bottom-tab-centric navigation for one-handed operation on mobile devices, with modular card-based content structures for easy visual scanning.
- Framer Motion transitions for layout shifts, including subtle upward slides for cards and fade-ins for loading skeletons.