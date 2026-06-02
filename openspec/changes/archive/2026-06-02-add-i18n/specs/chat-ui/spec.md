## 修改需求

### 需求： Chat panel layout

The chat panel SHALL display the model selector at the top and integrate with the sidebar for session management.

#### 场景： Model selector integration
- **当** 用户查看聊天面板
- **那么** 顶部显示模型选择器下拉菜单，显示当前提供商和模型

#### 场景： Sidebar integration
- **当** 用户查看应用
- **那么** 聊天面板左侧显示包含会话列表的侧边栏

### 需求： Message input

The input bar SHALL send messages using the currently selected model.

#### 场景： Send with selected model
- **当** 用户发送消息
- **那么** 消息使用模型选择器中显示的模型进行处理

#### 场景： Model change during generation
- **当** 用户在生成响应时更改模型
- **那么** 更改对下一条消息生效，而不是当前消息

### 需求： UI 文本必须使用翻译键

所有 UI 文本必须使用翻译键，禁止硬编码文本。

#### 场景： 输入框占位符
- **当** 用户查看输入框
- **那么** 占位符文本显示为当前语言的翻译

#### 场景： 按钮文本
- **当** 用户查看按钮
- **那么** 按钮文本显示为当前语言的翻译
