## ADDED Requirements

### Requirement: Display chat panel
The system SHALL display a chat panel with message list and input bar.

#### Scenario: Chat panel layout
- **WHEN** user opens the application
- **THEN** system displays a chat panel with message area on top and input bar on bottom

### Requirement: Display message list
The system SHALL display a list of messages with different styles for user and assistant.

#### Scenario: User message display
- **WHEN** user sends a message
- **THEN** system displays the message right-aligned with user-specific styling

#### Scenario: Assistant message display
- **WHEN** assistant responds
- **THEN** system displays the message left-aligned with assistant-specific styling

### Requirement: Stream assistant response in real-time
The system SHALL display assistant responses with a typewriter effect as chunks arrive.

#### Scenario: Streaming text display
- **WHEN** assistant chunks arrive via IPC
- **THEN** system appends text to the current assistant message in real-time

### Requirement: Auto-scroll to bottom
The system SHALL automatically scroll to the latest message.

#### Scenario: New message scroll
- **WHEN** a new message is added (user or assistant)
- **THEN** system scrolls the message list to the bottom

### Requirement: Input bar with send functionality
The system SHALL provide an input bar for users to type and send messages.

#### Scenario: Send message with Enter
- **WHEN** user presses Enter in the input bar
- **THEN** system sends the message and clears the input

#### Scenario: New line with Shift+Enter
- **WHEN** user presses Shift+Enter in the input bar
- **THEN** system adds a new line without sending

#### Scenario: Send button click
- **WHEN** user clicks the send button
- **THEN** system sends the message and clears the input

### Requirement: Disable input during generation
The system SHALL disable the input bar while the assistant is generating a response.

#### Scenario: Input disabled during generation
- **WHEN** assistant is generating a response
- **THEN** system disables the input bar and send button

#### Scenario: Input enabled after generation
- **WHEN** assistant finishes generating
- **THEN** system enables the input bar and send button

### Requirement: Stop generation button
The system SHALL provide a button to stop ongoing generation.

#### Scenario: Stop button visible during generation
- **WHEN** assistant is generating a response
- **THEN** system displays a stop button

#### Scenario: Stop button click
- **WHEN** user clicks the stop button
- **THEN** system stops the generation and re-enables the input bar
