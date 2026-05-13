# sub2socks5

一个基于 `Node.js + sing-box` 的本地代理管理器，用于把机场订阅、手动节点和节点组组织成可视化、可多端口分流的 `SOCKS5` 代理服务。

## 当前能力

- 拉取并解析订阅节点
- 支持多订阅地址
  - 多个订阅 URL 顺序拉取
  - 自动合并节点
  - 自动去重
- 支持 `vmess`、`vless`、`trojan`、`shadowsocks`、`hysteria2`、`tuic`
- 支持 Base64、URL Safe Base64、多行订阅文本
- 支持手动导入节点
  - 单行节点链接
  - 多行节点文本
  - 结构化 JSON
  - 带 `raw` 字段的 JSON
- 支持节点管理
  - 订阅节点
  - 手动节点
  - 节点组
  - 固定保留 `direct` 节点
- 支持多个本地 `SOCKS5` 服务
  - 每个端口可绑定不同节点或节点组
- 支持节点组策略
  - `urltest`
  - `fallback`（当前为应用层第一版）
- 支持内核管理
  - 检测系统架构
  - 获取 release 版本列表
  - 设置计划下载版本
  - 拉取匹配架构的 `sing-box` 内核
- 支持 DNS 防泄漏优化
  - 远端 DoH
  - Bootstrap DNS
  - 默认域名解析器单独配置
  - 每个 `SOCKS5` 目标出口绑定各自的 DoH server
- 支持多页面 Web UI
  - 仪表盘、内核、配置、日志、节点页面分离
  - 顶部菜单与侧边菜单统一导航
- 支持中文 / English 界面切换
- 配置页为主要字段提供填写说明
- 支持运行状态与实时日志查看
- 支持保存配置后自动生成 `sing-box` 配置
- 支持运行中自动应用新配置
  - 当前实现方式为自动重启 `sing-box`

## 社区链接
- [LINUX DO](https://linux.do/)

## 项目结构

- `D:\sub2socks5\src\server.js`
  - HTTP 服务入口
  - 提供 Web UI 与后端 API
- `D:\sub2socks5\src\lib\subscription.js`
  - 订阅拉取与节点解析
  - 手动节点原始输入解析
  - 多订阅合并与去重
- `D:\sub2socks5\src\lib\singbox-config.js`
  - 业务配置转换为 `sing-box` 配置
  - 多出口 DNS server 生成
- `D:\sub2socks5\src\lib\singbox-manager.js`
  - `sing-box` 进程控制
- `D:\sub2socks5\src\lib\singbox-release.js`
  - release 获取、版本筛选、下载
- `D:\sub2socks5\src\lib\storage.js`
  - 默认配置与持久化
  - 旧配置兼容迁移
- `D:\sub2socks5\src\public\index.html`
  - 入口页，自动跳转到仪表盘
- `D:\sub2socks5\src\public\layout.js`
  - 共享菜单、侧边栏、语言切换、API helper 与通用渲染逻辑
- `D:\sub2socks5\src\public\dashboard.html`
- `D:\sub2socks5\src\public\dashboard.js`
  - 仪表盘与启动流程
- `D:\sub2socks5\src\public\config.html`
- `D:\sub2socks5\src\public\config.js`
  - Web UI、DNS、订阅地址和 `SOCKS5` 服务配置
- `D:\sub2socks5\src\public\kernel.html`
- `D:\sub2socks5\src\public\kernel.js`
  - `sing-box` 内核检测、版本选择与下载
- `D:\sub2socks5\src\public\logs.html`
- `D:\sub2socks5\src\public\logs.js`
  - 运行日志与生成配置查看
- `D:\sub2socks5\src\public\nodes.html`
- `D:\sub2socks5\src\public\nodes.js`
  - 节点组、链式代理和测速管理
- `D:\sub2socks5\src\public\nodes-edit.html`
- `D:\sub2socks5\src\public\nodes-edit.js`
  - 手动节点导入、启用和删除
- `D:\sub2socks5\src\public\style.css`
  - 页面样式

### 持久化目录

- `D:\sub2socks5\src\data`
  - 业务配置
  - 订阅状态
  - 架构信息
  - 版本列表缓存
  - 计划下载版本
- `D:\sub2socks5\src\runtime`
  - 生成后的 `sing-box.json`
- `D:\sub2socks5\src\bin`
  - 已安装的 `sing-box` 内核

## 工作流程

1. 启动 Web UI
   - `node src/server.js`
2. 在主页保存基础配置
3. 更新订阅，或在节点管理页导入手动节点
4. 配置节点组与多个本地 `SOCKS5` 服务
5. 保存配置后自动生成 `sing-box` 配置
6. 如果 `sing-box` 正在运行，则自动重启应用新配置
7. 不同本地端口分别通过不同节点或节点组提供代理服务

## DNS 策略

当前支持：

- DoH 服务器预设
  - `https://dns.google/dns-query`
  - `https://cloudflare-dns.com/dns-query`
  - 自定义
- DoH 引导解析 DNS 预设
  - `1.1.1.1`
  - `8.8.8.8`
  - `223.5.5.5`
  - 自定义

当前设计目标：

- 尽量减少本机直连 DNS 泄漏
- 主解析使用远端 DoH
- 用 Bootstrap DNS 解析 DoH 域名
- 每个本地 `SOCKS5` 服务的 DNS 请求跟随其目标出口，而不是统一走默认出口

## 节点组说明

### `urltest`

- 使用 `sing-box` 原生 `urltest`
- 支持测试地址预设
  - `https://www.gstatic.com/generate_204`
  - `https://www.google.com/generate_204`
  - `https://cp.cloudflare.com/generate_204`
  - 自定义
- 定时对组内节点进行延迟测试
- 自动选择更优节点转发流量

### `fallback`

- 当前不是 `sing-box` 原生出站类型
- 目前实现为应用层故障转移第一版
- 后端维护当前活跃节点
- 周期性通过探测结果切换可用节点
- 节点管理页可查看当前活跃成员和最近切换时间

## Web UI 页面

### 仪表盘

支持：

- 展示内核、订阅、运行状态、`SOCKS5` 服务和生成配置摘要
- 按流程跳转到内核、节点、配置和启动操作
- 刷新订阅
- 启动 / 停止 `sing-box`
- 显示 VPS 暴露代理端口的安全提醒

### 内核页

支持：

- 检测当前架构
- 检查已安装内核
- 检查版本更新
- 设置计划版本
- 拉取匹配架构的 `sing-box` 内核

### 配置页

支持：

- 保存 Web UI 监听地址、端口、`sing-box` 二进制路径、日志级别和自动启动
- 配置 DoH 服务器与 Bootstrap DNS 预设
- 配置默认路由出口
- 配置多个订阅地址
- 配置多个本地 `SOCKS5` 服务
- 在表单视图与 JSON 视图之间切换
- 为每个主要字段显示填写说明

### 日志页

支持：

- 查看 `sing-box` 实时运行日志
- 查看生成后的 `sing-box` 配置
- 在摘要视图与 JSON / 原始视图之间切换

### 节点页

支持：

- 添加节点组
- 为节点组设置策略与测试参数
- 按行添加节点组成员
- 查看 `fallback` 当前活跃节点状态
- 添加链式代理
- 查看订阅节点、手动节点、节点组和链式代理
- 批量刷新节点测速
- 节点组使用可展开卡片展示
  - 折叠态显示组名、策略、成员数量
  - 展开后显示组内节点与编辑项

### 节点编辑页

支持：

- 通过表单添加常见协议节点
- 导入单行节点链接、多行节点文本或结构化 JSON
- 查看 / 删除手动节点
- 禁用 / 重新启用订阅节点

所有业务页面都使用共享菜单栏和侧边菜单，并支持中文 / English 切换。

## 手动导入节点格式

### 单行节点链接

```text
vless://uuid@example.com:443?security=tls&sni=example.com#my-node
```

### 多行节点文本

```text
vless://...
trojan://...
ss://...
```

### 结构化 JSON

```json
{
  "type": "vless",
  "tag": "my-node",
  "server": "example.com",
  "server_port": 443,
  "uuid": "..."
}
```

### 带 `raw` 的 JSON

```json
{
  "raw": "vless://uuid@example.com:443?security=tls#my-node"
}
```

处理逻辑：

1. 先判断输入是否为 JSON
2. 如果是 JSON，优先按结构化节点处理
3. 如果不是 JSON，则按订阅 / 链接文本解析
4. 先识别协议，再套用对应协议模板解析

## API 列表

### 配置相关

- `GET /api/config`
- `POST /api/config`
  - 保存业务配置
  - 自动生成新的 `sing-box` 配置
  - 如果运行中则自动重启应用新配置

### 订阅相关

- `POST /api/subscription/refresh`

### 节点相关

- `GET /api/nodes`
- `POST /api/nodes`
- `POST /api/nodes/import`

### 内核相关

- `GET /api/kernel/status`
- `POST /api/kernel/architecture`
- `GET /api/kernel/releases`
- `POST /api/kernel/releases/update`
- `POST /api/kernel/plan`
- `GET /api/kernel/download`
- `POST /api/kernel/download`

### 运行时相关

- `POST /api/runtime/generate`
- `POST /api/runtime/start`
- `POST /api/runtime/stop`
- `GET /api/runtime/generated`
- `GET /api/runtime/logs`

## API 调用与测试方法

以下示例以 Windows PowerShell 为准。

### 1. 启动服务

```powershell
node src/server.js
```

访问：

```text
http://127.0.0.1:18080
```

### Docker Compose 部署到 VPS

```bash
git clone https://github.com/uovme/sub2socks5.git
cd sub2socks5
docker compose up -d --build
```

默认端口：

- `18080`：Web UI
- `18081`：默认 SOCKS5 服务端口

默认配置中，SOCKS5 服务监听地址为 `127.0.0.1`，适合本机或隧道访问。如果要让其他设备直接连接 VPS，需要在 Web UI 的“运行配置 -> SOCKS5 服务”中把监听地址改为 `0.0.0.0`，并确保 `docker-compose.yml` 和云防火墙都开放对应端口。

安全建议：

- 不要把无认证 SOCKS5 直接暴露到公网。
- 更推荐把 SOCKS5 保持为 `127.0.0.1`，再通过 Tailscale、WireGuard 或 SSH 隧道给其他设备使用。
- 如果必须公网开放 SOCKS5，请在云防火墙中限制来源 IP，只允许自己的设备访问。

### 2. 获取当前配置

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/config"
```

### 3. 获取节点列表

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/nodes"
```

### 4. 手动导入节点

```powershell
$body = @{
  raw = "vless://uuid@example.com:443?security=tls&sni=example.com#my-node"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:18080/api/nodes/import" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

### 5. 更新订阅

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:18080/api/subscription/refresh" `
  -Method Post `
  -ContentType "application/json" `
  -Body "{}"
```

### 6. 保存配置并自动应用

```powershell
$config = Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/config"

Invoke-RestMethod `
  -Uri "http://127.0.0.1:18080/api/config" `
  -Method Post `
  -ContentType "application/json" `
  -Body ($config.config | ConvertTo-Json -Depth 20)
```

### 7. 启动 `sing-box`

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:18080/api/runtime/start" `
  -Method Post `
  -ContentType "application/json" `
  -Body "{}"
```

### 8. 查看运行日志

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/runtime/logs"
```

### 9. 测试本地 `SOCKS5` 端口是否监听

假设当前端口为 `53456`：

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 53456
```

### 10. 测试是否能通过代理访问 Google

```powershell
curl.exe --socks5-hostname 127.0.0.1:53456 --max-time 25 https://www.google.com/generate_204 -I -s -o NUL -w "%{http_code}"
```

预期：

```text
204
```

### 11. 测试是否能通过代理访问 Gstatic

```powershell
curl.exe --socks5-hostname 127.0.0.1:53456 --max-time 25 https://www.gstatic.com/generate_204 -I -s -o NUL -w "%{http_code}"
```

预期：

```text
204
```

## 当前已验证结果

- Web UI 可正常启动在 `18080`
- `GET /api/config` 正常返回
- `GET /api/nodes` 正常返回
- `POST /api/nodes/import` 已验证可成功导入 `vless://...`
- `SOCKS5` 端口已验证可监听
- 已验证可通过代理访问 Google / Gstatic 并返回 `204`
- 已验证多出口 DNS server 生成逻辑正确
- 已验证节点组排序在普通节点前面

## 注意事项

- `fallback` 目前仍是第一版应用层实现
- 某些机场私有字段仍可能需要继续兼容
- 当前“运行中应用新配置”采用重启 `sing-box` 的方式，而不是热重载
- 不建议把运行期文件和本地状态文件提交到 Git

## 打包方法

当前项目支持使用 Node.js SEA（Single Executable Applications）打包为 Windows 单文件可执行程序。

### 前置要求

- 已安装 Node.js 24.x
- 在项目根目录执行命令

### 安装依赖

```powershell
npm install
```

### 构建 SEA 可执行文件

```powershell
npm run build:sea
```

### 输出文件

构建完成后会生成：

- `D:\sub2socks5\dist\sub2socks5-sea.exe`

### 运行方式

```powershell
cd D:\sub2socks5\dist
.\sub2socks5-sea.exe
```

默认 Web UI 地址：

```text
http://127.0.0.1:18080
```

### 首次运行行为

- 如果不存在配置文件，程序会自动生成默认配置
- 源码运行 `server.js` 时，运行目录使用 `src` 目录
- 打包后运行可执行文件时，运行目录使用 exe 所在目录
- 默认会创建或使用以下子目录：
  - `data`
  - `runtime`
  - `bin`

### 打包说明

- 当前 SEA 包只嵌入业务代码和 `src/public` 下的静态资源
- `sing-box` 内核不会嵌入到 exe 中
- 首次运行后，用户可以通过 Web UI 按系统架构下载对应的 `sing-box` 内核
- 因此发布时通常只需要提供：
  - `sub2socks5-sea.exe`
  - 或者由用户首次运行后自行下载内核

### 注意事项

- SEA 注入后可能出现 `signature seems corrupted` 提示，这是 Node 可执行文件注入应用 blob 后的常见现象
- 这不代表构建失败；如果要正式分发，建议重新进行代码签名

## GitHub Actions

项目已提供 GitHub Actions 工作流，支持手动触发全平台构建，以及手动触发构建后发布到 GitHub Release。

### 工作流文件

- `D:\sub2socks5\.github\workflows\reusable-build.yml`
  - 可复用构建模板
  - 统一维护平台与架构矩阵
- `D:\sub2socks5\.github\workflows\build.yml`
  - 手动触发
  - 只构建，不发布
- `D:\sub2socks5\.github\workflows\release.yml`
  - 手动触发
  - 先构建，再发布到 GitHub Release

### 当前构建目标

- `linux-x64`
- `linux-arm64`
- `windows-x64`
- `windows-arm64`
- `macos-x64`
- `macos-arm64`

### 产物规则

- 每个平台/架构单独构建一个二进制文件
- 每个平台/架构单独打包为一个 zip
- 每个 zip 中只包含一个二进制文件

产物命名示例：

- `sub2socks5-linux-x64.zip`
- `sub2socks5-linux-arm64.zip`
- `sub2socks5-windows-x64.zip`
- `sub2socks5-windows-arm64.zip`
- `sub2socks5-macos-x64.zip`
- `sub2socks5-macos-arm64.zip`

### 手动构建

1. 打开 GitHub 仓库的 `Actions`
2. 选择 `Build`
3. 点击 `Run workflow`

构建完成后，可在该次 workflow 的 `Artifacts` 中下载各平台单个二进制文件。

说明：

- `Build` 工作流不会先手动打 zip
- GitHub Actions 下载 artifact 时仍会以 GitHub 自身的 artifact 压缩形式提供
- 因此 `Build` 用于验证构建是否成功，而不是提供最终发布压缩包

### 手动发布 Release

1. 打开 GitHub 仓库的 `Actions`
2. 选择 `Release`
3. 点击 `Run workflow`
4. 填写：
   - `release_tag`
   - `release_name`

`Release` 工作流会：

- 自动构建全部平台/架构产物
- 自动按平台/架构分别打包 zip
- 自动收集所有 zip
- 自动创建或更新对应的 GitHub Release
- 自动把所有 zip 上传到 Release 附件

### 说明

- `Build` 适合日常验证构建是否正常
- `Release` 适合正式生成发布附件
- 如果后续要增减平台或架构，只需要修改 `D:\sub2socks5\.github\workflows\reusable-build.yml`
- 当前 SEA 运行入口仍使用 `CommonJS` 方式封装启动，这是 Node SEA 当前运行限制决定的
- 当前路径规则为：
  - 源码运行时使用 `server.js` 所在的 `src` 目录
  - 打包运行时使用可执行文件所在目录
