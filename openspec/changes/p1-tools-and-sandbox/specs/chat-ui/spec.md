## MODIFIED Requirements

### Requirement: Display message list
The system SHALL display a list of messages with different styles for user and assistant, including tool call cards.

#### Scenario: User message display
- **WHEN** user sends a message
- **THEN** system displays the message right-aligned with user-specific styling

#### Scenario: Assistant message display
- **WHEN** assistant responds
- **THEN** system displays the message left-aligned with assistant-specific styling

#### Scenario: Tool call display in message
- **WHEN** assistant message contains tool_call chunks
- **THEN** system renders ToolCallCard components inline showing tool name, parameters, and status

#### Scenario: Tool result display
- **WHEN** assistant message contains tool_result chunks
- **THEN** ToolCallCard updates to show result content with syntax highlighting if applicable

## ADDED Requirements

### Requirement: ToolCallCard component displays tool invocation
The system SHALL render tool calls as interactive cards within messages.

#### Scenario: Pending tool call
- **WHEN** tool call chunk arrives with status 'pending'
- **THEN** ToolCallCard shows tool name, parameters, and loading indicator

#### Scenario: Successful tool call
- **WHEN** tool result chunk arrives with status 'success'
- **THEN** ToolCallCard shows result content with success styling

#### Scenario: Failed tool call
- **WHEN** tool result chunk arrives with status 'error'
- **THEN** ToolCallCard shows error message with error styling

### Requirement: CodeBlock component renders code with syntax highlighting
The system SHALL display code content with language-specific syntax highlighting.

#### Scenario: Code block with language
- **WHEN** content contains fenced code block with language specifier
- **THEN** CodeBlock renders with syntax highlighting for that language

#### Scenario: Code block without language
- **WHEN** content contains fenced code block without language
- **THEN** CodeBlock renders with plain text styling

### Requirement: Message list supports tool role messages
The system SHALL display tool result messages with distinct styling.

#### Scenario: Tool role message
- **WHEN** message has role 'tool'
- **THEN** system displays with tool-specific styling (different from user/assistant)
