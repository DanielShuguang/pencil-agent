## ADDED Requirements

### Requirement: Node configuration panel displays node settings
The system SHALL display a configuration panel when a node is selected.

#### Scenario: Panel opens on node selection
- **WHEN** user clicks on a node
- **THEN** system displays configuration panel on the right side

#### Scenario: Panel closes on deselection
- **WHEN** user clicks on empty canvas
- **THEN** system closes configuration panel

### Requirement: Agent node configuration form
The system SHALL display Agent-specific configuration fields.

#### Scenario: Configure agent model
- **WHEN** user opens Agent node config
- **THEN** system displays model selector dropdown

#### Scenario: Configure system prompt
- **WHEN** user opens Agent node config
- **THEN** system displays system prompt textarea

#### Scenario: Configure temperature
- **WHEN** user opens Agent node config
- **THEN** system displays temperature slider (0-2)

### Requirement: Tool node configuration form
The system SHALL display Tool-specific configuration fields.

#### Scenario: Configure tool selection
- **WHEN** user opens Tool node config
- **THEN** system displays tool selector dropdown with registered tools

#### Scenario: Configure tool parameters
- **WHEN** user selects a tool
- **THEN** system displays parameter form based on tool's JSON Schema

### Requirement: Condition node configuration form
The system SHALL display Condition-specific configuration fields.

#### Scenario: Configure condition expression
- **WHEN** user opens Condition node config
- **THEN** system displays expression input with syntax hints

### Requirement: Workflow toolbar provides actions
The system SHALL display a toolbar with workflow actions.

#### Scenario: Execute workflow
- **WHEN** user clicks execute button
- **THEN** system validates workflow and starts execution

#### Scenario: Save workflow
- **WHEN** user clicks save button
- **THEN** system opens file save dialog

#### Scenario: Load workflow
- **WHEN** user clicks load button
- **THEN** system opens file open dialog

#### Scenario: Clear canvas
- **WHEN** user clicks clear button
- **THEN** system removes all nodes and edges
