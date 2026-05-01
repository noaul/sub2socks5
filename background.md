# sing-box Background

本文件记录当前阶段项目实际使用的技术、参考材料、实现映射、策略选择和测试经验，方便后续继续迭代。

## 1. 当前技术栈

### 后端

- `Node.js 24+`
- Node.js 内置模块：
  - `http`
  - `fs/promises`
  - `path`
  - `url`
  - `child_process`
  - `buffer`

### 前端

- 原生 HTML / CSS / JavaScript
- `fetch`
- `localStorage`
- 轮询刷新

### 代理内核

- `sing-box`

### 测试环境

- Windows + PowerShell
- `curl.exe`
- `Test-NetConnection`

## 2. 当前参考材料

- `sing-box` 官方中文配置文档
  - `https://sing-box.sagernet.org/zh/configuration/`
- `sing-box` 官方 GitHub 仓库
  - `https://github.com/SagerNet/sing-box`
- `sing-box` Releases
  - `https://github.com/SagerNet/sing-box/releases`
- `v2rayN` 仓库
  - `https://github.com/2dust/v2rayN`

## 3. 当前架构

项目当前采用：

- `Node.js` 管理层
- `sing-box` 内核层
- 静态 Web UI 层

### 管理层职责

- 配置读写
- 订阅拉取与解析
- 手动节点导入与解析
- 节点组管理
- 版本列表管理
- 内核下载管理
- 运行配置生成
- `sing-box` 进程控制

### 内核层职责

- `SOCKS5` 入站监听
- 节点连接
- 出站转发
- DNS 查询
- 路由规则执行

### 前端职责

- 基础配置编辑
- 多 `SOCKS5` 服务编辑
- 节点管理
- 手动节点导入
- 节点组参数管理
- 运行状态与日志查看

## 4. 当前关键模块

- `D:\sub2socks5\src\server.js`
  - HTTP 服务与 API
- `D:\sub2socks5\src\lib\subscription.js`
  - 订阅解析、手动节点输入解析
- `D:\sub2socks5\src\lib\singbox-config.js`
  - 配置生成
- `D:\sub2socks5\src\lib\storage.js`
  - 默认配置与持久化
- `D:\sub2socks5\src\lib\singbox-manager.js`
  - `sing-box` 进程控制
- `D:\sub2socks5\src\lib\singbox-release.js`
  - Release 下载
- `D:\sub2socks5\src\public\app.js`
  - 主页交互
- `D:\sub2socks5\src\public\nodes.js`
  - 节点管理交互

## 5. 当前节点输入与解析策略

### 订阅解析

当前支持：

- 普通多行节点文本
- Base64 订阅
- URL Safe Base64

支持协议：

- `vmess`
- `vless`
- `trojan`
- `shadowsocks`
- `hysteria2`
- `tuic`

### 手动节点导入

当前支持三类输入：

1. 单行节点链接
2. 多行节点文本
3. 结构化 JSON

处理策略：

1. 先判断是否为 JSON
2. 是 JSON 就按结构化节点处理
3. 否则按订阅文本解析
4. 先识别协议，再按协议模板解析

额外支持：

- JSON 中可直接给完整结构化节点
- JSON 中可给 `raw` 字段，内部再次按协议解析

## 6. 当前多 SOCKS5 服务模型

主页当前不再只支持一个端口。

每条 `SOCKS5` 服务包含：

- `tag`
- `listen`
- `port`
- `target`

保存后写入：

- `config.ports[]`

生成配置时：

- 每条 `ports[]` 会生成一个 `socks` inbound
- 每条 inbound 会自动绑定到对应目标出口

## 7. 当前 DNS 策略

当前默认使用：

- 远程 DoH：
  - `https://cloudflare-dns.com/dns-query`
- 引导 DNS：
  - `223.5.5.5:53`

当前目标：

- 尽量避免本机直接 DNS 泄漏
- 保持首次域名解析稳定
- 保证代理出网成功率

当前关键修复结论：

- `https://1.1.1.1/dns-query` 容易在实际环境中触发证书 / SNI / 超时问题
- 将默认域名解析器切到引导 DNS 后，Google / Gstatic 代理访问恢复稳定

## 8. 当前节点组策略

### `urltest`

- 当前直接映射为 `sing-box` 原生 `urltest`
- 支持：
  - 测试地址
  - 测试间隔
  - 超时参数（应用层保存）

### `fallback`

目标语义参考 Mihomo：

- 正常时优先用前面的节点
- 定时做健康检查
- 当前节点失效时切换到下一个节点

当前实现状态：

- 不是 `sing-box` 原生出站类型
- 当前为应用层故障转移第一版
- 后端维护：
  - `runtimeState.fallbackGroups`
- 当前已支持：
  - 记录当前活跃节点
  - 记录最近切换时间
  - 页面显示当前状态

当前健康检查思路：

- 使用 `clash_api` 的 `delay` 接口探测节点
- 后端周期性评估节点组成员
- 必要时切换当前活跃节点

## 9. 当前 UI 交互经验

### 焦点问题

此前出现过：

- 编辑 `SOCKS5` 服务时失焦
- 节点下拉框刚展开就消失

根因：

- 主页定时轮询刷新时重绘了表单与服务列表

当前修复方式：

- 增加 `formTouched`
- 增加 `isFormInteracting`
- 正在编辑时跳过表单回填和服务列表重绘

### `sniff` 配置

当前已从 UI 移除，不再给用户单独配置。

原因：

- 本项目目标是给只支持 `SOCKS5` 的软件提供稳定分地区出口
- 更适合固定启用，而不是暴露为用户选项

## 10. 当前 API 能力

### 配置

- `GET /api/config`
- `POST /api/config`

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

## 11. 当前测试经验

### 已实际验证通过

- `GET /api/config`
- `GET /api/nodes`
- `POST /api/nodes/import`
- `SOCKS5` 端口监听
- 通过代理访问：
  - `https://www.google.com/generate_204`
  - `https://www.gstatic.com/generate_204`

返回结果：

- `204`

### 典型测试命令

#### 测配置

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/config"
```

#### 测节点

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/nodes"
```

#### 测手动节点导入

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

#### 测代理端口

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 53456
```

#### 测 Google

```powershell
curl.exe --socks5-hostname 127.0.0.1:53456 --max-time 25 https://www.google.com/generate_204 -I -s -o NUL -w "%{http_code}"
```

## 12. 当前已知限制

- `fallback` 仍然是第一版，不是完整 Mihomo 语义
- 手动节点结构化输入仍可继续补默认字段
- 某些机场私有参数仍需进一步兼容
- 运行期数据文件和本地订阅状态不应直接提交

## 13. 后续建议

- 给手动节点导入增加预览
- 给 JSON 节点输入增加协议默认字段补全
- 完善 `fallback` 健康检查结果展示
- 增加 `fallback` 回切逻辑
- 增加更多代理诊断工具
