# TaskFlow V1 - Backend

TaskFlow V1 is a REST API developed for task management using Node.js and Express. It provides user authentication, task management, and reporting functionality.

User and task data are stored in JSON files. Authentication is handled using JSON Web Tokens (JWT). Valid JWT authentication is required to access task and report endpoints.

In this version, JWT authenticates users, but tasks are not separated by user accounts. All authenticated users share the same task list.

## Live Demo

The TaskFlow frontend is deployed and communicates with this backend API.

- **Live Application:** [TaskFlow - Live Demo](https://taskflowv1-app.netlify.app/)
- **Frontend Repository:** [TaskFlow V1 - Frontend](https://github.com/AhmetKaytan/TaskFlowV1-Frontend)
- **Backend API:** [https://taskflowv1.onrender.com](https://taskflowv1.onrender.com)

## Features

- User registration and login
- JWT-based authentication
- Token revocation through logout
- Task creation, retrieval, updating, and deletion
- Task filtering and searching
- Task reporting and statistics
- JSON-based data storage
- Request logging
- Automated tests using Jest and Supertest

## Technologies

- Node.js
- Express.js
- JSON Web Tokens (JWT)
- Jest
- Supertest
- JSON file storage

## Requirements

- Node.js 18 or later
- npm

## Installation

Clone the repository:

```bash
git clone https://github.com/AhmetKaytan/TaskFlowV1.git
```

Navigate to the project directory:

```bash
cd TaskFlowV1
```

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env` and configure the values for your local environment:

```env
PORT=3000
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=1h
```

Use a long, randomly generated value for `JWT_SECRET`. Never share your actual secret or commit your `.env` file to GitHub.

If `PORT` is not specified, the server uses port `3000` by default.

## Running the Application

Start the server:

```bash
npm start
```

The server runs locally at:

```text
http://localhost:3000
```

If you configure a different port, use that port when sending requests.

## Deployment

The backend API is deployed on **Render**.

- **Hosting Provider:** Render
- **Service:** Web Service
- **Region:** Frankfurt
- **Instance:** Free
- **Production API URL:** https://taskflowv1.onrender.com

### Environment Variables

The following environment variables are configured for the deployed backend:

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret key used to sign JWTs |
| `JWT_EXPIRES_IN` | JWT expiration duration (`1h`) |
| `CLIENT_URL` | Allowed frontend origin for CORS |

Render also provides the `PORT` environment variable for the running service.

The frontend communicates with this API using the `VITE_API_URL` environment variable:

```env
VITE_API_URL=https://taskflowv1.onrender.com
```

The backend CORS configuration allows requests from the deployed frontend origin.

**Deployment Note:** Render Free services may spin down after periods of inactivity. The first request after inactivity may take longer than usual.

## Authentication and JWT

Registration and login endpoints do not require JWT authentication.

### User Registration

```http
POST /auth/register
Content-Type: application/json

{
  "username": "example_user",
  "password": "strong-password",
  "email": "example@example.com"
}
```

The `email` field is optional. Usernames must contain between 3 and 30 characters, and passwords must contain at least 8 characters.

### User Login

```http
POST /auth/login
Content-Type: application/json

{
  "username": "example_user",
  "password": "strong-password"
}
```

The `token` field in a successful login response contains the JWT. The server adds a unique `jti` (JWT ID) to each generated token.

To access protected endpoints, include the token in the Authorization header:

```http
Authorization: Bearer <token>
```

### Logout

To log out, send a valid authentication token:

```http
POST /auth/logout
Authorization: Bearer <token>
```

The logout operation stores the current token's `jti` and expiration time in `src/data/revokedTokens.json`.

Once revoked, the same token is rejected by subsequent protected requests with a `403` response.

Logout only revokes the submitted token. Separate logout requests are required to revoke tokens issued to other devices or sessions.

Expired revocation records are cleaned up when the server starts and subsequently every hour.

The `src/data/revokedTokens.json` file must contain valid JSON. Its initial content is:

```json
{
  "revokedTokens": []
}
```

Some HTTP status codes returned by protected endpoints:

- `401`: The Authorization header is missing.
- `403`: The token is invalid, expired, or revoked.
- `500`: The revoked token list cannot be read.

## API Endpoints

`BASE_URL` refers to the API address. For local development, this is `http://localhost:3000`. For production, use `https://taskflowv1.onrender.com`.

| Method | Endpoint | Description | JWT |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user | Not required |
| `POST` | `/auth/login` | Authenticate and receive a JWT | Not required |
| `POST` | `/auth/logout` | Revoke the submitted JWT | Required |
| `GET` | `/tasks` | List tasks with optional filters | Required |
| `POST` | `/tasks` | Create a task | Required |
| `GET` | `/tasks/search?keyword=...` | Search by title, description, or assignee | Required |
| `GET` | `/tasks/assignee/:name` | List tasks by assignee | Required |
| `GET` | `/tasks/:id` | Retrieve a task by ID | Required |
| `PUT` | `/tasks/:id` | Update a task | Required |
| `DELETE` | `/tasks/:id` | Delete a task | Required |
| `GET` | `/reports/completed` | List completed tasks | Required |
| `GET` | `/reports/pending` | List pending tasks | Required |
| `GET` | `/reports/summary` | Retrieve task statistics | Required |

### Task Filtering

The `GET /tasks` endpoint supports the following query parameters:

- `status`
- `priority`
- `assignee`
- `title`

Multiple filters can be combined in a single request.

Example:

```http
GET /tasks?status=pending&priority=high
```

### Creating and Updating Tasks

The following fields must be provided in `POST /tasks` and `PUT /tasks/:id` requests:

```json
{
  "title": "Complete project documentation",
  "description": "Write installation and usage instructions",
  "assignee": "Example User",
  "status": "pending",
  "priority": "medium",
  "dueDate": "2027-06-15"
}
```

Validation rules:

- `status`: Must be `pending`, `in_progress`, or `completed`.
- `priority`: Must be `low`, `medium`, or `high`.
- `dueDate`: Must be a valid future date in `YYYY-MM-DD` format.
- `title`: Maximum 100 characters.
- `assignee`: Maximum 50 characters.
- `description`: Maximum 500 characters.
- `id`, `createdAt`, and `updatedAt` are managed by the server and must not be included in the request body.

## JSON Data Files

The application stores its data in the following JSON files:

- `src/data/tasks.json`: Stores tasks and the next task ID (`nextId`).
- `src/data/users.json`: Stores users and the next user ID (`nextId`).
- `src/data/revokedTokens.json`: Stores revoked JWT IDs (`jti`) and their expiration times (`expiresAt`).
- `src/data/app.log`: Stores request method and route information.

JSON file storage was intentionally chosen for V1 as part of the project's learning scope.

**Important – Production Data Persistence:**

In a local environment, data stored in JSON files remains available after restarting the server.

However, Render Free services use an ephemeral filesystem unless persistent storage is configured. This means JSON data may be lost when the service restarts, redeploys, or its environment is recreated.

The deployed version is intended for demonstration and testing purposes. It should not be used for permanent data storage.

All authenticated users share the same task list in this version.

## Tests

The project uses Jest and Supertest for automated testing.

Run the tests with:

```bash
npm test
```

**Current Test Status:** All 51 tests across 4 test suites are passing.

## Project Scope

TaskFlow V1 was developed as a learning and portfolio project to practice backend development with Node.js and Express.

The project focuses on REST API design, middleware, JWT authentication, request validation, file-based data management, and automated testing.