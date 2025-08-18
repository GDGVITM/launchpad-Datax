# CyberSec Pro - Decentralized Cybersecurity SaaS Platform


Project Video link :- https://drive.google.com/file/d/1ylMGsPxzA3m2uvcZe3E7GN70wOsWPVh8/view?usp=sharing 

A modern, enterprise-grade frontend for a decentralized cybersecurity platform built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Modern Design**: Clean, minimal UI with enterprise-grade aesthetics
- 📱 **Responsive**: Mobile-first design with collapsible sidebar navigation
- 🔗 **Modular Architecture**: Easy to refactor and swap components
- 🎯 **TypeScript**: Fully typed for better development experience
- 🎨 **Tailwind CSS**: Utility-first styling for rapid development
- ⛓️ **Blockchain Ready**: Built-in hooks for Web3 integration
- 📊 **Dashboard**: Comprehensive security monitoring dashboard
- 📝 **Logs Management**: Advanced log filtering and blockchain verification
- 🚨 **Alert System**: Real-time threat monitoring and alerts

## Color Palette

The application uses a consistent color palette for visual cues:

- **Primary**: `#124e66` - Headers, buttons, navigation
- **Accent**: `#e65870` - Danger actions, critical elements
- **Background**: `#f5f7fa` - Page backgrounds
- **Card**: `#ffffff` - Card backgrounds
- **Critical**: `#e53e3e` - Critical alerts and errors
- **Warning**: `#f6ad55` - Warning states
- **Info**: `#3182ce` - Information states
- **Success**: `#38a169` - Success states
- **Text**: `#212529` - Primary text color

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── logs/              # Logs management page
│   ├── threats/           # Threats & alerts page
│   ├── identity/          # Identity management page
│   ├── audit/             # Audit reports page
│   └── settings/          # Settings page
├── components/            # Reusable components
│   ├── layout/           # Layout components (Sidebar, etc.)
│   ├── dashboard/        # Dashboard-specific components
│   └── logs/             # Logs-specific components
└── hooks/                # Custom hooks for data fetching
    ├── useDashboardData.ts
    └── useLogsData.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Pages Overview

### Dashboard (`/dashboard`)
- **Threat Score Widget**: Real-time security threat assessment
- **Login Attempts Chart**: Visual representation of authentication events
- **Traffic Anomalies**: Network traffic analysis and anomaly detection
- **Blockchain Verification**: Verification status and statistics
- **Alerts List**: Recent security alerts and their status
- **System Metrics**: Key performance indicators

### Logs (`/logs`)
- **Filterable Log Table**: Search and filter system logs
- **Blockchain Verification**: Chain verification status for each log entry
- **Event Types**: Authentication, Data Access, Security Events, etc.
- **Status Indicators**: Success, Info, Warning, Error states
- **Export Functionality**: Download logs for compliance

## Component Architecture

### Modular Design
Each component is designed to be:
- **Self-contained**: Minimal external dependencies
- **Reusable**: Can be easily moved or refactored
- **Typed**: Full TypeScript support
- **Responsive**: Mobile-first design approach

### Data Hooks
All data fetching is abstracted into custom hooks:
- `useDashboardData` - Dashboard metrics and statistics
- `useLogsData` - Log entries with filtering capabilities
- Easy to replace with real API calls

### Styling Approach
- **Utility-first**: Tailwind CSS for rapid development
- **Consistent spacing**: Standardized padding and margins
- **Color system**: Semantic color usage for status and actions
- **No custom CSS**: Everything done through Tailwind utilities

## API Integration Ready

The application is prepared for easy API integration:

### Mock Hooks Structure
```typescript
// Easy to replace with real API calls
export function useThreatData(): ThreatData {
  // Replace with actual API call
  // return apiClient.getThreatData()
}
```

### Blockchain Integration Points
- Wallet connection button in sidebar
- Blockchain verification badges in logs
- Transaction hash links to blockchain explorers
- Verification status indicators

## Responsive Design

The application is fully responsive with:
- **Mobile Navigation**: Hamburger menu for small screens
- **Flexible Grid Layouts**: Adapts to different screen sizes
- **Touch-friendly**: Appropriate button sizes and spacing
- **Semantic HTML**: Proper accessibility support

## Future Enhancements

The modular architecture allows for easy addition of:
- Real-time WebSocket connections
- Advanced charting libraries
- Additional authentication methods
- Extended blockchain integrations
- Custom theming system
- Internationalization (i18n)

## Contributing

1. Follow the established component structure
2. Use TypeScript for all new code
3. Follow Tailwind utility-first principles
4. Ensure mobile responsiveness
5. Add proper TypeScript types for all data structures

## License

This project is part of a cybersecurity SaaS platform development.
