## MODIFIED Requirements

### Requirement: Chat panel layout

The chat panel SHALL display the model selector at the top and integrate with the sidebar for session management.

#### Scenario: Model selector integration
- **WHEN** user views the chat panel
- **THEN** a model selector dropdown is displayed at the top, showing current provider and model

#### Scenario: Sidebar integration
- **WHEN** user views the application
- **THEN** a sidebar with session list is displayed on the left side of the chat panel

### Requirement: Message input

The input bar SHALL send messages using the currently selected model.

#### Scenario: Send with selected model
- **WHEN** user sends a message
- **THEN** the message is processed using the model shown in the model selector

#### Scenario: Model change during generation
- **WHEN** user changes the model while a response is being generated
- **THEN** the change takes effect for the next message, not the current one
