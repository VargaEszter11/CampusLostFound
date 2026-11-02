# Session prompts - I worked on more than one device, that's all I could find

## Early exploration & planning

- Explain the current state of this project: what's the task, what are the core domain concepts (identities, value objects, use cases), and what has been built so far?
- Let's implement the approve-and-handover flow: an approved claim and its handover should only let an item be handed over once, and the claimant shouldn't see the reporter's full contact details until the claim is approved.
- Explain what this project is about.

## Project setup & first MVP

- Set up a React + TypeScript + Vite + Tailwind CSS frontend for a campus lost & found app. Model the domain first: Item, Report (lost or found), Claim and Handover.
- Build the first MVP: a form to report a lost or found item (name, category, description, location, date, contact) and a list of open reports. Store everything in localStorage for now.
- Open a report's details in a modal when I click on it in the list.
- Add a mock login screen with a few demo users, so I can test the app from different users' point of view.
- Add a My claims page where I can see the claims I submitted and their status (pending, approved, rejected).

## Backend & database

- Add a Spring Boot (Java 21) backend with PostgreSQL. Manage the schema with Flyway migrations and use JPA for persistence.
- Create the REST APIs for reports, claims and handovers, then switch the frontend from localStorage to the API.
- When I approve a claim, generate a 6-digit handover code, reveal the reporter's and the claimant's contact details to each other, and automatically reject the other pending claims on that report.
- Don't let anyone submit a new claim on a report while an approved claim is waiting for handover, and don't let users claim their own reports.
- Let both parties confirm the handover on the Handovers tab — only the confirmation should close the report.

## Authentication

- Replace the mock login with real authentication: register and log in with email and password, and protect the API with JWT. The server should identify the user from the token, not from a name sent by the client.
- Add Google Sign-In. If a Google account's email matches an existing user, link them instead of creating a duplicate account.
- Keep the demo users (Anna, Bence, Csenge) with the password `demo123`, and add buttons on the login screen that fill in their credentials.
- When the token expires or the API returns 401, log the user out and send them back to the login screen.

## Notifications

- Add in-app notifications: notify the reporter when a claim arrives, notify the claimant when their claim is approved or rejected, and notify both parties when the handover is confirmed.
- Show the notifications behind a bell icon in the header with an unread counter. Clicking a notification should take me to the related tab and report.
- Let me mark notifications as read one by one or all at once, and delete them.

## Search & filters

- Add a free-text search to the Open reports list that searches the item name, description, location and reporter.
- Add All / Lost / Found / My reports filters. All, Lost and Found should only show other people's reports; my own should be under My reports.
- Add filtering by category and by date range (from–to), with a button to clear these filters.
- Prefill the contact field on the report form with my account's email, but keep it editable. The reporter name should always be the logged-in user.

## Design

- Redesign the whole UI: dark monochrome theme with teal accents, with consistent buttons, chips, badges and form fields on every page.

## Core feature requests

- When a handover is in progress on one of my reports, show that status on the report's card in the My reports list.
- When someone submits a claim on my report, show that on the report's card in the list.
- Change the claim button's label depending on report type: "This is mine" for found items, "Found it" for lost items.
- Add field-level validation: the email field should only accept a valid email address, and the phone field should only accept a valid phone number format.
- Restrict the lost/found date field to today or any date in the past.
- Restyle the date picker to match the rest of the app's design system.
- Make error messages consistent in style across the app, and ensure they're in the app's current language (currently always English).
- Fix the tab-reset bug: after logging out and logging in as a different user, the app should always land on the Report tab, not whichever tab the previous user had open.
- Let users delete their own reports.
- Add a trash-can icon below the arrow on report cards, for deleting my own reports.
- Fix the refresh bug: refreshing the page should keep the user on the tab they were viewing, not reset to the main page.
- Create a separate admin page where an admin can see every report ever submitted, including closed ones. Admin users are defined in the `.env` by their email address.

## Code quality

- Fix all ESLint errors and warnings in the frontend.
- Generate TypeScript types for the frontend from the backend's OpenAPI spec, so the API types don't drift from the backend.

## Architecture cleanup

- Do the architecture cleanup pass first, before adding new features.
- Add server-side contact validation for reporterContact and claimantContact — currently only @NotBlank/@Size are enforced; validate the actual format too.

## Running / infrastructure

- I have pgAdmin installed and want to create the database through its GUI — guide me through that.
- Walk me through adding this project to Docker Desktop.
- Seed the database with 10 mock reports.

## LLM category suggestion

- Add an LLM-based category suggestion feature using the DeepSeek API: given the item's name and description, suggest a category; let the reporter accept the suggestion or pick a different one from the dropdown.
- Trigger the category suggestion automatically as the user types, and let them accept it or override it with a manually chosen category.

## Testing

- Write unit tests for the backend. Skip the parts that would call the real third-party API. Mirror the main source folder structure under the test folder.
- Why isn't the `shared` package covered by any tests — was that intentional?
- Add frontend tests too, mirroring the frontend's folder structure the same way the backend tests do.

## Error handling

- Does this app have proper error handling — does it raise distinct, meaningful error types for different failure cases?
- Yes — add a catch-all handler for unexpected exceptions so every error response has a consistent shape.

## Documentation

- Update `docs/mvp.md` (in Hungarian) to document every error type the app handles and every feature that's currently implemented.
- Confirm that the backend and frontend test suites are complete and passing.
- Write a full API reference into the `docs` folder: every endpoint, its request/response shape, and its specification.

## UI refinement — claims & handovers grouping

- On the My claims page, split the list into separate Open and Approved sections.
- Do the same grouping on the Handovers page: split into Pending and Handed-over sections.
- Instead of stacked sections, use tabs for these groups — matching the filter-tab style already used on the Open reports page.

## Admin page

- Create a separate admin page where an admin can see every report ever submitted, including closed ones. Admin users are defined in the `.env` by their email address.
- Add some test reports to the database so I can see them on the admin page.

## Docker

- Dockerize the project for easier setup and start.
