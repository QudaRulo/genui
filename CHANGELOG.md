# Changelog

## [0.4.0] - 2026-01-31

### Added

#### CLI 工具
- 新增 `genui` 命令行工具, 支持交互式UI生成
- 支持 `--adapter` 参数选择适配器 (tkinter/ascii)
- 支持 `--version` 查看版本信息
- 交互式适配器选择和连续UI生成

#### Tools API 增强
- 新增 `@register_tool` 装饰器, 简化工具注册流程
- 装饰器自动将函数转换为 LangChain BaseTool
- 支持两种注册方式: 基础API + 装饰器

#### Headless 测试框架
- 新增 `TestAdapter` 用于自动化测试
- 支持模拟用户交互 (click, set_input, select, check, get_output)
- 不依赖真实UI环境, 可在CI/CD中运行
- 新增 5 个端到端测试用例 (基础、计算器、表单、工具集成、装饰器)
- 所有核心测试通过 (20/20)

#### 文档
- 新增快速开始指南 (docs/guides/quick-start.md)
- 包含安装、基本使用、自定义工具和自定义适配器的完整说明
- 更新 README 添加 v0.4 特性和 CLI 使用说明
- 新增 v0.4 设计文档

#### 打包发布
- 支持构建标准 wheel 文件 (genui-0.4.0-py3-none-any.whl)
- 可通过 `pip install` 手动安装到其他项目
- 规范化 pyproject.toml 配置 (添加元数据、分类器、脚本入口点)
- 生成 source distribution (.tar.gz)

### Changed
- 更新版本号从 0.3.0 到 0.4.0
- 更新 `genui/__init__.py` 导出列表, 包含 `TestAdapter` 和 `register_tool`
- 更新 `genui/tools/__init__.py` 导出 `register_tool` 装饰器
- 更新 `genui/adapters/__init__.py` 导出 `TestAdapter`
- `__main__.py` 重构为完整的交互式 CLI 程序

### Improved
- 改进公开 API 结构, 明确区分核心API和内部实现
- 优化测试覆盖率, 新增端到端Headless测试
- 完善错误处理和用户提示

### Fixed
- 修复 `register_tool` 装饰器需要正确使用 LangChain `@tool` 转换函数

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
