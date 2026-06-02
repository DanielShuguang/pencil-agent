## ADDED Requirements

### Requirement: Connection health check
The system SHALL periodically check LLM API connectivity and display the status.

#### Scenario: Periodic check
- **WHEN** the application is running
- **THEN** the system checks API connectivity every 60 seconds

#### Scenario: Check on demand
- **WHEN** user clicks the connection status indicator
- **THEN** the system immediately checks API connectivity

### Requirement: Connection status display
The system SHALL display connection status with visual indicators.

#### Scenario: Connected state
- **WHEN** the API is reachable
- **THEN** the status bar shows a green indicator with "Connected" text

#### Scenario: Disconnected state
- **WHEN** the API is not reachable
- **THEN** the status bar shows a red indicator with "Disconnected" text

#### Scenario: Checking state
- **WHEN** a connection check is in progress
- **THEN** the status bar shows a yellow indicator with "Checking..." text

### Requirement: Connection check timeout
The system SHALL timeout connection checks after 5 seconds.

#### Scenario: Check timeout
- **WHEN** the API does not respond within 5 seconds
- **THEN** the system marks the connection as disconnected
