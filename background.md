# sing-box Background

本文档记录当前阶段项目使用到的技术、参考材料、实现思路、策略选择与测试经验，方便后续继续迭代。

## 1. 当前技术栈

### 后端

- `Node.js 24+`
- Node.js 内置模块
  - `http`
  - `fs/promises`
  - `path`
  - `url`
  - `buffer`
  - `child_process`

### 前端

- 原生 HTML / CSS / JavaScript
- `fetch`
- 简单轮询刷新
- 表单模式与 JSON 模式切换
- 动态表单增删
- 预设下拉与自定义输入显隐

### 代理内核

- `sing-box`

### 测试环境

- Windows 11
- PowerShell
- `curl.exe`
- `Test-NetConnection`

## 2. 主要参考材料

### sing-box 官方资料

- 配置文档
  - [https://sing-box.sagernet.org/zh/configuration/](https://sing-box.sagernet.org/zh/configuration/)
- 官方仓库
  - [https://github.com/SagerNet/sing-box](https://github.com/SagerNet/sing-box)
- Release 页面
  - [https://github.com/SagerNet/sing-box/releases](https://github.com/SagerNet/sing-box/releases)

### 节点解析参考

- `v2rayN`
  - [https://github.com/2dust/v2rayN](https://github.com/2dust/v2rayN)

说明：

- 订阅与单行节点解析逻辑参考了 `v2rayN` 的协议兼容思路
- `sing-box` 配置字段以官方文档为准，不直接照搬旧版示例

## 3. 当前架构

当前项目分为三层：

- 管理层：`Node.js`
- 代理层：`sing-box`
- 展示层：静态 Web UI

### 管理层职责

- 读写业务配置
- 拉取并解析多订阅
- 手动导入并解析节点
- 维护节点组
- 获取并缓存内核版本列表
- 自动检测架构并规划下载版本
- 下载与替换 `sing-box` 内核
- 生成运行时配置
- 控制 `sing-box` 进程
- 维护运行日志和 fallback 状态

### 代理层职责

- 提供多个本地 `SOCKS5` 入站
- 连接远端节点
- 执行出站转发
- 处理 DNS 查询
- 执行路由与出站绑定

### 展示层职责

- 编辑基础配置
- 编辑多个订阅地址
- 编辑多个 `SOCKS5` 服务
- 查看和管理节点
- 管理节点组
- 管理内核版本
- 查看运行状态与实时日志

## 4. 当前关键模块

- `D:\sub2socks5\src\server.js`
  - HTTP 服务入口与 API 路由
  - 保存配置后自动生成并应用运行配置
- `D:\sub2socks5\src\lib\subscription.js`
  - 多订阅拉取
  - 订阅解析
  - 原始节点导入解析
  - 节点去重
- `D:\sub2socks5\src\lib\singbox-config.js`
  - 业务配置转 `sing-box` 配置
  - 多出口 DoH server 生成
- `D:\sub2socks5\src\lib\storage.js`
  - 默认配置
  - 文件持久化
  - 旧配置迁移
- `D:\sub2socks5\src\lib\singbox-manager.js`
  - `sing-box` 启停与日志收集
- `D:\sub2socks5\src\lib\singbox-release.js`
  - release 版本读取、过滤、下载、解压
- `D:\sub2socks5\src\public\app.js`
  - 首页交互逻辑
- `D:\sub2socks5\src\public\nodes.js`
  - 节点管理页交互逻辑

## 5. 节点输入与解析策略

### 订阅解析

当前支持：

- 多行节点文本
- Base64 订阅
- URL Safe Base64 订阅
- 多订阅 URL 汇总

当前支持协议：

- `vmess`
- `vless`
- `trojan`
- `shadowsocks`
- `hysteria2`
- `tuic`

### 手动节点导入

当前支持输入类型：

1. 单行节点链接
2. 多行节点文本
3. 结构化 JSON
4. 带 `raw` 字段的 JSON

解析流程：

1. 先判断是否为 JSON
2. 如果是 JSON，优先按结构化节点处理
3. 如果不是 JSON，则当作原始订阅 / 链接文本解析
4. 先识别协议，再按协议模板做字段映射

补充说明：

- 已修复 Base64 订阅内容中 `raw` 字段导致的误判问题
- 已兼容 `ss://base64-userinfo@host:port#tag` 这一类形式
- 多订阅结果会按 `type + tag + server + port` 去重

## 6. 多 SOCKS5 服务模型

当前不再只支持一个端口。

每个 `SOCKS5` 服务包含：

- `tag`
- `listen`
- `port`
- `target`

配置保存位置：

- `config.ports[]`

生成运行配置时：

- 每个 `ports[]` 条目生成一个 `socks` 入站
- 每个入站按 tag 绑定到对应目标出站
- 每个入站的 DNS `resolve` 规则绑定到对应出口的 DoH server

用途说明：

- 一个本地软件可指向一个固定端口
- 不同端口可分别使用不同节点或节点组出网

## 7. DNS 方案与防泄漏思路

当前支持：

- DoH 服务器预设
  - `https://dns.google/dns-query`
  - `https://cloudflare-dns.com/dns-query`
  - 自定义
- Bootstrap DNS 预设
  - `1.1.1.1`
  - `8.8.8.8`
  - `223.5.5.5`
  - 自定义

设计目标：

- 尽量避免本机直接 DNS 泄漏
- 使用远端 DoH 完成主解析
- 使用 Bootstrap DNS 解析 DoH 域名
- 每个本地 `SOCKS5` 目标出口使用各自的 DoH detour

当前实践结论：

- 直接使用公共 DoH 时，DNS 检测网站可能显示 DoH 服务商的全球 POP，而不一定代表本地运营商 DNS 泄漏
- 旧实现会让所有 DoH 请求统一走默认 `proxy`
- 新实现已修正为：
  - `dns-remote-proxy`
  - `dns-remote-<group-or-node-tag>`
  - 每个端口按目标出口使用对应 DoH

## 8. 节点组策略

### `urltest`

- 映射为 `sing-box` 原生 `urltest`
- 支持参数：
  - 测试地址
  - 测试间隔
  - 超时毫秒
- 测试地址支持预设：
  - `https://www.gstatic.com/generate_204`
  - `https://www.google.com/generate_204`
  - `https://cp.cloudflare.com/generate_204`
  - 自定义

### `fallback`

目标语义参考 Mihomo 风格故障转移：

- 优先使用前面的节点
- 定时探测可用性
- 当前节点失效时切到下一个可用节点

当前实现状态：

- 不是 `sing-box` 原生出站类型
- 当前为应用层第一版
- 后端通过 `runtimeState.fallbackGroups` 维护状态
- 节点管理页可显示：
  - 当前活跃节点
  - 最近切换时间

当前探测思路：

- 使用 `clash_api` 的延迟检测能力
- 后端轮询组成员健康状态
- 必要时改写当前选择并重新生成运行配置

## 9. UI 交互经验与修复点

### 表单失焦问题

历史问题：

- 编辑 `SOCKS5` 服务时输入框失焦
- 打开节点下拉框后快速消失
- 保存配置时出现状态被轮询覆盖

根因：

- 首页轮询刷新时重绘了表单与服务列表

处理方式：

- 增加交互态标记
- 用户编辑中暂停表单回填
- 避免在交互中重绘关键表单区域

### 首页表单

当前首页支持：

- 多订阅地址列表
- 多 SOCKS5 服务列表
- DoH 预设与自定义输入
- Bootstrap DNS 预设与自定义输入
- 保存后自动生成运行配置
- 运行中自动重启应用新配置

基础设置布局现状：

- 第一行：Web UI 基础参数
- 第二行：DNS 策略、DoH 服务器、DoH 引导解析 DNS
- 第三行：默认路由出口、自动启动
- 自定义 DoH / 自定义引导解析 DNS 在需要时单独显示

### 运行状态展示

- 运行状态区域改成：
  - `状态`
  - `日志`
- `日志` 直接显示 `sing-box` 实时日志

### 节点管理页

当前节点管理页支持：

- 现有节点使用圆角卡片展示
- 卡片第一行显示节点名称
- 第二行标签显示协议与来源
- 节点组使用可展开面板
- 折叠态显示概览，展开态显示成员与编辑区
- 节点组在可选出口里排在普通节点前面

### 下载进度展示

- 不再保留顶部全局下载条
- 仅在实际下载内核时，将进度写入原消息区域

## 10. API 能力

### 配置

- `GET /api/config`
- `POST /api/config`
  - 保存业务配置
  - 自动生成新配置
  - 如果运行中，则自动重启 `sing-box`

### 订阅

- `POST /api/subscription/refresh`

### 节点

- `GET /api/nodes`
- `POST /api/nodes`
- `POST /api/nodes/import`

### 内核

- `GET /api/kernel/status`
- `POST /api/kernel/architecture`
- `GET /api/kernel/releases`
- `POST /api/kernel/releases/update`
- `POST /api/kernel/plan`
- `GET /api/kernel/download`
- `POST /api/kernel/download`

### 运行时

- `POST /api/runtime/generate`
- `POST /api/runtime/start`
- `POST /api/runtime/stop`
- `GET /api/runtime/generated`
- `GET /api/runtime/logs`

## 11. 当前测试方法

### 获取配置

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/config"
```

### 获取节点

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/nodes"
```

### 导入手动节点

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

### 保存配置并自动应用

```powershell
$config = Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/config"

Invoke-RestMethod `
  -Uri "http://127.0.0.1:18080/api/config" `
  -Method Post `
  -ContentType "application/json" `
  -Body ($config.config | ConvertTo-Json -Depth 20)
```

### 启动运行时

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:18080/api/runtime/start" `
  -Method Post `
  -ContentType "application/json" `
  -Body "{}"
```

### 检查 SOCKS5 端口

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 53456
```

### 通过代理访问 Google

```powershell
curl.exe --socks5-hostname 127.0.0.1:53456 --max-time 25 https://www.google.com/generate_204 -I -s -o NUL -w "%{http_code}"
```

### 通过代理访问 Gstatic

```powershell
curl.exe --socks5-hostname 127.0.0.1:53456 --max-time 25 https://www.gstatic.com/generate_204 -I -s -o NUL -w "%{http_code}"
```

## 12. 当前测试结论

已完成验证：

- Web UI 启动正常
- `GET /api/config` 正常
- `GET /api/nodes` 正常
- `POST /api/nodes/import` 可成功导入 `vless://...`
- `SOCKS5` 端口监听正常
- 代理访问 Google / Gstatic 返回 `204`
- 多出口 DoH server 生成符合预期
- 节点组在出口列表中优先于普通节点显示

环境说明：

- 当前在本地 PowerShell 环境中可验证真实代理链路
- 某些沙箱环境中 `sing-box` 子进程可能触发 `spawn EPERM`
- 这类问题属于环境限制，不等同于程序逻辑错误

## 13. 当前已知限制

- `fallback` 仍是第一版，不是完整 Mihomo 语义
- 某些机场私有字段仍可能需要继续兼容
- 结构化 JSON 输入仍可继续补全协议默认字段
- 内核下载速度仍受 GitHub 网络质量影响
- 当前运行中配置应用方式为“自动重启”，不是 sing-box 原生热更新

## 14. 后续建议

- 给手动导入增加预览与校验结果提示
- 为节点健康检查增加更直观的 UI 展示
- 增强 `fallback` 的回切逻辑
- 增加更多代理链路诊断工具
