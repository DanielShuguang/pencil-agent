## ADDED Requirements

### Requirement: Token usage tracking
The system SHALL track token usage from LLM responses and accumulate it per session.

#### Scenario: Token usage from response
- **WHEN** an LLM response chunk contains tokenUsage metadata
- **THEN** the system adds the token counts to the current session total

### Requirement: Token usage reset
The system SHALL reset token usage when switching sessions.

#### Scenario: Session switch resets tokens
- **WHEN** user switches to a different session
- **THEN** the token usage display resets to zero

### Requirement: Token usage display
The system SHALL display the total token count in the status bar.

#### Scenario: Token count shown
- **WHEN** tokens are used in a session
- **THEN** the status bar shows the accumulated token count

### Requirement: Token usage breakdown
The system SHALL provide a detailed breakdown of prompt vs completion tokens.

#### Scenario: Token breakdown available
- **WHEN** user hovers over or clicks the token display
- **THEN** the system shows prompt tokens and completion tokens separately
