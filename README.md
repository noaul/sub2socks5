# sub2socks5

一个基于 `Node.js + sing-box` 的本地代理管理器，目标是把机场订阅转换成可视化、可管理、可多端口分流的 `SOCKS5` 代理服务。

当前已经支持：
- 拉取机场订阅并解析节点
- 管理订阅节点、手动节点、节点组
- 生成符合新版 `sing-box` 结构的配置
- 启动本地 `sing-box` 内核提供 `SOCKS5` 服务
- 通过 Web UI 管理配置、节点、内核、运行状态和日志
- 自动检测系统架构并下载匹配的 `sing-box` 内核
- 通过远程 DNS + 引导 DNS 的方式尽量降低 DNS 泄漏风险

## 当前成果

- Web UI 运行在 `http://127.0.0.1:18080`
- 已完成订阅解析，支持常见协议：
  - `vmess`
  - `vless`
  - `trojan`
  - `shadowsocks`
  - `hysteria2`
  - `tuic`
- 已支持订阅内容为：
  - 纯链接列表
  - Base64 编码订阅
  - URL Safe Base64 订阅
- 已支持节点管理：
  - 订阅节点展示
  - 手动添加节点
  - 手动添加节点组
  - 节点组成员通过“`+ 添加节点` + 下拉框”方式选择
  - 手动节点与节点组会持久化保存，不会被更新订阅覆盖
- 已支持主页配置：
  - `SOCKS5` 监听地址与端口
  - 默认路由出口
  - `SOCKS5` 目标出口
  - DNS 设置
  - 表单 / JSON 双视图切换
- 已支持主页与节点页联动：
  - 在节点管理页保存节点组后，主页下拉框会立即出现新的节点组出口
- 已支持内核管理：
  - 检测当前架构
  - 获取版本列表
  - 设置计划下载版本
  - 拉取匹配架构的 `sing-box` 内核
- 已修复 `sing-box` 近期版本配置兼容问题：
  - 旧版 DNS 写法移除
  - 旧版 inbound 字段移除
  - 新版 DNS server / rule / route 结构适配
- 已完成真实代理联通测试：
  - `SOCKS5` 端口监听成功
  - 通过代理访问 `https://www.google.com/generate_204` 成功返回 `204`
  - 通过代理访问 `https://www.gstatic.com/generate_204` 成功返回 `204`

## 项目架构

项目采用“`Node.js` 管理进程 + 本地 `sing-box` 内核 + 静态 Web UI”的结构。

### 目录结构

- `D:\sub2socks5\src`
  - 源码目录
- `D:\sub2socks5\src\lib`
  - 后端核心逻辑
- `D:\sub2socks5\src\public`
  - Web UI 静态页面与前端脚本
- `D:\sub2socks5\data`
  - 持久化数据目录
- `D:\sub2socks5\runtime`
  - 运行时生成文件目录
- `D:\sub2socks5\bin`
  - `sing-box` 内核与版本信息目录

### 核心模块

- `D:\sub2socks5\src\server.js`
  - HTTP 服务入口
  - 提供 Web UI 页面
  - 提供配置、订阅、节点、内核、运行时 API

- `D:\sub2socks5\src\lib\storage.js`
  - 管理默认配置
  - 读写配置文件、订阅状态、架构信息、版本列表、计划内核信息
  - 负责 `data / runtime / bin` 目录初始化

- `D:\sub2socks5\src\lib\subscription.js`
  - 拉取订阅
  - 自动识别并解码 Base64 / URL Safe Base64
  - 解析多种代理协议为统一节点结构

- `D:\sub2socks5\src\lib\singbox-config.js`
  - 将应用配置、订阅节点、手动节点、节点组转换为 `sing-box` 配置
  - 生成 `dns / inbounds / outbounds / route / experimental`
  - 负责 DNS 防泄漏策略生成

- `D:\sub2socks5\src\lib\singbox-manager.js`
  - 启动、停止、跟踪 `sing-box` 进程
  - 缓存运行状态与日志

- `D:\sub2socks5\src\lib\singbox-release.js`
  - 检测平台架构
  - 读取 / 更新 GitHub Release 版本信息
  - 下载并安装匹配架构的 `sing-box`

- `D:\sub2socks5\src\public\app.js`
  - 主页前端逻辑
  - 管理配置编辑、版本检测、内核下载、运行控制、日志刷新、节点组联动

- `D:\sub2socks5\src\public\nodes.js`
  - 节点管理页前端逻辑
  - 管理手动节点、节点组、成员选择

### 持久化文件

- `D:\sub2socks5\data\app-config.json`
  - 主配置文件
- `D:\sub2socks5\data\subscription-state.json`
  - 订阅解析结果
- `D:\sub2socks5\data\architecture-info.json`
  - 当前架构信息
- `D:\sub2socks5\data\release-list.json`
  - 固化版本列表
- `D:\sub2socks5\data\planned-kernel-info.json`
  - 计划下载的内核版本
- `D:\sub2socks5\runtime\sing-box.json`
  - 生成后的运行配置
- `D:\sub2socks5\bin\sing-box.exe`
  - 已安装的内核
- `D:\sub2socks5\bin\sing-box-version.json`
  - 已安装内核版本信息

## 工作流程

### 首次使用

1. 启动服务：
   - `node src/server.js`
2. 打开主页：
   - `http://127.0.0.1:18080`
3. 点击 `检测当前架构`
4. 选择或确认计划内核版本
5. 点击 `拉取 sing-box 内核`
6. 填写订阅地址
7. 点击 `保存配置`
8. 点击 `更新订阅`
9. 检查节点是否解析成功
10. 按需设置默认出口和 `SOCKS5` 目标出口
11. 点击 `生成 sing-box 配置`
12. 点击 `启动 sing-box`

### 节点管理流程

1. 在主页点击 `节点管理`
2. 可添加：
   - 手动节点
   - 节点组
3. 节点组成员通过 `+ 添加节点` 逐项添加
4. 点击 `保存节点配置`
5. 保存后主页出口下拉框会自动刷新并显示新的节点组

### 运行流程

1. Web UI 保存配置到 `D:\sub2socks5\data\app-config.json`
2. 后端拉取订阅并保存到 `D:\sub2socks5\data\subscription-state.json`
3. 生成 `D:\sub2socks5\runtime\sing-box.json`
4. 后端调用本地 `sing-box` 内核启动代理
5. `sing-box` 在指定端口监听 `SOCKS5`
6. 不同端口可绑定不同节点或节点组出口

## 当前 DNS 方案

当前默认 DNS 逻辑是：

- 远程 DNS：
  - `https://cloudflare-dns.com/dns-query`
- 引导 DNS：
  - `223.5.5.5:53`
- 远程 DoH 使用代理出站
- 默认域名解析器优先使用引导 DNS

这样做的原因：
- 避免直接使用本地系统 DNS 造成泄漏
- 避免部分节点环境下远程 DoH 首次解析超时
- 保证代理连接建立前后的域名解析更稳定

## 当前默认出站逻辑

生成配置后，默认可选出口包括：

- `proxy`
  - 手动选择器，包含全部可用节点 / 节点组
- `auto`
  - 自动测速组
- `direct`
  - 直连
- `block`
  - 拦截
- 订阅节点
- 手动节点
- 用户自定义节点组

`SOCKS5 目标出口` 的含义就是：
- 该端口实际通过哪个节点或节点组访问外网

例如：
- 目标出口设为 `HK-1`
  - 这个端口的流量就固定走 `HK-1`
- 目标出口设为某个节点组
  - 这个端口就按该节点组策略转发

## 测试方法

### 1. 启动 Web UI

在项目目录执行：

```powershell
node src/server.js
```

然后访问：

```text
http://127.0.0.1:18080
```

### 2. 更新订阅并生成配置

在 Web UI 中依次操作：

1. 填写订阅地址
2. `保存配置`
3. `更新订阅`
4. `生成 sing-box 配置`

检查以下文件是否生成：

- `D:\sub2socks5\data\subscription-state.json`
- `D:\sub2socks5\runtime\sing-box.json`

### 3. 启动 sing-box

可通过 Web UI 点击 `启动 sing-box`，也可以手动测试：

```powershell
D:\sub2socks5\bin\sing-box.exe run -c D:\sub2socks5\runtime\sing-box.json
```

### 4. 测试端口监听

例如当前默认端口是 `53456`，可执行：

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 53456
```

若返回 `TcpTestSucceeded = True`，表示端口监听正常。

### 5. 测试代理访问 Google

```powershell
curl.exe --socks5-hostname 127.0.0.1:53456 --max-time 25 https://www.google.com/generate_204 -I -s -o NUL -w "%{http_code}"
```

预期返回：

```text
204
```

### 6. 测试代理访问 Gstatic

```powershell
curl.exe --socks5-hostname 127.0.0.1:53456 --max-time 25 https://www.gstatic.com/generate_204 -I -s -o NUL -w "%{http_code}"
```

预期返回：

```text
204
```

## 现阶段已验证结论

- `SOCKS5` 端口可以正常监听
- 代理流量可以通过 `sing-box` 正常转发
- Google / Gstatic 已完成真实访问测试
- 主页可以立即感知节点页保存后的节点组变化
- 当前 DNS 修复后，远程解析不再出现之前的超时问题

## 注意事项

- 当前仓库里可能存在联调时留下的测试节点组 `test-group`
- 若不需要，可在节点管理页删除
- 目前节点组 `fallback` 策略还是以安全兼容方式映射，不是完全等价的 sing-box 原生高级行为
- 某些机场私有字段、私有协议扩展仍可能需要继续兼容
- 当前重点是可用性和新版 `sing-box` 兼容性，后续仍可继续完善 UI 和节点表单

## 后续建议

- 给手动节点增加按协议分类的完整表单
- 完善节点组 `fallback` 的更精细策略映射
- 增加多端口可视化编辑
- 增加订阅自动刷新与运行时热更新
- 增加更多连通性诊断与测速工具
