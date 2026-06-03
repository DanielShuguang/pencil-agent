## 1. 更新服务

- [x] 1.1 创建 updater.ts 主进程服务
- [x] 1.2 配置 electron-builder 发布选项
- [x] 1.3 实现检查更新逻辑
- [x] 1.4 实现下载更新逻辑
- [x] 1.5 实现安装更新逻辑

## 2. IPC 通信

- [x] 2.1 添加更新相关类型定义
- [x] 2.2 添加更新 IPC 通道
- [x] 2.3 在 preload 暴露 updaterAPI
- [x] 2.4 更新 global.d.ts 类型

## 3. UI 组件

- [x] 3.1 创建 UpdateDialog 组件
- [x] 3.2 创建 UpdateNotification 组件
- [x] 3.3 在 StatusBar 添加更新通知
- [x] 3.4 在 SettingsDialog 添加更新选项

## 4. 状态管理

- [x] 4.1 创建 update-store
- [x] 4.2 实现更新状态管理
- [x] 4.3 编写 update-store 测试

## 5. 集成与测试

- [x] 5.1 集成到应用启动流程
- [x] 5.2 测试更新流程
- [x] 5.3 处理错误场景
