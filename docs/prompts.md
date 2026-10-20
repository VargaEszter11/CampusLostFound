# Session prompts - I worked on more than one device, that's all I could find

## Early exploration & planning

- Explain the current state of this project: what's the task, what are the core domain concepts (identities, value objects, use cases), and what has been built so far?
- Let's implement the approve-and-handover flow: an approved claim and its handover should only let an item be handed over once, and the claimant shouldn't see the reporter's full contact details until the claim is approved.

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
