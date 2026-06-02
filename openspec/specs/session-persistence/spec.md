## ADDED Requirements

### Requirement: Session data persistence

The system SHALL persist session data to localStorage to survive application restarts.

#### Scenario: Sessions survive app restart
- **WHEN** user closes and reopens the application
- **THEN** all session metadata (id, title, model, timestamps) and messages are restored

#### Scenario: Messages are persisted
- **WHEN** a new message is added to any session
- **THEN** the message is immediately saved to localStorage

### Requirement: Session data restoration

The system SHALL restore the last active session on startup.

#### Scenario: Restore last active session
- **WHEN** user opens the application
- **THEN** the last active session is automatically selected and displayed

#### Scenario: Handle corrupted data
- **WHEN** localStorage data is corrupted or invalid
- **THEN** the system starts with empty state without crashing

### Requirement: Storage capacity management

The system SHALL manage localStorage capacity to prevent quota exceeded errors.

#### Scenario: Message limit per session
- **WHEN** a session exceeds 100 messages
- **THEN** the oldest messages are removed to stay within limit

#### Scenario: Storage quota exceeded
- **WHEN** localStorage quota is exceeded
- **THEN** the system removes oldest sessions and shows a warning notification

### Requirement: Language preference persistence

The system SHALL persist user language preference settings.

#### Scenario: Save language preference
- **WHEN** user switches language
- **THEN** the language preference is immediately saved to electron-store

#### Scenario: Restore language preference
- **WHEN** user opens the application
- **THEN** the system uses the last saved language setting
