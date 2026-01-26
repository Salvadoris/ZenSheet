# ZenSheet

[**Live Demo**](https://salvadoris.github.io/ZenSheet/)

ZenSheet is an infinite-canvas note-taking web application that combines the freedom of an infinite whiteboard with the structure of a file system, letting users draw, type, and organize their thoughts.

> **Note**: 🚧 This repository is a work in progress and currently contains the frontend application. Backend implementation is underway.

## Features

- **Infinite Canvas**: Whiteboard with no borders.
- **Hierarchical Organization**: Manage your workspace with a nested folder and note structure in the sidebar.
- **Tools**:
  - **Pen**: Freehand drawing.
  - **Shapes**: Quickly add rectangles, ellipses, and straight lines.
  - **Text**: Place text anywhere on the canvas and format it.

## Frontend Tech Stack

This project is built with:

- **[Angular](https://angular.io/)**
- **[Angular Material UI](https://material.angular.dev/)**
- **[Tailwind CSS](https://tailwindcss.com/)**
- **[DaisyUI](https://daisyui.com/)**
- **[SignalR Client](https://dotnet.microsoft.com/apps/aspnet/signalr)**

## Getting Started

To run the application locally:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Salvadoris/ZenSheet.git
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   ng serve
   ```

4. **Open in Browser**:
   Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Building

To build the project for production:

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.
