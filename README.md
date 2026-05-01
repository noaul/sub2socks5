# sub2socks5

一个基于 `Node.js + sing-box` 的本地代理管理器，用来把机场订阅、手动节点和节点组组织成可视化、可多端口分流的 `SOCKS5` 代理服务。

## 当前能力

- 拉取订阅并解析常见节点协议
- 支持订阅内容为：
  - 单行节点链接
  - 多行订阅文本
  - Base64 / URL Safe Base64 订阅
- 支持协议：
  - `vmess`
  - `vless`
  - `trojan`
  - `shadowsocks`
  - `hysteria2`
  - `tuic`
- 支持多 `SOCKS5` 服务：
  - 可在主页添加多个本地 `SOCKS5` 监听端口
  - 每个端口可绑定不同节点或节点组
- 支持节点管理：
  - 订阅节点
  - 手动节点
  - 节点组
- 支持手动节点导入：
  - 单行节点链接
  - 多行节点文本
  - 结构化 JSON
- 支持节点组策略：
  - `urltest`
  - `fallback`（当前为应用层故障转移第一版）
- 支持节点组自定义参数：
  - 测试地址
  - 测试间隔
  - 超时毫秒
- 支持内核管理：
  - 检测系统架构
  - 获取版本列表
  - 设置计划版本
  - 拉取匹配架构的 `sing-box` 内核
- 支持 DNS 防泄漏优化：
  - 远程 DoH
  - 引导 DNS
  - 默认域名解析器优化
- 支持运行状态与日志查看

## 当前项目结构

- `D:\sub2socks5\src\server.js`
  - HTTP 服务入口
  - 提供 Web UI 页面和后端 API
- `D:\sub2socks5\src\lib\subscription.js`
  - 订阅拉取与节点解析
  - 手动节点原始输入解析
- `D:\sub2socks5\src\lib\singbox-config.js`
  - 业务配置转 `sing-box` 配置
- `D:\sub2socks5\src\lib\singbox-manager.js`
  - `sing-box` 进程控制
- `D:\sub2socks5\src\lib\singbox-release.js`
  - `sing-box` Release 管理与下载
- `D:\sub2socks5\src\lib\storage.js`
  - 默认配置与持久化
- `D:\sub2socks5\src\public\index.html`
  - 主页
- `D:\sub2socks5\src\public\app.js`
  - 主页交互逻辑
- `D:\sub2socks5\src\public\nodes.html`
  - 节点管理页
- `D:\sub2socks5\src\public\nodes.js`
  - 节点管理交互逻辑
- `D:\sub2socks5\src\public\style.css`
  - 页面样式

### 持久化目录

- `D:\sub2socks5\data`
  - 业务配置、订阅状态、架构信息、版本列表、计划内核信息
- `D:\sub2socks5\runtime`
  - 生成后的 `sing-box.json`
- `D:\sub2socks5\bin`
  - 已安装的 `sing-box` 内核和版本信息

## 运行流程

1. 启动 Web UI：
   - `node src/server.js`
2. 在主页保存基础配置
3. 更新订阅或导入手动节点
4. 生成 `sing-box` 配置
5. 启动 `sing-box`
6. 不同本地 `SOCKS5` 端口按配置走不同节点 / 节点组

## 当前 DNS 方案

默认使用：

- 远程 DoH：
  - `https://cloudflare-dns.com/dns-query`
- 引导 DNS：
  - `223.5.5.5:53`

当前思路：

- 远程 DoH 走代理出站
- 默认域名解析优先由引导 DNS 协助完成
- 避免直接依赖本地系统 DNS

## 节点组说明

### `urltest`

- 使用 `sing-box` 原生 `urltest`
- 会按测试地址定时探测节点
- 选择延迟更优的节点

### `fallback`

- 当前不是 `sing-box` 原生出站类型
- 目前实现为“应用层故障转移第一版”
- 后端会维护当前活跃节点
- 后端会定时做健康检查
- 当当前节点不可用时切换到下一个可用节点
- 当前状态会显示在节点管理页

## Web UI 使用说明

### 主页

主页当前支持：

- 检测架构
- 检查内核版本
- 检查版本更新
- 设置计划版本
- 拉取 `sing-box` 内核
- 保存配置
- 更新订阅
- 生成配置
- 启动 / 停止 `sing-box`
- 添加多个 `SOCKS5` 服务
- 查看运行状态、生成结果、日志

### 节点管理页

节点管理页当前支持：

- 导入手动节点
- 查看 / 删除手动节点
- 添加节点组
- 为节点组设置：
  - 策略
  - 测试地址
  - 测试间隔
  - 超时毫秒
- 为节点组按行添加成员
- 查看 `fallback` 当前活跃节点和最近切换时间

## 手动节点导入说明

手动节点导入框支持以下格式：

### 1. 单行节点链接

```text
vless://uuid@example.com:443?security=tls&sni=example.com#my-node
```

### 2. 多行节点文本

```text
vless://...
trojan://...
ss://...
```

### 3. 结构化 JSON

```json
{
  "type": "vless",
  "tag": "my-node",
  "server": "example.com",
  "server_port": 443,
  "uuid": "..."
}
```

### 4. 带 `raw` 的结构化 JSON

```json
{
  "raw": "vless://uuid@example.com:443?security=tls#my-node"
}
```

处理逻辑：

1. 后端先判断是否为 JSON
2. 如果是 JSON，优先按结构化节点处理
3. 如果不是 JSON，按订阅 / 链接文本解析
4. 先识别协议，再按对应协议模板匹配

## API 列表

### 配置相关

- `GET /api/config`
  - 获取当前完整配置、订阅状态、可用出口、内核状态等
- `POST /api/config`
  - 保存业务配置

### 订阅相关

- `POST /api/subscription/refresh`
  - 拉取并解析订阅

### 节点相关

- `GET /api/nodes`
  - 获取订阅节点、手动节点、节点组、可用出口、`fallback` 状态
- `POST /api/nodes`
  - 保存手动节点和节点组
- `POST /api/nodes/import`
  - 导入原始节点输入并解析为节点

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

## API 测试方法

下面是当前阶段推荐的 Windows / PowerShell 测试方法。

### 1. 启动服务

```powershell
node src/server.js
```

访问：

```text
http://127.0.0.1:18080
```

### 2. 测试基础配置接口

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/config"
```

### 3. 测试节点列表接口

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/nodes"
```

### 4. 测试手动节点导入接口

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

### 5. 测试生成配置

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:18080/api/runtime/generate" `
  -Method Post `
  -ContentType "application/json" `
  -Body "{}"
```

### 6. 测试启动 `sing-box`

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:18080/api/runtime/start" `
  -Method Post `
  -ContentType "application/json" `
  -Body "{}"
```

### 7. 测试运行日志

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/runtime/logs"
```

### 8. 测试 SOCKS5 端口监听

假设当前监听端口为 `53456`：

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 53456
```

### 9. 测试 SOCKS5 代理访问 Google

```powershell
curl.exe --socks5-hostname 127.0.0.1:53456 --max-time 25 https://www.google.com/generate_204 -I -s -o NUL -w "%{http_code}"
```

预期：

```text
204
```

### 10. 测试 SOCKS5 代理访问 Gstatic

```powershell
curl.exe --socks5-hostname 127.0.0.1:53456 --max-time 25 https://www.gstatic.com/generate_204 -I -s -o NUL -w "%{http_code}"
```

预期：

```text
204
```

## 当前已验证结论

- Web UI 可以正常启动
- `GET /api/config` 正常返回
- `GET /api/nodes` 正常返回
- `POST /api/nodes/import` 已实际验证可成功导入 `vless://...` 节点
- `SOCKS5` 端口已真实验证可监听
- 通过代理访问 Google / Gstatic 已真实验证返回 `204`

## 注意事项

- `fallback` 当前仍是第一版实现，后续还可以继续增强健康检查和回切逻辑
- 某些机场私有字段可能仍需继续兼容
- 运行期文件和本地订阅状态不建议提交到 Git

## 后续建议

- 给手动导入增加导入预览
- 给结构化 JSON 增加协议默认字段补全
- 继续完善 Mihomo 风格 `fallback`
- 为 `fallback` 增加健康检查结果展示
