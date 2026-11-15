# TaskFlow Frontend

TaskFlow is a full-stack task management application developed as a learning and portfolio project. This repository contains the **frontend application**, built with React and TypeScript.

The frontend communicates with a separate REST API backend built with Node.js and Express.

The application allows users to manage their tasks, track progress, and view task statistics through a responsive user interface.

## Live Demo

You can access the live application here:

[TaskFlow - Live Demo](https://taskflowv1-app.netlify.app/)

## Related Repository

[TaskFlow Backend](https://github.com/AhmetKaytan/TaskFlowV1)

## Features

### Authentication
- User registration and login.
- JWT-based authentication.
- Protected routes for authenticated users.
- Guest-only routes for login and registration pages.
- Logout functionality.

### Task Management
- Create, read, update, and delete tasks.
- View individual task details.
- Assign tasks to users.
- Set task priorities and due dates.
- Manage task statuses:
  - Pending
  - In Progress
  - Completed
- Search and filter tasks by relevant criteria.

### Reports & Dashboard
- View task statistics.
- Track total, completed, and pending tasks.
- View completed and pending task lists.
- Monitor task completion rates.

### User Interface
- Responsive interface built with Bootstrap.
- Separate layouts for public and authenticated pages.
- Protected navigation and page access.
- Task cards, detail views, and reporting components.

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Bootstrap 5
- Bootstrap Icons

### Backend
- Node.js
- Express.js
- JSON file-based data storage
- JWT authentication
- CORS

### Deployment
- **Backend:** Render
- **Frontend:** Netlify 

## Project Structure

The frontend follows a component-based structure with separate directories for pages, components, services, contexts, interfaces, layouts, and utilities.

```text
src/
├── components/
│   ├── HomePageComponents/
│   └── TasksPageComponents/
├── contexts/
├── interfaces/
├── layouts/
├── pages/
├── services/
├── styles/
├── utils/
├── App.tsx
└── main.tsx
```

### Directory Overview

| Directory | Description |
|---|---|
| `components/` | Reusable UI components |
| `contexts/` | Authentication context and state management |
| `interfaces/` | TypeScript interfaces and response types |
| `layouts/` | Public and private application layouts |
| `pages/` | Application pages |
| `services/` | API communication and HTTP requests |
| `styles/` | Component and page stylesheets |
| `utils/` | Helper functions, including authentication utilities |

## Getting Started

Follow these instructions to run the frontend locally.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm
- Git

### 1. Clone the Repository

```bash
git clone <YOUR_FRONTEND_REPOSITORY_URL>
cd TaskFlow-Frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the frontend project root directory.

**To connect to the deployed backend:**

```env
VITE_API_URL=https://taskflowv1.onrender.com
```

Alternatively, to use a locally running backend:

```env
VITE_API_URL=
```

When the variable is empty, API requests use the local Vite proxy configuration.

**Note:** The local backend must be running on `http://localhost:3000` when using the local proxy.

#### Setting Up the Local Backend

If you prefer to run the backend locally, clone its repository:

```bash
git clone https://github.com/AhmetKaytan/TaskFlowV1.git
cd TaskFlowV1
npm install
```

Create a `.env` file in the backend project root directory.

Example configuration:

```env
PORT=3000
JWT_SECRET=your-strong-random-secret
JWT_EXPIRES_IN=1h
```

Use a secure, randomly generated value for `JWT_SECRET`. Do not share or commit your actual secret.

Start the backend:

```bash
npm start
```

Once the backend is running, return to the frontend project and continue with the next step.

### 4. Start the Development Server

```bash
npm run dev
```

Vite will start the development server. Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Runs TypeScript checks and creates a production build |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint |

To create a production build:

```bash
npm run build
```

The generated files will be available in the `dist/` directory.

## Backend API

The frontend communicates with a separately deployed Express.js backend.

**Production API URL:**

```text
https://taskflowv1.onrender.com
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate a user |
| POST | `/auth/logout` | Log out a user |
| GET | `/tasks` | Retrieve tasks |
| POST | `/tasks` | Create a task |
| GET | `/tasks/:id` | Retrieve task details |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| GET | `/reports/completed` | Retrieve completed tasks |
| GET | `/reports/pending` | Retrieve pending tasks |
| GET | `/reports/summary` | Retrieve task statistics |

Protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <YOUR_TOKEN>
```

## Deployment

The application uses separate hosting services for its frontend and backend.

- **Backend:** Deployed on Render.
- **Frontend:** Deployed on Netlify 

Frontend: https://taskflowv1-app.netlify.app/
Backend: https://taskflowv1.onrender.com

The frontend uses the `VITE_API_URL` environment variable to determine which backend API it communicates with.

For a production frontend deployment, configure the following environment variable in Netlify:

```env
VITE_API_URL=https://taskflowv1.onrender.com
```

The backend must also allow the deployed frontend's origin through its CORS configuration.

## Data Storage

The backend currently uses JSON files for data storage instead of a traditional database.

This approach was intentionally chosen to match the scope and learning objectives of the training project.

**Important:** The backend is hosted on Render's free Web Service plan, which does not provide persistent disk storage. Therefore, data written to the service's local filesystem may be lost when the service restarts or is redeployed.

TaskFlow is intended as a learning and demonstration project, not as a production system for storing important user data.

## Project Goals

This project provided practical experience with:

- Building a React application using TypeScript.
- Designing reusable components and organizing frontend architecture.
- Implementing authentication and protected routes.
- Integrating a frontend with a RESTful API.
- Managing application state with React Context.
- Handling asynchronous requests and API responses.
- Implementing CRUD operations.
- Deploying a full-stack application using cloud hosting services.