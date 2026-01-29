# Taskiant

**Taskiant** is a powerful, local-first Todo application for Windows designed for focus and privacy. Built with a "Midnight" aesthetic, it combines task management with a Pomodoro timer and strict data encryption.

##  Features

- **Local-First & Encrypted**: Your data never leaves your device. Secured with AES-256 encryption via SQLCipher and a Master Password.
- **Integrated Pomodoro Timer**: Stay focused with a built-in timer that tracks your "Pomos" per task.
- **Daily Focus Dashboard**: A clutter-free view of today's priorities, with automatic rollover of unfinished tasks.
- **Hierarchical Management**: Support for subtasks to break down complex projects.
- **Smart Filtering**: Easily toggle between 'Completed', 'Remaining', and 'All' tasks to stay organized.
- **Rich Notes**: Add detailed notes to tasks with a clean, unobtrusive UI (expandable, max 1500 chars).
- **Quick Actions**: Global shortcut (`Ctrl+Alt+A`) to capture ideas instantly from anywhere in Windows.
- **Midnight UI** : A beautiful, deep dark theme designed to reduce eye strain.

##  Tech Stack

- **Electron 34**: For native Windows integration.
- **React 18 + Vite**: For a high-performance, reactive UI.
- **Tailwind CSS**: For modern, consistent styling.
- **Framer Motion**: For smooth, fluid animations.
- **better-sqlite3-multiple-ciphers**: For high-performance, encrypted local storage.

##  Getting Started

### Development
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run electron:dev
   ```

### Building for Windows
To create the standalone `.exe` installer:
```bash
npm run electron:build
```
The installer will be generated in the `release/` directory.

## ⌨️ Keyboard Shortcuts

| Shortcut     | Action                |
| ------------ | --------------------- |
| `Ctrl+Alt+A` | Open Quick Add Window |

##  Author

**Divyansh Pandya**

##  License

MIT
