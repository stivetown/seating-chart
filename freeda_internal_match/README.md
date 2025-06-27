# Freeda Admin Interface

A beautiful and intuitive admin interface for managing member groups with AI-powered recommendations. Built to handle all the user stories for efficient group management.

## 🌟 Features

### ✅ Completed User Stories

1. **Dashboard Overview** - View total members, ungrouped members, groups, and alerts at a glance
2. **Ungrouped Member Management** - See members without groups and get AI suggestions for placement
3. **AI-Powered Group Suggestions** - Get top 3 best-fit groups for each unassigned member with reasoning
4. **Group Alerts & Monitoring** - Automatic detection of experience/pricing mismatches and imbalances
5. **Group Summary Cards** - Visual cards showing average experience, price tier, categories, and member details
6. **Manual Reassignment** - Drag-and-drop style member reassignment between groups
7. **CSV Import/Export** - Upload member data and export complete group assignments
8. **Beautiful UI** - Modern, responsive design with smooth animations and intuitive navigation

### 📊 Dashboard Features

- **Real-time Statistics**: Total members, ungrouped count, group count, average group size
- **Alert System**: Automatic detection of group imbalances with severity levels
- **Quick Actions**: Fast navigation to key functions
- **Status Overview**: Visual indicators for system health

### 🤖 AI-Powered Matching

- **Smart Suggestions**: Considers experience level, price tier, and category overlap
- **Scoring Algorithm**: 0-100% match scores with detailed reasoning
- **Conflict Detection**: Highlights potential issues before assignment
- **Category Balancing**: Ensures diverse group composition

### 📋 Group Management

- **Visual Group Cards**: Clean, informative display of group statistics
- **Member Details**: Experience levels, price tiers, categories, and notes
- **Expandable Views**: Detailed member lists with management actions
- **Statistics Tracking**: Group size, diversity metrics, last modified dates

### 📁 Import/Export System

- **CSV Upload**: Intelligent parsing with validation and error reporting
- **Template Download**: Sample CSV format for easy data preparation
- **Multiple Export Options**: Full data, group summaries, or archive snapshots
- **Google Sheets Ready**: Structured for future Google Sheets integration

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd freeda_internal_match
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser to `http://localhost:3000`

## 📖 Usage Guide

### 1. Dashboard
- View system overview and statistics
- Quick access to ungrouped members and alerts
- Monitor group health at a glance

### 2. Assign Members
- Review ungrouped members
- Click any member to see AI suggestions
- Choose from recommended groups or create new ones
- View match scores and potential issues

### 3. Groups
- Browse all groups in card format
- Expand cards to see detailed member lists
- Remove members or edit group details
- Monitor group statistics and balance

### 4. Import/Export
- Upload CSV files with member data
- Download sample templates
- Export complete member assignments
- Create timestamped archives

### 5. Alerts
- Review groups with potential issues
- Understand experience and price mismatches
- Take action on flagged groups

## 🎨 Design Philosophy

This interface prioritizes:
- **Speed**: Fast load times and responsive interactions
- **Clarity**: Clean, intuitive design that reduces cognitive load
- **Efficiency**: Workflows that minimize admin fatigue
- **Intelligence**: AI recommendations that save time and improve decisions

## 🔧 Technical Architecture

### Built With
- **React 18** - Modern React with hooks and TypeScript
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first styling for rapid development
- **Lucide React** - Beautiful, consistent icons
- **PapaParse** - Robust CSV parsing and generation
- **Date-fns** - Lightweight date manipulation

### Key Components
- `Dashboard` - Main overview and statistics
- `UngroupedMembers` - Member assignment with AI suggestions
- `GroupCards` - Visual group management interface
- `ImportExport` - Data import/export functionality

### Smart Algorithms
- **Group Matching**: Multi-factor scoring considering experience, price, and categories
- **Alert Detection**: Automatic identification of group imbalances
- **Validation**: Comprehensive data validation with helpful error messages

## 🎯 Future Enhancements

- **Google Sheets Integration**: Real-time sync with Google Sheets
- **Advanced Analytics**: Detailed reporting and trends
- **Bulk Operations**: Multi-select and batch actions
- **Group Templates**: Predefined group structures
- **Mobile App**: Native mobile interface for on-the-go management

## 🤝 Contributing

This admin tool is designed to be maintainable and extensible. Key areas for contribution:
- Additional matching algorithms
- New export formats
- Enhanced visualizations
- Performance optimizations

## 📄 License

Internal tool for Freeda organization.

---

*Built with ❤️ for efficient group management* 