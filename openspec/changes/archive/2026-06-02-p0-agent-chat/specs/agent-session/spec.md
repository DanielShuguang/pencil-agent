## ADDED Requirements

### Requirement: Create Agent session
The system SHALL create an Agent session with the specified model configuration.

#### Scenario: Successful session creation
- **WHEN** user requests to create a session with model `{ id: 'claude-sonnet-4-20250514', provider: 'anthropic' }`
- **THEN** system creates a new session and returns a unique session ID

#### Scenario: Session creation with invalid model
- **WHEN** user requests to create a session with an unsupported model
- **THEN** system throws an error indicating the model is not supported

### Requirement: Send message to Agent
The system SHALL send a user message to an existing Agent session and receive a streaming response.

#### Scenario: Successful message sending
- **WHEN** user sends a message "你好" to an active session
- **THEN** system forwards the message to the LLM and streams the response back

#### Scenario: Message to non-existent session
- **WHEN** user sends a message to a session ID that does not exist
- **THEN** system throws an error indicating the session was not found

### Requirement: Stream Agent response
The system SHALL stream Agent responses in real-time using AsyncGenerator.

#### Scenario: Streaming text response
- **WHEN** LLM generates a response
- **THEN** system yields `AgentChunk` objects with `type: 'text'` and incremental content

#### Scenario: Streaming completes
- **WHEN** LLM finishes generating
- **THEN** system yields a final chunk and completes the generator

### Requirement: Stop Agent generation
The system SHALL allow stopping an ongoing Agent generation.

#### Scenario: Stop active generation
- **WHEN** user requests to stop generation for an active session
- **THEN** system aborts the LLM request and stops yielding chunks

### Requirement: Destroy Agent session
The system SHALL destroy an Agent session and free resources.

#### Scenario: Destroy active session
- **WHEN** user requests to destroy an active session
- **THEN** system removes the session and releases associated resources
