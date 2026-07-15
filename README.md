# Smart Energy Saving

Welcome to Nokia Summer Practice 2026. This is the project starting point, from which you will start your work.

The app is a web application for managing smart energy devices — users log in, register devices with power-on / power-off schedules and consumption rates, and view a dashboard summarizing energy savings.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Get Started](#get-started)
- [Data Model](#data-model)
- [API Endpoints](#api-endpoints)
- [Frontend](#frontend-1)
- [Tests](#tests-1)
- [Current Status](#current-status)

## Tech Stack

### Backend

- Python 3 ([download](https://www.python.org/downloads/)) ([docs](https://docs.python.org/3/))
- Flask ([docs](https://flask.palletsprojects.com/en/stable/))
- Mongo DB ([download](https://www.mongodb.com/try/download/community))
- MongoEngine (ODM), Flask-JWT-Extended, Flask-CORS, APScheduler, bcrypt

### Frontend

- Node.js - Javascript runtime ([download](https://nodejs.org/en/download))
- React - web framework ([learn](https://react.dev/learn)) ([docs](https://react.dev/reference/react))
- Vite - bundler and build system ([guide](https://vite.dev/guide/))
- Material UI - UI/UX framework ([docs](https://mui.com/material-ui/getting-started/))
- Material React Table (data tables), Recharts (charts), React Router v6

### Tests

- Robot Framework ([docs](https://docs.robotframework.org/))
- RF Browser Library ([docs](https://robotframework-browser.org/))

## Repository Layout

```
summer-practice-2026/
├── backend/
│   ├── Application/
│   │   ├── database/       # MongoEngine models + db init
│   │   ├── routes/         # Flask endpoints (auth, device, users, scheduler)
│   │   ├── scripts/        # Toggle jobs, utils, config.ini
│   │   └── __init__.py     # App factory + APScheduler bootstrap
│   ├── main.py             # Dev entry point
│   ├── wsgi.py             # Production entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/          # Login, Home, Dashboard, Devices, ManageUsers, Profile
│   │   ├── components/     # AddDeviceForm, NavSidebar, PageHeader, DockedDialog
│   │   ├── App.jsx         # Router
│   │   └── main.jsx        # React root
│   ├── vite.config.js      # Proxies /api → localhost:5000
│   └── package.json
├── test/
│   ├── suites/             # Login.robot, Devices.robot
│   └── resources/          # keywords.robot, variables.robot
└── README.md
```

## Get Started

### The Environment

You're encouraged to use the following tools:

- Visual Studio Code ([download](https://code.visualstudio.com/download))
- Robot Code extension ([for VS Code](https://marketplace.visualstudio.com/items?itemName=d-biehl.robotcode))
([for Jetbrains IDEs](https://plugins.jetbrains.com/plugin/26216-robotcode--robot-framework-support)) - this helps with running and debugging tests
- Thunder Client extension for VS Code ([link](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client)) - this helps you to test backend endpoints easier
- Bash or other UNIX type shell (for Windows it's included in the Git package)

These are not mandatory, you can use other tools that you prefer.

### Prerequisites

First, ensure the following are installed on your computer. You only need to do this once.

- Install Git ([download for Windows](https://git-scm.com/install/windows)) <br/>
If you're on Linux, Git is most likely already installed. For Mac OS, install Xcode Command Line Tools to provide Git as well as other developer tools.
- Install Python 3.10 or newer ([download](https://www.python.org/downloads/))
- Install Node.js v22 or newer ([download](https://nodejs.org/en/download))
- Install Mongo DB Community server ([download](https://www.mongodb.com/try/download/community))

### Fork and clone the repo

First, create a fork of this repository into your GitHub account, by either clicking the `Fork` button at the top right corner of the page, or by using the following link:

[Create a fork](https://github.com/RaduTek/summer-practice-2026/fork)

Then, clone this repository using Git into your workspace folder of choice:

```sh
$ git clone https://github.com/[your username here]/summer-practice-2026
```

### Backend

Install backend dependencies (you only need to do this once):

```sh
$ cd backend
$ python -m venv venv
$ source venv/bin/activate # if on Windows: venv/Scripts/activate
$ pip install -r requirements.txt
```

If you're using PowerShell (the default on Windows), run this:

```ps
PS C:\summer-practice-2026\backend> .\venv\Scripts\activate.ps1
```

Start the backend:

```sh
$ flask run --debug

Default development user 'admin' created.
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
 * Running on http://127.0.0.1:5000
```

### Frontend

Install dependencies (you only need to do this once):

```sh
$ npm install
```

Start the frontend:

```sh
$ npm run dev

> frontend@0.0.0 dev
> vite


  VITE v5.2.7  ready in 484 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Tests

Install Robot Framework and Browser Library:

```sh
$ pip install robotframework robotframework-browser
$ rfbrowser init
```

This may take a while, as `rfbrowser init` installs a web browser version dedicated to automated testing. You need Node.js installed for this to work.

### Results

- The backend has started a server on [http://localhost:5000](http://localhost:5000).
- The frontend has started a server on [http://localhost:5173](http://localhost:5173). **Open this in your browser.**
- On application startup, **only if running in development mode** a test user `admin:testuser` will be created. Log in with username `admin` and password `testuser`. If the user already exists, it will not be overwritten.

## Data Model

MongoDB collections, defined in `backend/Application/database/models.py`.

### User

| Field    | Type   | Notes                        |
|----------|--------|------------------------------|
| name     | String | required                     |
| username | String | required, unique             |
| password | String | required, bcrypt-hashed      |
| role     | String | required, `admin` or `user`  |
| site     | String | optional                     |
| group    | String | optional                     |

### Device

| Field                          | Type   | Notes                                  |
|--------------------------------|--------|----------------------------------------|
| deviceName                     | String | required, unique                       |
| deviceSlNo                     | String | serial number                          |
| deviceType                     | String |                                        |
| hwType                         | String |                                        |
| group                          | String | required                               |
| site                           | String |                                        |
| owner                          | String |                                        |
| connectivityType               | String | e.g. `ssh`, `snmp`                     |
| ip / port                      | String |                                        |
| loginUser / password           | String | SSH credentials                        |
| readCommunity / writeCommunity | String | SNMP communities                       |
| powerOnTime / powerOffTime     | String | `HH:MM`                                |
| count                          | Int    | quantity of this device (default 1)    |
| consumptionPerHour             | Float  | kWh per hour                           |

### Saving

Holds a per-device log of daily savings entries.

| Field      | Type              | Notes            |
|------------|-------------------|------------------|
| deviceName | String            | required, unique |
| log        | List[DailySaving] | embedded         |

**DailySaving (embedded):**

| Field       | Type     | Notes             |
|-------------|----------|-------------------|
| subId       | ObjectId | auto-generated    |
| date        | String   | `YYYY-MM-DD`      |
| hoursOff    | Float    | hours powered off |
| energySaved | Float    | kWh saved         |

## API Endpoints

The Flask backend serves at `http://localhost:5000`. The frontend proxies `/api/*` to this origin (see `frontend/vite.config.js`).

| Method | Path        | Auth | Purpose                                    |
|--------|-------------|------|--------------------------------------------|
| POST   | `/login`    | No   | Authenticate; returns JWT + user info      |
| POST   | `/register` | No   | Create a new user (password is bcrypt-hashed) |
| GET    | `/devices`  | JWT  | List all devices                           |
| POST   | `/device`   | JWT  | Add a device                               |
| GET    | `/users`    | JWT  | List all users                             |

Protected routes expect a JWT in the `x-access-token` header (see the `token_required` decorator in `backend/Application/routes/auth.py`). A `scheduler` blueprint is registered but currently has no routes.

## Frontend

`SidebarLayout` + `NavSidebar` wrap all protected pages. Login / role state is kept in `sessionStorage`.

| Route           | Page         | Data source                                                  |
|-----------------|--------------|--------------------------------------------------------------|
| `/`, `/login`   | Login        | `POST /api/login`                                            |
| `/home`         | Home         | Static onboarding cards                                      |
| `/dashboard`    | Dashboard    | **Hardcoded demo data** — 3 stat cards + Recharts area chart |
| `/devices`      | Devices      | `GET /api/devices`, `POST /api/device`                       |
| `/add-device`   | Add Device   | Uses `AddDeviceForm` component                               |
| `/manage-users` | Manage Users | `GET /api/users`, `POST /api/register` — admin only          |
| `/profile`      | Profile      | Placeholder                                                  |

The "Manage Users" nav item is shown only when the stored `role` contains `admin`. Logout clears `sessionStorage` and returns to `/login`.

## Tests

Robot Framework suites live under `test/`. The Browser Library drives a real browser against `http://localhost:5173`.

Default credentials used by the suites (`test/resources/variables.robot`): `admin` / `hunter2` — align these with the dev user (`admin` / `testuser`) before running, or update `variables.robot`.

### `test/suites/Login.robot`

- Login with no credentials — expects error feedback.
- Login with valid credentials — expects successful login.
- Login with invalid credentials — expects error message.
- Login with valid user, invalid password — **not implemented**.
- Login with invalid user, valid password — **not implemented**.

### `test/suites/Devices.robot`

- Add New Device — fills the Add Device form and validates success.
- Edit Device — **not implemented**.
- Remove Device — **not implemented**.

### Running the tests

With the backend and frontend both running:

```sh
$ cd test
$ robot suites/
```

Shared keywords live in `test/resources/keywords.robot`; URLs and default credentials in `test/resources/variables.robot`.

## Current Status

**Working today:**

- Login / logout with JWT and bcrypt-hashed passwords.
- Device listing + creation.
- User listing + creation (admin only).
- APScheduler starts two hourly jobs (`power_off_devices`, `power_on_devices`) on app boot.

**Known gaps:**

- **Dashboard is demo data** — no aggregate endpoints exist yet; the stat cards and chart are hardcoded.
- **Scheduler jobs are stubs** — `backend/Application/scripts/toggle.py` iterates matching devices and only `continue`s, so no `Saving` / `DailySaving` records are ever written.
- **No device edit / remove endpoints** — the row actions in `Devices.jsx` are wired to no-op handlers.
- **`scheduler` blueprint is empty** — reserved but not implemented.
- **Enums are ad hoc** — `site` (Romania / India / Poland) and `group` (group1 / group2) are hardcoded in the frontend form; the backend accepts any string.

**Dev defaults:**

- The admin user `admin` / `testuser` is auto-created on first run in dev mode (see `ensure_default_dev_user` in `backend/Application/scripts/utils.py`).
- Secrets live in `backend/Application/scripts/config.ini` (`MONGO_URL`, `SECRET_KEY`).
