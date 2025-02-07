# HabitTracker Application

A comprehensive habit tracking application with admin management, notification systems, and Telegram integration.

## Exporting the Code

There are two main ways to export this code from Replit:

### 1. Using Git

1. Click on the "Version Control" tab in the tools panel (Git icon)
2. Initialize a Git repository if not already done
3. Commit your changes
4. Add your GitHub repository as a remote
5. Push the code to GitHub

### 2. Download as ZIP

1. Click on the three dots menu (...) in the files panel
2. Select "Download as ZIP"
3. The entire project will be downloaded to your computer

## Running Locally

To run this application locally, you'll need:

1. Node.js (version 18 or higher)
2. npm (comes with Node.js)

### Setup Steps

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with:
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

3. Start the development server:
```bash
npm run dev
```

### Important Notes

- The application uses an in-memory database by default
- Make sure to set up your Telegram bot token for notification features
- Default admin credentials:
  - Username: admin
  - Password: admin123

## Features

- User authentication and authorization
- Admin panel with user management
- Habit tracking and statistics
- Telegram integration for notifications
- Real-time habit completion tracking
- Comprehensive admin dashboard

## Tech Stack

- Frontend: React with TypeScript
- Backend: Express.js
- State Management: TanStack Query
- UI Components: shadcn/ui
- Authentication: Passport.js
- Charts: Recharts
