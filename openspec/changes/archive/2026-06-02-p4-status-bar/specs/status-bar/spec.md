## ADDED Requirements

### Requirement: StatusBar display
The system SHALL display a status bar at the bottom of the application window showing current model, token usage, connection status, and version.

#### Scenario: StatusBar visibility
- **WHEN** the application starts
- **THEN** the status bar is visible at the bottom of the window

#### Scenario: StatusBar content
- **WHEN** the status bar is displayed
- **THEN** it shows: model name, token usage count, connection status indicator, and version number

### Requirement: Model indicator click
The system SHALL allow users to click the model name in the status bar to open the model selector.

#### Scenario: Click model indicator
- **WHEN** user clicks the model name in the status bar
- **THEN** the model selector dropdown opens

### Requirement: Token indicator click
The system SHALL allow users to click the token usage display to see detailed token breakdown.

#### Scenario: Click token indicator
- **WHEN** user clicks the token usage display
- **THEN** a tooltip shows prompt tokens and completion tokens separately

### Requirement: Connection status click
The system SHALL allow users to click the connection status to trigger a re-check.

#### Scenario: Click connection status
- **WHEN** user clicks the connection status indicator
- **THEN** the system triggers a new connection check and shows loading state

### Requirement: Version display
The system SHALL display the application version from package.json.

#### Scenario: Version shown
- **WHEN** the application starts
- **THEN** the version number is displayed in the status bar
