## ADDED Requirements

### Requirement: Create new session

The system SHALL allow users to create new chat sessions.

#### Scenario: Create session via button
- **WHEN** user clicks the "New Session" button in the sidebar
- **THEN** a new session is created with default model settings and added to the session list

#### Scenario: Auto-generate session title
- **WHEN** a new session is created
- **THEN** the session title is set to "New Chat" until the first user message, then derived from the first message (first 30 characters)

### Requirement: Switch between sessions

The system SHALL allow users to switch between multiple sessions.

#### Scenario: Switch session by clicking
- **WHEN** user clicks a session in the sidebar
- **THEN** the chat view switches to display that session's messages

#### Scenario: Preserve unsent input
- **WHEN** user switches sessions with text in the input bar
- **THEN** the input text is preserved per session

### Requirement: Delete session

The system SHALL allow users to delete sessions.

#### Scenario: Delete session via context menu
- **WHEN** user right-clicks a session and selects "Delete"
- **THEN** the session and all its messages are permanently removed

#### Scenario: Cannot delete last session
- **WHEN** user tries to delete the only remaining session
- **THEN** the delete action is disabled or prevented

### Requirement: Session list display

The system SHALL display sessions in a sidebar list with relevant metadata.

#### Scenario: Show session metadata
- **WHEN** the sidebar is visible
- **THEN** each session shows its title, model name, and last updated time

#### Scenario: Sort sessions by recency
- **WHEN** the session list is displayed
- **THEN** sessions are sorted by last updated time (most recent first)

#### Scenario: Active session highlight
- **WHEN** a session is currently active
- **THEN** it is visually highlighted in the sidebar list
