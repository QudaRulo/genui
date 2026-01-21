# WSL2 GUI 应用配置指南

在 WSL2 中运行 genui 需要配置 X Server 以支持 GUI 应用程序。

## 问题说明

在 WSL2 中直接运行 Tkinter GUI 应用会遇到如下错误：
```
[xcb] Unknown sequence number while appending request
[xcb] Most likely this is a multi-threaded client and XInitThreads has not been called
[xcb] Aborting, sorry about that.
python3: ../../src/xcb_io.c:157: append_pending_request: Assertion `!xcb_xlib_unknown_seq_number' failed.
```

这是因为 WSL2 默认没有图形界面支持。

## 解决方案

### 方案1: 使用 WSLg (推荐, Windows 11)

如果您使用 **Windows 11** 或更新版本的 Windows 10 (Build 19044+), 系统已内置 WSLg 支持。

1. **更新 WSL**:
```bash
wsl --update
wsl --shutdown
# 重新启动WSL
```

2. **验证 WSLg**:
```bash
echo $DISPLAY
# 应该显示类似 :0 或 :1
```

3. **直接运行 genui**:
```bash
uv run python -m genui "创建一个登录界面"
```

### 方案2: 使用 VcXsrv (Windows 10)

1. **下载并安装 VcXsrv**:
   - 访问 https://sourceforge.net/projects/vcxsrv/
   - 下载并安装

2. **启动 XLaunch**:
   - 选择 "Multiple windows"
   - Display number: 0
   - 勾选 "Disable access control"

3. **配置 WSL2**:
```bash
# 在 ~/.bashrc 或 ~/.zshrc 中添加
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
export LIBGL_ALWAYS_INDIRECT=1

# 重新加载配置
source ~/.bashrc
```

4. **测试连接**:
```bash
# 安装测试工具
sudo apt-get update
sudo apt-get install x11-apps

# 测试X Server连接
xclock
# 如果看到时钟窗口, 说明配置成功
```

5. **运行 genui**:
```bash
uv run python -m genui "创建一个计算器"
```

### 方案3: 使用 X410 (商业软件)

1. 从 Microsoft Store 购买并安装 X410

2. 启动 X410 (Windowed Apps 模式)

3. 配置环境变量:
```bash
export DISPLAY=:0
```

4. 运行 genui

## 常见问题

### Q: 显示 "Error: Can't open display"

**A**: X Server 未正确配置或未启动
- 确认 VcXsrv/X410 正在运行
- 检查 DISPLAY 环境变量: `echo $DISPLAY`
- 尝试重启 X Server

### Q: 窗口显示但立即崩溃

**A**: 可能是线程问题
```bash
# 尝试设置环境变量
export LIBGL_ALWAYS_INDIRECT=1
```

### Q: WSLg 不工作

**A**: 
1. 确认 Windows 版本: `ver` (在 cmd 中)
2. 更新 WSL: `wsl --update`
3. 重启 WSL: `wsl --shutdown`

## 调试技巧

### 1. 启用详细日志

```bash
# 设置日志级别为DEBUG
export GENUI_LOG_LEVEL=DEBUG
uv run python -m genui "测试界面"
```

### 2. 检查 X Server 连接

```bash
# 安装xeyes测试工具
sudo apt-get install x11-apps

# 测试X连接
xeyes
```

### 3. 查看环境变量

```bash
printenv | grep DISPLAY
printenv | grep GENUI
```

## 性能优化

### 减少延迟

```bash
# 在 ~/.bashrc 中添加
export LIBGL_ALWAYS_SOFTWARE=1  # 使用软件渲染
```

### 防火墙设置 (VcXsrv)

如果使用 VcXsrv, 需要允许通过 Windows 防火墙:
1. 打开 Windows Defender 防火墙
2. 允许 VcXsrv 通过专用和公用网络

## 替代方案

如果 GUI 始终有问题, 可以考虑:

1. **在 Windows 原生环境运行**:
   - 安装 Python 3.11+
   - 使用 uv 或 pip 安装 genui
   - 在 PowerShell/CMD 中运行

2. **使用 Docker Desktop**:
   - 支持 X11 转发
   - 更好的隔离性

3. **使用远程开发**:
   - VS Code Remote - WSL 扩展
   - 在 Windows 侧显示 GUI

## 推荐配置 (WSL2)

在 `~/.bashrc` 或 `~/.zshrc` 中添加:

```bash
# X Server 配置 (根据您的方案选择)
if grep -q microsoft /proc/version; then
    # WSL2 环境
    export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
    export LIBGL_ALWAYS_INDIRECT=1
fi

# genui 日志配置
export GENUI_LOG_LEVEL=INFO  # 或 DEBUG 用于调试
```

## 参考资源

- [WSLg 文档](https://github.com/microsoft/wslg)
- [VcXsrv 使用指南](https://sourceforge.net/projects/vcxsrv/)
- [WSL GUI 应用支持](https://docs.microsoft.com/zh-cn/windows/wsl/tutorials/gui-apps)
