## ADDED Requirements

### Requirement: WorkflowEngine executes DAG workflow
The system SHALL execute workflow as a directed acyclic graph with topological ordering.

#### Scenario: Execute simple sequential workflow
- **WHEN** user executes workflow with Start → Agent → End
- **THEN** system executes nodes in topological order and returns End node output

#### Scenario: Execute workflow with condition branch
- **WHEN** user executes workflow with Condition node
- **THEN** system evaluates condition and follows true/false branch accordingly

#### Scenario: Detect cyclic workflow
- **WHEN** user attempts to execute workflow with cycle
- **THEN** system throws error indicating cycle detected

### Requirement: Engine passes context between nodes
The system SHALL pass output from previous nodes as input to subsequent nodes.

#### Scenario: Agent node receives Start output
- **WHEN** Start node produces initial input
- **THEN** Agent node receives that input as prompt

#### Scenario: Tool node receives Agent output
- **WHEN** Agent node produces text output
- **THEN** Tool node receives that output as parameter

### Requirement: Engine reports execution progress
The system SHALL send progress events during workflow execution.

#### Scenario: Node starts execution
- **WHEN** engine begins executing a node
- **THEN** system sends workflow:progress event with status 'running'

#### Scenario: Node completes execution
- **WHEN** engine finishes executing a node
- **THEN** system sends workflow:progress event with status 'success' and result

#### Scenario: Node execution fails
- **WHEN** node execution throws error
- **THEN** system sends workflow:progress event with status 'error' and error message

### Requirement: Workflow can be saved and loaded
The system SHALL persist workflow definitions as JSON files.

#### Scenario: Save workflow to file
- **WHEN** user clicks save button
- **THEN** system exports workflow definition to JSON file via file dialog

#### Scenario: Load workflow from file
- **WHEN** user clicks load button and selects JSON file
- **THEN** system imports workflow definition and renders on canvas
