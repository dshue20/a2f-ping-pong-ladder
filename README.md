# 🏓 Ping Pong Ladder

A modern, ELO-based ping pong ranking system built with React, TypeScript, and Firebase. Track matches, view player profiles with rating history charts, and maintain a competitive ladder for your office or friend group.

## Features

- 📊 **ELO Rating System** - Sophisticated rating algorithm that emphasizes opponent strength over margin of victory
- 🎯 **Player Profiles** - Detailed stats including rating history charts, win/loss records, and head-to-head matchups
- 📈 **Rating History Charts** - Interactive visualizations showing rating progression over time
- 🔄 **Match Management** - Add, edit, and delete matches with automatic rating recalculation
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🔍 **Advanced Filtering** - Filter match history by player or opponent
- 🏆 **Real-time Updates** - Instant ladder updates after each match
- 📋 **Match History** - Complete history with clickable player names and detailed stats

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: Material-UI (MUI)
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Charts**: Recharts
- **Routing**: React Router

## Prerequisites

- Node.js 16+ and npm
- A Google account for Firebase
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/dshue20/a2f-ping-pong-ladder.git
cd a2f-ping-pong-ladder
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

#### Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "ping-pong-ladder")
4. (Optional) Enable Google Analytics
5. Click "Create project"

#### Enable Firestore Database

1. In your Firebase project, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we'll set up rules next)
4. Select a Firestore location (choose one close to your users)
5. Click "Enable"

#### Set Up Firestore Security Rules

1. In Firestore Database, go to the **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all players and matches
    match /players/{playerId} {
      allow read: if true;
      allow write: if true; // In production, add authentication
    }

    match /matches/{matchId} {
      allow read: if true;
      allow write: if true; // In production, add authentication
    }
  }
}
```

3. Click "Publish"

> **Note**: These rules allow anyone to read and write data. For a production environment, implement Firebase Authentication and restrict write access to authenticated users only.

#### Get Firebase Configuration

1. In your Firebase project, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register your app with a nickname (e.g., "Ping Pong Ladder Web")
6. Click "Register app"
7. Copy the Firebase configuration object

#### Configure Environment Variables

1. Create a `.env` file in the project root (or update the existing one):

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Replace the values with your Firebase configuration from the previous step.

> **Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

### 4. Initialize Your Database (Optional)

You can manually add your first player through the app, or you can seed your database with initial data:

1. Go to Firestore Database in Firebase Console
2. Create a collection called `players`
3. Add a document with these fields:
   - `name` (string): Player's name
   - `rating` (number): 1000
   - `startingRating` (number): 1000
   - `wins` (number): 0
   - `losses` (number): 0
   - `gamesPlayed` (number): 0
   - `streak` (string): ""
   - `createdAt` (timestamp): Click "Insert" and select current timestamp

## Running Locally

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:5173` (or another port if 5173 is in use).

## Building for Production

Build the optimized production bundle:

```bash
npm run build
```

The build output will be in the `dist` folder.

## Deploying to Firebase Hosting

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate with your Google account.

### 3. Initialize Firebase Hosting (if not already done)

```bash
firebase init hosting
```

- Select your Firebase project
- Set public directory to: `dist`
- Configure as single-page app: `Yes`
- Set up automatic builds with GitHub: `No` (or `Yes` if you want)
- Don't overwrite `dist/index.html` if prompted

### 4. Deploy

```bash
npm run build
firebase deploy
```

Your app will be deployed to `https://your-project-id.web.app` and `https://your-project-id.firebaseapp.com`.

## Usage Guide

### Adding Your First Game

1. Click the "Add Game" button on the main ladder page
2. Select or add Player A
3. Select or add Player B
4. Enter the scores
5. Click "Submit Game"

The ladder will automatically update with the new ratings!

### Viewing Player Profiles

Click on any player's name in the ladder or match history to view:

- Current rating and rank
- Win/loss record and win percentage
- Current streak
- Rating history chart
- Complete match history with head-to-head filtering

### Editing or Deleting Matches

- Click the edit icon (✏️) on any match to modify the score
- Click the delete icon (🗑️) to remove a match
- All rating changes are automatically recalculated

### Understanding the ELO System

The ladder uses a modified ELO rating system:

- **Starting Rating**: 1000 points
- **Opponent Strength**: Beating higher-rated players earns more points
- **Margin of Victory**: Blowouts are worth slightly more than close games, but the emphasis is on who you beat
- **Maximum Change**: 20 points per game
- **Games to 11 or 21**: The system automatically scales for different game formats

Example: If a 1000-rated player beats a 1200-rated player 11-9, they gain about 12 points. If a 1200-rated player beats a 1000-rated player 11-9, they only gain about 3 points.

## Customization

### Adjusting ELO Parameters

Edit `src/services/elo.ts` to modify:

- `K` factor (default: 10) - Higher values mean more volatile ratings
- `maxChange` (default: 20) - Maximum points per game
- `targetScore` (default: 21) - Change to 11 for games to 11

### Changing Color Scheme

The app uses Material-UI theming. Edit theme settings in the main app component.

### Adding Authentication

For production use, implement Firebase Authentication:

1. Enable Authentication in Firebase Console
2. Add authentication logic to `src/firebase.ts`
3. Update Firestore security rules to require authentication
4. Add login/signup UI components

## Project Structure

```
a2f-ping-pong-ladder/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── AddGameModal.tsx
│   │   ├── LadderTable.tsx
│   │   ├── MatchHistory.tsx
│   │   ├── PlayerProfile.tsx
│   │   └── PlayerSelect.tsx
│   ├── services/        # Business logic
│   │   ├── elo.ts       # ELO calculation
│   │   ├── submitMatch.ts
│   │   ├── editMatch.ts
│   │   └── deleteMatch.ts
│   ├── firebase.ts      # Firebase configuration
│   ├── types.ts         # TypeScript types
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── .env                 # Environment variables (not in git)
├── firebase.json        # Firebase hosting config
└── package.json         # Dependencies
```

## Troubleshooting

### "Permission denied" errors in Firestore

- Check your Firestore security rules
- Make sure you published the rules after updating them

### Environment variables not loading

- Make sure your `.env` file starts with `VITE_`
- Restart the dev server after changing `.env`
- Verify the file is in the project root directory

### Build fails

- Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Make sure you're using Node 16+: `node --version`

### Firebase deploy fails

- Make sure you're logged in: `firebase login`
- Verify you selected the correct project: `firebase use`
- Check that the build completed successfully

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Open an issue on GitHub
3. Review Firebase and Vite documentation

## Acknowledgments

Built with ❤️ for ping pong enthusiasts everywhere!
