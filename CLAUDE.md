# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Obsidian plugin project called "mermaid-preview" that provides Mermaid diagram preview functionality with the ability to copy and export images. The project is based on the Obsidian sample plugin template but is intended for implementing Mermaid diagram features.

**Note**: The current codebase contains placeholder sample plugin code and needs to be replaced with Mermaid-specific functionality.

## Development Commands

### Build and Development
- `npm run dev` - Start development mode with file watching and hot reload
- `npm run build` - Production build with TypeScript compilation and bundling
- `npm run version` - Bump version and update manifest.json and versions.json

### TypeScript
- `tsc -noEmit -skipLibCheck` - Type checking (part of build process)

### ESLint (Optional)
- `eslint main.ts` - Lint main TypeScript file
- `eslint .\src\` - Lint all files in src folder (if created)

## Project Architecture

### Core Files
- **main.ts** - Main plugin entry point, currently contains sample plugin code that needs to be replaced with Mermaid functionality
- **manifest.json** - Plugin metadata and configuration
- **styles.css** - Plugin-specific CSS styles
- **esbuild.config.mjs** - Build configuration using esbuild

### Build System
- Uses **esbuild** for fast bundling and compilation
- TypeScript compilation with strict settings (noImplicitAny, strictNullChecks)
- Target: ES6/ES2018 with CommonJS output
- Development mode includes inline source maps and file watching
- Production mode includes minification and tree shaking

### Plugin Structure (Current Template - Needs Replacement)
- Plugin class extends Obsidian's `Plugin` base class
- Settings management with persistent storage
- Command registration system
- Modal and UI components
- Settings tab integration

### Key Dependencies
- **obsidian** - Core Obsidian API
- **typescript** - Type checking and compilation
- **esbuild** - Fast build system
- **@typescript-eslint** - TypeScript linting rules

## Development Setup

1. Install dependencies: `npm i`
2. Start development: `npm run dev`
3. Copy plugin files to `.obsidian/plugins/mermaid-preview/` in your test vault
4. Enable plugin in Obsidian settings
5. Reload Obsidian after code changes

## Release Process

1. Update version in `manifest.json`
2. Run `npm run version` to sync versions
3. Build production version: `npm run build`
4. Create GitHub release with `manifest.json`, `main.js`, and `styles.css`

## Implementation Notes

- The plugin should integrate with Obsidian's markdown rendering system
- Mermaid diagrams are typically rendered from code blocks with `mermaid` language identifier
- Export functionality will likely require canvas or SVG manipulation
- Consider Obsidian's mobile compatibility requirements