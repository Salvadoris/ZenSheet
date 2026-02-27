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

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

[Paper Ship](https://icons8.com/icon/XjQsm2o4LxaW/paper-ship) icon by [Icons8](https://icons8.com)
