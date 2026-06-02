## MODIFIED Requirements

### Requirement: Session management

The system SHALL support multiple concurrent sessions with independent configurations.

#### Scenario: Create session with model config
- **WHEN** a new session is created
- **THEN** the session is initialized with the selected model configuration

#### Scenario: Independent session state
- **WHEN** user switches between sessions
- **THEN** each session maintains its own message history and model configuration

### Requirement: Session persistence

The system SHALL persist session data across application restarts.

#### Scenario: Save session on change
- **WHEN** session state changes (new message, model change, etc.)
- **THEN** the session data is saved to localStorage

#### Scenario: Load sessions on startup
- **WHEN** the application starts
- **THEN** all saved sessions are loaded and the last active session is restored
