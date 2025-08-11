# 🏟️ Football Fixture Finder

A clean, responsive React application for finding football fixtures by postcode, distance, and division. Perfect for demonstrating UI/UX and core functionality using realistic mock data.

![Football Fixture Finder](https://img.shields.io/badge/React-18.2.0-blue) ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.3.6-blue) ![Vite](https://img.shields.io/badge/Vite-5.0.8-purple)

## ✨ Features

### Core Functionality
- 📍 **Postcode Search** - Enter UK postcodes (e.g., "M1 4BT")
- 📏 **Distance Filter** - Choose from 5, 10, 25, 50, or 100 miles radius
- 🏆 **Division Filter** - Filter by Premier League, Championship, League One, etc.
- 📅 **Date Selection** - Pick specific match days
- ⚡ **Real-time Results** - Instant filtering with distance calculation
- 📱 **Responsive Design** - Clean, modern UI that works on all devices

### UI/UX Features
- 🎨 **Modern Design** - Clean Tailwind CSS styling
- 🃏 **Fixture Cards** - Beautiful card layout showing match details
- 🎯 **Distance Display** - Shows exact distance from your location
- 🏷️ **Division Badges** - Color-coded division indicators
- 📊 **Results Summary** - Clear count of found fixtures
- 🔍 **Smart Search** - Filters combine intelligently

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd football-fixture-finder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - The app will automatically open in your default browser

## 📦 Dependencies

### Core Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0", 
  "lucide-react": "^0.294.0"
}
```

### Development Dependencies
```json
{
  "@vitejs/plugin-react": "^4.2.1",
  "tailwindcss": "^3.3.6",
  "vite": "^5.0.8",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.32"
}
```

## 🗂️ Project Structure

```
football-fixture-finder/
├── public/
├── src/
│   ├── components/
│   │   ├── SearchForm.jsx      # Search filters form
│   │   ├── FixtureCard.jsx     # Individual fixture display
│   │   └── FixtureList.jsx     # Results grid and navigation
│   ├── data/
│   │   └── mockData.js         # Mock fixtures and helper functions
│   ├── App.jsx                 # Main application component
│   ├── main.jsx               # React entry point
│   └── index.css              # Tailwind CSS imports
├── index.html                 # HTML template
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind configuration
├── vite.config.js           # Vite configuration
└── README.md                # Project documentation
```

## 🎮 How to Use

1. **Enter Your Postcode** - Type in a UK postcode (e.g., "M1 4BT")
2. **Set Maximum Distance** - Choose how far you're willing to travel
3. **Select Division** - Pick specific leagues or "All Divisions"
4. **Choose Date** - Select the match day you're interested in
5. **Click "Find Fixtures"** - View results sorted by distance

### Example Postcodes
The app includes mock data for these postcodes:
- `M1 4BT` - Manchester city center
- `SW1A 1AA` - London
- `B1 1AA` - Birmingham  
- `LS1 1AA` - Leeds

## 🏗️ Architecture

### State Management
- Uses React hooks (`useState`, `useEffect`)
- Centralized state in main App component
- Props passed down to child components

### Data Layer
- Mock data simulates real football fixtures
- Realistic UK team names, venues, and postcodes
- Distance calculation using Haversine formula

### Styling
- Tailwind CSS for utility-first styling
- Responsive design with mobile-first approach
- Component-scoped styling patterns

## 🎨 Design System

### Colors
- **Primary**: Green (search buttons, distance badges)
- **Secondary**: Purple/Blue/Yellow (division badges)
- **Neutral**: Gray scale for text and backgrounds

### Components
- **Cards**: Rounded corners, subtle shadows, hover effects
- **Forms**: Clean inputs with focus states
- **Typography**: Clear hierarchy with proper contrast

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 📱 Responsive Breakpoints

- **Mobile**: `< 768px` - Single column layout
- **Tablet**: `768px - 1024px` - Two column grid
- **Desktop**: `> 1024px` - Three column grid

## 🎯 Future Enhancements

- Real API integration
- User geolocation
- Favorite fixtures
- Team logos and colors
- Match notifications
- Social sharing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for demonstration purposes. Feel free to use and modify as needed.

---

**Built with ❤️ using React, Tailwind CSS, and Vite** 