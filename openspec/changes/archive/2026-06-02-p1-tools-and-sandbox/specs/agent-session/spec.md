## MODIFIED Requirements

### Requirement: Stream Agent response
The system SHALL stream Agent responses in real-time using AsyncGenerator, including tool call events.

#### Scenario: Streaming text response
- **WHEN** LLM generates a response
- **THEN** system yields `AgentChunk` objects with `type: 'text'` and incremental content

#### Scenario: Streaming tool call
- **WHEN** LLM requests a tool call
- **THEN** system yields `AgentChunk` objects with `type: 'tool_call'`, tool name, and parameters

#### Scenario: Streaming tool result
- **WHEN** tool execution completes
- **THEN** system yields `AgentChunk` objects with `type: 'tool_result'`, result content, and status

#### Scenario: Streaming completes
- **WHEN** LLM finishes generating (all tool calls resolved)
- **THEN** system yields a final chunk and completes the generator

## ADDED Requirements

### Requirement: Agent session tracks tool call state
The system SHALL maintain tool call state for each agent session.

#### Scenario: Tool call pending
- **WHEN** agent initiates tool call
- **THEN** session tracks tool call as 'pending' status

#### Scenario: Tool call success
- **WHEN** tool returns result
- **THEN** session updates tool call to 'success' status with result

#### Scenario: Tool call error
- **WHEN** tool throws error
- **THEN** session updates tool call to 'error' status with error message
