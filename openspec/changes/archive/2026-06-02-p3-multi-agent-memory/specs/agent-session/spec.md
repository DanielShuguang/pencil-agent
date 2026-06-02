## MODIFIED Requirements

### Requirement: Session creation

The system SHALL support creating sessions with role configurations.

#### Scenario: Create session with role
- **WHEN** user selects a role template when creating a session
- **THEN** system configures the session with the role's system prompt, model, and tool restrictions

#### Scenario: Create session from branch
- **WHEN** user creates a branch from an existing session
- **THEN** system creates a new session sharing history up to the branch point

### Requirement: Session memory integration

The system SHALL integrate with vector memory for context retrieval.

#### Scenario: Auto-recall on new message
- **WHEN** user sends a new message
- **THEN** system searches vector memory for relevant context and includes it in the prompt

#### Scenario: Store conversation on end
- **WHEN** a session ends or user explicitly saves
- **THEN** system stores conversation summary in vector memory
