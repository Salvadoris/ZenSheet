<p align="center">
  <img src="Resources/Zensheet_Icon.png" alt="ZenSheet Logo" width="128">
</p>

<h1 align="center">ZenSheet</h1>

[**Live Demo**](https://salvadoris.github.io/ZenSheet/)

ZenSheet is an infinite-canvas note-taking web application that combines the freedom of an infinite whiteboard with the structure of a file system, letting users draw, type, and organize their thoughts.

> **Note**: 🚧 This repository is a work in progress. The icon is a temporary placeholder.

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

### Local Development

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

### Running with Docker

You can also run the entire stack (Frontend, Backend, and MongoDB) using Docker Compose.

1.  **Set up environment variables**:
    Copy the example environment file (and rename it to `.env`) and adjust the values if needed

2.  **Build and Run**:
    ```bash
    docker compose up --build
    ```

The application will be accessible at the ports specified in your `.env` file (by default, `http://localhost:4200` for the frontend).

## Building

To build the project for production:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.
