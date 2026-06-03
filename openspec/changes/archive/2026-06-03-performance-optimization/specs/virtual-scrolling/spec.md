## ADDED Requirements

### Requirement: Virtual scrolling for message list
系统 SHALL 使用虚拟滚动技术渲染消息列表，只渲染可见区域的消息。

#### Scenario: Render 1000 messages smoothly
- **WHEN** 用户打开包含 1000 条消息的会话
- **THEN** 消息列表流畅渲染，滚动无卡顿

#### Scenario: Dynamic message height support
- **WHEN** 消息包含不同高度的内容（文本、代码块、工具调用）
- **THEN** 虚拟滚动正确计算和渲染每条消息的高度

#### Scenario: Scroll to bottom on new message
- **WHEN** 用户发送新消息或收到 AI 回复
- **THEN** 消息列表自动滚动到底部

### Requirement: Message height estimation
系统 SHALL 预估消息高度以优化虚拟滚动性能。

#### Scenario: Initial height estimation
- **WHEN** 消息首次进入可视区域
- **THEN** 使用预估高度渲染，避免布局跳动

#### Scenario: Height update after render
- **WHEN** 消息实际渲染完成
- **THEN** 更新高度缓存，优化后续滚动
