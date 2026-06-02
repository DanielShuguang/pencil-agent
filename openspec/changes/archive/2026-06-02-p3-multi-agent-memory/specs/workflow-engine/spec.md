## MODIFIED Requirements

### Requirement: Node execution

The workflow engine SHALL support parallel execution of independent nodes.

#### Scenario: Parallel node execution
- **WHEN** multiple nodes have no dependencies between them
- **THEN** engine executes them in parallel (up to 3 concurrent)

#### Scenario: Parallel node error handling
- **WHEN** any parallel node fails
- **THEN** engine waits for other parallel nodes to complete, then reports all errors

### Requirement: Multi-Agent node support

The workflow engine SHALL support multi-Agent orchestration nodes.

#### Scenario: Sequential Agent node
- **WHEN** a node is configured as "sequential" type with multiple Agent roles
- **THEN** engine executes Agents in sequence, passing output between them

#### Scenario: Parallel Agent node
- **WHEN** a node is configured as "parallel" type with multiple Agent roles
- **THEN** engine executes Agents in parallel and merges results

#### Scenario: Debate Agent node
- **WHEN** a node is configured as "debate" type with proposer, opposer, judge roles
- **THEN** engine runs debate rounds and returns judge's decision
