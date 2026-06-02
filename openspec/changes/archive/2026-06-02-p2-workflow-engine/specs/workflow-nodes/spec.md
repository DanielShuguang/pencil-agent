## ADDED Requirements

### Requirement: Start node represents workflow entry
The system SHALL provide a Start node as the workflow entry point.

#### Scenario: Start node has no input ports
- **WHEN** Start node is rendered
- **THEN** node displays only output port

#### Scenario: Start node accepts initial input configuration
- **WHEN** user configures Start node
- **THEN** system allows setting initial input variables

### Requirement: End node represents workflow exit
The system SHALL provide an End node as the workflow exit point.

#### Scenario: End node has no output ports
- **WHEN** End node is rendered
- **THEN** node displays only input port

#### Scenario: End node outputs final result
- **WHEN** workflow execution reaches End node
- **THEN** system returns End node's input as workflow output

### Requirement: Agent node invokes LLM
The system SHALL provide an Agent node that calls an LLM agent.

#### Scenario: Agent node has input and output ports
- **WHEN** Agent node is rendered
- **THEN** node displays input port (prompt) and output port (response)

#### Scenario: Agent node executes with configured model
- **WHEN** workflow executes Agent node
- **THEN** system creates agent session with configured model and systemPrompt, sends input as prompt

#### Scenario: Agent node streams response
- **WHEN** Agent node is executing
- **THEN** system streams response chunks to node output

### Requirement: Tool node invokes tool
The system SHALL provide a Tool node that calls a registered tool.

#### Scenario: Tool node has input and output ports
- **WHEN** Tool node is rendered
- **THEN** node displays input port (parameters) and output port (result)

#### Scenario: Tool node executes configured tool
- **WHEN** workflow executes Tool node
- **THEN** system calls configured tool with input parameters and returns result

### Requirement: Condition node evaluates expression
The system SHALL provide a Condition node for conditional branching.

#### Scenario: Condition node has one input and two output ports
- **WHEN** Condition node is rendered
- **THEN** node displays input port and two output ports (true/false)

#### Scenario: Condition evaluates to true branch
- **WHEN** condition expression evaluates to truthy
- **THEN** system routes input to true output port

#### Scenario: Condition evaluates to false branch
- **WHEN** condition expression evaluates to falsy
- **THEN** system routes input to false output port

### Requirement: Node displays execution status
The system SHALL visually indicate node execution status.

#### Scenario: Node shows pending status
- **WHEN** node is waiting to execute
- **THEN** node displays gray border

#### Scenario: Node shows running status
- **WHEN** node is currently executing
- **THEN** node displays blue border with animation

#### Scenario: Node shows success status
- **WHEN** node execution completes successfully
- **THEN** node displays green border

#### Scenario: Node shows error status
- **WHEN** node execution fails
- **THEN** node displays red border with error indicator
