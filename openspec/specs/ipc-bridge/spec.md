## ADDED Requirements

### Requirement: Expose agent API via contextBridge
The system SHALL expose agent API to the renderer process via contextBridge.

#### Scenario: API available in renderer
- **WHEN** renderer process accesses `window.api.agent`
- **THEN** system provides an object with `create`, `prompt`, `stop`, `onChunk`, `onDone`, and `onError` methods

### Requirement: Handle agent:create IPC call
The system SHALL handle `agent:create` IPC calls and create an Agent session.

#### Scenario: Successful create call
- **WHEN** renderer sends `agent:create` with valid config
- **THEN** main process creates session and returns session ID via invoke/handle

### Requirement: Handle agent:prompt IPC message
The system SHALL handle `agent:prompt` IPC messages and stream responses back.

#### Scenario: Successful prompt message
- **WHEN** renderer sends `agent:prompt` with session ID and message
- **THEN** main process forwards to Agent and sends `agent:chunk` events for each chunk

#### Scenario: Prompt completion
- **WHEN** Agent finishes generating
- **THEN** main process sends `agent:done` event

#### Scenario: Prompt error
- **WHEN** Agent encounters an error
- **THEN** main process sends `agent:error` event with error message

### Requirement: Handle agent:stop IPC message
The system SHALL handle `agent:stop` IPC messages and stop Agent generation.

#### Scenario: Successful stop
- **WHEN** renderer sends `agent:stop` with session ID
- **THEN** main process aborts the Agent generation

### Requirement: Clean up IPC listeners
The system SHALL provide a cleanup function to remove IPC listeners.

#### Scenario: Cleanup on unmount
- **WHEN** renderer component unmounts
- **THEN** system removes all registered IPC listeners
