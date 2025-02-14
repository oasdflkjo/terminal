# 🖥️ CRT Terminal Emulator

A retro-style terminal emulator that recreates the look and feel of classic CRT displays using modern web technologies.

## 🌟 Features

- Authentic CRT visual effects including:
  - Scanlines
  - Screen curvature
  - Phosphor glow
  - Screen glare
  - Subtle noise and distortion
- Responsive design that maintains correct aspect ratio
- DPI-aware rendering for consistent display across devices
- Monospace font rendering with proper character alignment
- Animated text input with matrix-style effect
- Command history navigation
- Basic terminal commands (help, clear, echo, whois)

## 🏗️ Architecture

The project is built using a modular architecture with clear separation of concerns:

### Core Components

1. **VirtualTerminal.js**
   - Manages the terminal's internal state
   - Handles the character buffer and cursor
   - Controls text animation and scrolling
   - Maintains command history

2. **TerminalRenderer.js**
   - Handles DPI-aware rendering
   - Manages character dimensions and scaling
   - Controls the virtual canvas for text rendering
   - Ensures consistent display across devices

3. **TerminalController.js**
   - Processes user input
   - Manages command execution
   - Handles keyboard events
   - Controls command history navigation

4. **CRTEffect.js**
   - Implements WebGL-based CRT effects
   - Manages screen distortion and scanlines
   - Controls phosphor glow and screen glare
   - Handles real-time animation effects

## 🎨 Rendering Pipeline

1. **Text Buffer**
   - Characters are stored in a 2D buffer
   - Each cell contains character, color, and style information
   - Supports 80x28 character grid

2. **Canvas Rendering**
   - Text is rendered to a virtual canvas
   - DPI scaling is applied for crisp text
   - Monospace font ensures proper alignment

3. **WebGL Post-Processing**
   - Canvas texture is processed with WebGL shaders
   - CRT effects are applied in real-time
   - Final output is displayed with proper scaling

## 🛠️ Technical Details

- Uses WebGL for hardware-accelerated effects
- Implements custom font loading and DPI detection
- Handles window resizing while maintaining aspect ratio
- Supports high-DPI displays
- Uses CSS Grid for responsive layout

## 📝 Todo

- Handle copy/paste functionality
- Implement scrollback buffer
- Add more terminal commands
- Improve mobile device support

## 🚀 Getting Started

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Type 'help' to see available commands

## 💻 Browser Support

Requires a modern browser with WebGL support for full CRT effects.