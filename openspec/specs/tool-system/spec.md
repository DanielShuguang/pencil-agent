## ADDED Requirements

### Requirement: Tool Registry manages available tools
The system SHALL maintain a registry of available tools that agents can use during conversations.

#### Scenario: List available tools
- **WHEN** renderer requests tool list via `tool:list` IPC
- **THEN** system returns array of tool definitions with name, description, parameters schema

#### Scenario: Tool has valid JSON Schema parameters
- **WHEN** a tool is registered
- **THEN** its parameters MUST conform to JSON Schema specification

### Requirement: Tool calls are displayed in chat UI
The system SHALL render tool invocations as interactive cards within message bubbles.

#### Scenario: Tool call appears in message
- **WHEN** agent sends chunk with `type: 'tool_call'`
- **THEN** a ToolCallCard component renders showing tool name, parameters, and pending status

#### Scenario: Tool result updates the card
- **WHEN** agent sends chunk with `type: 'tool_result'`
- **THEN** the ToolCallCard updates to show success/error status and result content

#### Scenario: Code in tool result is syntax-highlighted
- **WHEN** tool result contains code content
- **THEN** system renders code block with syntax highlighting using CodeBlock component

### Requirement: Built-in tools are pre-registered
The system SHALL include pi-mono's 4 atomic tools (read, write, edit, bash) by default.

#### Scenario: Built-in tools appear in registry
- **WHEN** application starts
- **THEN** tool registry contains read, write, edit, bash tools with correct schemas

### Requirement: Tool execution requires user confirmation for sensitive operations
The system SHALL prompt user before executing potentially dangerous tools.

#### Scenario: Bash execution requires confirmation
- **WHEN** agent attempts to call bash tool
- **THEN** system shows confirmation dialog before allowing execution
