# Changelog

## [0.3.0] - 2026-01-30

### Added
- **Tools 集成**: 支持在生成的 UI 中调用功能函数
- **两阶段生成**: LLM 先规划 tools, 再生成 UI
- **6 个内置 tools**: calculate, convert_unit, get_weather, get_current_time, read_text_file, list_directory
- **ToolRegistry**: 管理和注册 tools
- **ToolExecutor**: 同步执行 tools
- **LangChain 迁移**: 使用 LangChain 统一 LLM 和 tools 抽象
- 支持自定义 tools 扩展
- 两个示例: 天气查询 UI, 增强计算器

### Changed
- LLMClient 迁移到 LangChain (ChatOpenAI, ChatAnthropic)
- UIGenerator 支持两阶段生成流程
- Renderer 集成 ToolExecutor
- 依赖更新: 移除 openai SDK, 添加 langchain-core 和 langchain-openai

### Technical
- 完整的单元测试覆盖
- 自动化集成测试
- 向后兼容 v0.1 和 v0.2

## [0.1.0] - 2025-01-XX

### Added
- 初始版本
- 基本 UI 组件支持
- OpenAI/Anthropic LLM 集成
- Tkinter 适配器
