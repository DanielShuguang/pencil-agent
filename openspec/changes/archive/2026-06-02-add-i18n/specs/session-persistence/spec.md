## 修改需求

### 需求： Session data persistence

The system SHALL persist session data to localStorage to survive application restarts.

#### 场景： Sessions survive app restart
- **当** 用户关闭并重新打开应用
- **那么** 所有会话元数据（id、标题、模型、时间戳）和消息都被恢复

#### 场景： Messages are persisted
- **当** 新消息添加到任何会话
- **那么** 消息立即保存到 localStorage

### 需求： Session data restoration

The system SHALL restore the last active session on startup.

#### 场景： Restore last active session
- **当** 用户打开应用
- **那么** 上次活跃的会话自动被选中并显示

#### 场景： Handle corrupted data
- **当** localStorage 数据损坏或无效
- **那么** 系统以空状态启动，不会崩溃

### 需求： Storage capacity management

The system SHALL manage localStorage capacity to prevent quota exceeded errors.

#### 场景： Message limit per session
- **当** 会话超过 100 条消息
- **那么** 最旧的消息被移除以保持在限制内

#### 场景： Storage quota exceeded
- **当** localStorage 配额超出
- **那么** 系统移除最旧的会话并显示警告通知

### 需求： 语言偏好持久化

系统必须持久化用户语言偏好设置。

#### 场景： 保存语言偏好
- **当** 用户切换语言
- **那么** 语言偏好立即保存到 electron-store

#### 场景： 恢复语言偏好
- **当** 用户打开应用
- **那么** 系统使用上次保存的语言设置
