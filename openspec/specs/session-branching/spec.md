## ADDED Requirements

### Requirement: Branch from message

The system SHALL allow users to create a branch from any message in a session.

#### Scenario: Branch from assistant message
- **WHEN** user right-clicks an assistant message and selects "Branch from here"
- **THEN** system creates a new session branch starting from that message

#### Scenario: Branch preserves history
- **WHEN** a branch is created
- **THEN** the branch shares all messages before the branch point with the original session

### Requirement: Switch between branches

The system SHALL allow users to switch between different branches of a session.

#### Scenario: View branch list
- **WHEN** user clicks the branch indicator in the chat header
- **THEN** system shows a dropdown with all branches for the current session

#### Scenario: Switch to another branch
- **WHEN** user selects a different branch from the dropdown
- **THEN** system switches the chat view to show that branch's messages

### Requirement: Merge branch results

The system SHALL allow users to merge branch results back to the parent session.

#### Scenario: Merge single branch
- **WHEN** user selects "Merge" on a branch
- **THEN** system appends the branch's unique messages to the parent session

#### Scenario: Merge multiple branches
- **WHEN** user selects multiple branches to merge
- **THEN** system creates a summary of all branch results and adds it to the parent session

### Requirement: Branch depth limit

The system SHALL limit branch depth to prevent excessive nesting.

#### Scenario: Max branch depth reached
- **WHEN** user tries to create a branch that exceeds 10 levels deep
- **THEN** system shows a warning and prevents branch creation
