## ADDED Requirements

### Requirement: Workflow canvas renders DAG diagram
The system SHALL display a visual DAG canvas using @xyflow/react for workflow editing.

#### Scenario: Canvas renders with background grid
- **WHEN** user opens workflow view
- **THEN** system displays empty canvas with grid background, minimap, and zoom controls

#### Scenario: Add node to canvas
- **WHEN** user drags node from toolbar or double-clicks canvas
- **THEN** system adds new node at cursor position

#### Scenario: Connect nodes with edge
- **WHEN** user drags from node output port to another node's input port
- **THEN** system creates directed edge between nodes

#### Scenario: Delete node
- **WHEN** user selects node and presses Delete key
- **THEN** system removes node and all connected edges

#### Scenario: Delete edge
- **WHEN** user selects edge and presses Delete key
- **THEN** system removes the edge

### Requirement: Canvas supports zoom and pan
The system SHALL support canvas navigation through zoom and pan.

#### Scenario: Zoom in/out
- **WHEN** user scrolls mouse wheel on canvas
- **THEN** system zooms in/out centered on cursor position

#### Scenario: Pan canvas
- **WHEN** user drags on empty canvas area
- **THEN** system pans the view

#### Scenario: Fit view
- **WHEN** user clicks fit view button
- **THEN** system adjusts zoom to show all nodes

### Requirement: Canvas supports node selection
The system SHALL support selecting nodes for configuration.

#### Scenario: Select single node
- **WHEN** user clicks on a node
- **THEN** system highlights node and opens configuration panel

#### Scenario: Deselect node
- **WHEN** user clicks on empty canvas area
- **THEN** system deselects node and closes configuration panel
