www.petripihla.com

![image](https://github.com/user-attachments/assets/7c0866dd-d2c1-41d5-8a86-0f6e127d5215)


# Terminal Website

A retro-style terminal website that simulates a CRT display effect with interactive commands and games.

## How it Works

The terminal operates through three main layers:

```mermaid
    graph TD
    MC[ModuleManager.js]
    subgraph Modules 
        TM[TerminalModule.js]
        SM[SnakeModule.js]
    end

    subgraph Virtual Character Display Layer
        VT[VirtualTerminal.js<br/><br/> Character Buffer <br/> 80x24 Grid]
    end

    subgraph Rendering Pipeline
        TR[TerminalRenderer.js <br/><br/> renders virtual terminal to canvas]
        CRT[CRTEffect.js <br/><br/> same canvas is used as image for the shader]
    end

    TM --> VT
    SM --> VT
    VT --> TR --> CRT
```


## Features

- Modular architecture for easy extension
- CRT shader effects
- Responsive design (desktop only)

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)
