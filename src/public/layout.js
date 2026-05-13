// layout.js - Shared sidebar, navigation, API utilities, and common rendering

export const NODES_UPDATED_KEY = 'sub2socks5:nodes-updated-at';
export const DNS_PRESET_URLS = {
  google: 'https://dns.google/dns-query',
  cloudflare: 'https://cloudflare-dns.com/dns-query'
};
export const DNS_BOOTSTRAP_PRESETS = ['1.1.1.1', '8.8.8.8', '223.5.5.5'];
export const LANGUAGE_STORAGE_KEY = 'sub2socks5:language';
export const LANGUAGE_CHANGE_EVENT = 'sub2socks5:languagechange';

const SUPPORTED_LANGUAGES = ['zh', 'en'];
const TRANSLATIONS = {
  zh: {
    'language.switch': '语言切换',
    'language.zh': '中文',
    'language.en': 'English',
    'nav.dashboard': '仪表盘',
    'nav.kernel': '内核',
    'nav.config': '配置',
    'nav.logs': '日志',
    'nav.nodes': '节点',
    'nav.primary': '主菜单',
    'nav.sidebar': '侧边菜单',
    'nav.open': '打开菜单',
    'brand.home': 'sub2socks5 首页',
    'sidebar.caption': 'SOCKS5 控制台',
    'status.running': '运行中',
    'status.stopped': '已停止',
    'config.title': '配置',
    'config.subtitle': '设置 Web UI、DNS、订阅地址和 SOCKS5 服务。每个字段下方都有填写建议。',
    'config.basic': '基础设置',
    'config.dns': 'DNS 设置',
    'config.subscriptionUrls': '订阅地址',
    'config.socksServices': 'SOCKS5 服务',
    'config.generated': '生成配置',
    'config.loading': '正在加载...',
    'config.saved': '已保存',
    'config.unsaved': '有未保存修改',
    'config.invalid': '配置无效：{error}',
    'config.switchFailed': '切换失败：{error}',
    'config.save': '保存',
    'config.form': '表单',
    'config.json': 'JSON',
    'config.summary': '摘要',
    'action.addUrl': '+ 添加地址',
    'action.addService': '+ 添加服务',
    'action.remove': '移除',
    'label.appHost': 'Web UI 监听地址',
    'label.appPort': 'Web UI 端口',
    'label.appBinary': 'sing-box 二进制路径',
    'label.appLogLevel': '日志级别',
    'label.appAutoStart': '自动启动',
    'label.dnsStrategy': 'DNS 策略',
    'label.dohServer': 'DoH 服务器',
    'label.customDohUrl': '自定义 DoH 地址',
    'label.bootstrapDns': '引导 DNS',
    'label.customBootstrapDns': '自定义引导 DNS',
    'label.routeFinal': '默认出口',
    'label.subscriptionUrl': '订阅地址',
    'label.socksTag': '服务名称',
    'label.socksListen': '监听地址',
    'label.socksPort': '端口',
    'label.socksTarget': '目标出口',
    'help.appHost': '本机使用填 127.0.0.1；给局域网或 VPS 访问填 0.0.0.0，并配合防火墙限制来源。',
    'help.appPort': 'Web 管理页面端口，默认 18080；改动后需要用新端口访问。',
    'help.appBinary': 'sing-box 可执行文件路径。使用内核页下载时通常保持默认即可。',
    'help.appLogLevel': '普通使用选 info；排查问题选 debug；trace 会产生大量日志。',
    'help.appAutoStart': '勾选后程序启动时会自动刷新订阅并启动 sing-box。',
    'help.dnsStrategy': '大多数网络选 prefer_ipv4；需要 IPv6 时选 prefer_ipv6 或 ipv6_only。',
    'help.dnsRemotePreset': '选择常用 DoH 服务；需要自定义时选择“自定义”并填写下方地址。',
    'help.dnsRemoteUrl': '填写完整 HTTPS DoH 地址，例如 https://dns.google/dns-query。',
    'help.dnsBootstrapPreset': '用于解析 DoH 域名的上游 DNS；国内 VPS 可选 223.5.5.5。',
    'help.dnsBootstrap': '填写纯 IP 地址，例如 1.1.1.1 或 223.5.5.5。',
    'help.routeFinal': '没有匹配规则时使用的默认出口；通常选择 proxy 或某个节点组。',
    'help.subscriptionUrl': '粘贴机场订阅链接。多个订阅可逐条添加，保存后再刷新订阅。',
    'help.socksTag': '给这个 SOCKS5 服务起一个唯一名称，例如 default-socks。',
    'help.socksListen': '本机使用填 127.0.0.1；允许其他设备访问填 0.0.0.0 或内网 IP。',
    'help.socksPort': '本地 SOCKS5 端口，例如 18081；同一个监听地址下不要重复。',
    'help.socksTarget': '这个端口要转发到哪个出口，通常选 proxy、auto、节点组或具体节点。',
    'common.loading': '正在加载...',
    'common.ready': '准备就绪',
    'common.form': '表单',
    'common.json': 'JSON',
    'common.summary': '摘要',
    'common.timeline': '时间线',
    'common.raw': '原始',
    'common.collapse': '收起',
    'common.expand': '展开',
    'common.custom': '自定义',
    'common.delete': '删除',
    'common.enable': '启用',
    'common.disable': '禁用',
    'common.check': '测速',
    'common.checking': '测速中...',
    'common.failed': '失败',
    'common.noContent': '暂无内容',
    'common.noLogs': '暂无日志',
    'common.log': '日志',
    'common.manual': '手动',
    'common.subscription': '订阅',
    'common.group': '节点组',
    'common.chain': '链式代理',
    'common.builtin': '内置',
    'common.noNodes': '暂无节点',
    'common.noGroups': '暂无节点组',
    'common.noChains': '暂无链式代理',
    'common.noMembers': '暂无成员',
    'common.nodesCount': '{count} 个节点',
    'common.unnamed': '未命名',
    'common.yes': '是',
    'common.no': '否',
    'status.actionProgress': '{label}进行中...',
    'status.actionDone': '{label}完成',
    'status.actionFailed': '{label}失败：{error}',
    'status.download': '下载内核中 [{stage}] {message} {percent}{threads}',
    'status.processing': '处理中',
    'status.downloading': '正在下载',
    'status.initFailed': '初始化失败：{error}',
    'status.runningText': 'sing-box 正在运行',
    'status.configSaved': '配置已保存',
    'pageTitle.dashboard': '仪表盘 - sub2socks5',
    'pageTitle.kernel': '内核 - sub2socks5',
    'pageTitle.config': '配置 - sub2socks5',
    'pageTitle.logs': '日志 - sub2socks5',
    'pageTitle.nodes': '节点 - sub2socks5',
    'pageTitle.nodesEdit': '节点编辑 - sub2socks5',
    'dashboard.title': '仪表盘',
    'dashboard.subtitle': '按顺序完成内核、节点、SOCKS5 和运行状态；每一项都在独立页面里维护。',
    'dashboard.start': '启动服务',
    'dashboard.stop': '停止服务',
    'dashboard.refreshSubscription': '刷新订阅',
    'dashboard.flowEyebrow': '设置流程',
    'dashboard.flowTitle': '从订阅到 SOCKS5 服务',
    'dashboard.flowText': '先确认 sing-box 内核，再导入订阅或手动节点，最后配置监听端口并启动服务。',
    'dashboard.stepKernelTitle': '安装内核',
    'dashboard.stepKernelText': '检测系统架构，选择并下载可用的 sing-box 版本。',
    'dashboard.stepNodesTitle': '导入订阅',
    'dashboard.stepNodesText': '管理订阅节点、手动节点、节点组和链式代理。',
    'dashboard.stepConfigTitle': '配置 SOCKS5',
    'dashboard.stepConfigText': '设置监听地址、端口、DNS 和默认出口。',
    'dashboard.stepStartTitle': '启动服务',
    'dashboard.stepStartText': '生成配置并启动 runtime，之后在日志页检查输出。',
    'dashboard.safetyTitle': 'VPS 安全提示',
    'dashboard.safetyText': '不要把无认证 SOCKS5 直接暴露到公网。跨设备使用时，优先通过防火墙限制来源 IP，或只绑定到内网/VPN 地址。',
    'dashboard.cardArchitecture': '系统架构',
    'dashboard.cardKernel': '内核',
    'dashboard.cardSubscription': '订阅',
    'dashboard.cardRuntime': '运行状态',
    'dashboard.cardSocks': 'SOCKS5 服务',
    'dashboard.cardGenerated': '生成配置',
    'dashboard.actionStart': '启动 sing-box',
    'dashboard.actionStop': '停止 sing-box',
    'dashboard.actionRefresh': '刷新订阅',
    'dashboard.notInstalled': '未安装',
    'dashboard.noSocksServices': '未配置 SOCKS5 服务',
    'dashboard.nodesBadge': '{count} 个节点',
    'summary.stored': '已保存架构',
    'summary.platform': '平台',
    'summary.os': '系统',
    'summary.archName': '架构名称',
    'summary.assetSuffix': '资源后缀',
    'summary.executable': '可执行文件',
    'summary.installed': '已安装',
    'summary.binaryPath': '二进制路径',
    'summary.installedVersion': '已安装版本',
    'summary.plannedVersion': '计划版本',
    'summary.plannedAsset': '计划资源',
    'summary.releaseListCount': '版本数量',
    'summary.updatedAt': '更新时间',
    'summary.nodeCount': '节点数量',
    'summary.warningCount': '警告数量',
    'summary.firstNode': '首个节点',
    'summary.warnings': '警告',
    'summary.rawLength': '原始长度',
    'summary.state': '状态',
    'summary.running': '运行中',
    'summary.logCount': '日志数量',
    'summary.latestLog': '最新日志',
    'summary.inboundCount': '入站数量',
    'summary.outboundCount': '出站数量',
    'summary.routeRuleCount': '路由规则数量',
    'summary.dnsServerCount': 'DNS 服务器数量',
    'summary.finalOutbound': '最终出口',
    'summary.logLevel': '日志级别',
    'kernel.title': '内核管理',
    'kernel.subtitle': '检测系统架构，选择并下载 sing-box 内核。',
    'kernel.architectureVersion': '架构与版本',
    'kernel.detectArchitecture': '检测架构',
    'kernel.checkInstalled': '检查已安装',
    'kernel.checkUpdates': '检查更新',
    'kernel.architecture': '架构',
    'kernel.version': '版本',
    'kernel.setPlanned': '设为计划版本',
    'kernel.download': '下载内核',
    'kernel.architectureInfo': '架构信息',
    'kernel.kernelStatus': '内核状态',
    'kernel.releaseList': '版本列表',
    'kernel.detectFirst': '请先检测架构',
    'kernel.actionDetect': '检测当前架构',
    'kernel.actionCheck': '检查内核',
    'kernel.actionUpdates': '检查版本更新',
    'kernel.actionPlan': '设置计划版本',
    'kernel.selectVersionFirst': '请先选择一个版本',
    'kernel.downloading': '正在下载 sing-box 内核...',
    'kernel.downloadFailed': '下载失败：{error}',
    'kernel.releaseAsset': '资源：{asset}',
    'logs.title': '日志与输出',
    'logs.subtitle': '查看实时运行日志和生成的 sing-box 配置。',
    'logs.runtimeLogs': '运行日志',
    'logs.generatedConfig': '生成的 sing-box 配置',
    'nodes.title': '节点管理',
    'nodes.subtitle': '先导入节点，再组装策略；节点组负责自动测试或故障转移，链式代理负责多跳路径。',
    'nodes.save': '保存节点配置',
    'nodes.workspace': '工作区',
    'nodes.workspaceSubtitle': '节点组用于自动测试或故障转移；链式代理用于多跳路径。',
    'nodes.groups': '节点组',
    'nodes.addGroup': '添加节点组',
    'nodes.chains': '链式代理',
    'nodes.addChain': '添加链式代理',
    'nodes.availableNodes': '可用节点',
    'nodes.checkAll': '刷新所有节点测速',
    'nodes.openEditor': '管理手动节点',
    'nodes.currentActive': '当前活动节点',
    'nodes.lastSwitched': '最近切换时间',
    'nodes.groupName': '节点组 {index}',
    'nodes.chainName': '链式代理 {index}',
    'nodes.strategy': '策略',
    'nodes.testUrl': '测试地址',
    'nodes.interval': '测试间隔',
    'nodes.timeoutMs': '超时毫秒',
    'nodes.customTestUrl': '自定义测试地址',
    'nodes.name': '名称',
    'nodes.addNode': '+ 添加节点',
    'nodes.loadFailed': '加载节点失败',
    'nodes.checkTitle': '点击测速',
    'nodes.checkFailed': '测速失败',
    'nodes.batchCheckFailed': '批量测速失败',
    'nodes.noCheckableNodes': '当前没有可测速节点',
    'nodes.checkAllProgress': '正在分批刷新全部节点测速...',
    'nodes.checkAllDone': '全部节点测速完成',
    'nodes.checkNodeDone': '节点 {tag} 测速完成',
    'nodes.saveFailed': '保存失败',
    'nodes.saved': '节点配置已保存',
    'nodesEdit.title': '节点编辑',
    'nodesEdit.back': '返回节点',
    'nodesEdit.save': '保存',
    'nodesEdit.importManual': '导入手动节点',
    'nodesEdit.currentNodes': '当前节点',
    'nodesEdit.form': '表单',
    'nodesEdit.rawJson': '原始 / JSON',
    'nodesEdit.protocol': '协议',
    'nodesEdit.nodeName': '节点名称',
    'nodesEdit.server': '服务器',
    'nodesEdit.port': '端口',
    'nodesEdit.addNode': '添加节点',
    'nodesEdit.importNodes': '导入节点',
    'nodesEdit.rawPlaceholder': '支持 vless://、vmess://、trojan://、ss://、socks5:// 等。',
    'nodesEdit.field.uuid': 'UUID',
    'nodesEdit.field.flow': '流控',
    'nodesEdit.field.sni': 'SNI',
    'nodesEdit.field.security': '加密方式',
    'nodesEdit.field.alterId': 'Alter ID',
    'nodesEdit.field.password': '密码',
    'nodesEdit.field.method': '加密方法',
    'nodesEdit.field.username': '用户名',
    'nodesEdit.loadFailed': '加载节点失败',
    'nodesEdit.deleteNode': '删除节点',
    'nodesEdit.enableNode': '启用节点',
    'nodesEdit.disableNode': '禁用节点',
    'nodesEdit.parseSuccess': '成功解析 {count} 个节点',
    'nodesEdit.notice': '提示',
    'nodesEdit.noImportableNodes': '没有可导入节点',
    'nodesEdit.requiredFields': '表单节点至少需要名称、服务器和端口',
    'nodesEdit.addedManual': '已添加表单节点 {tag}，请记得保存',
    'nodesEdit.importFailed': '导入失败',
    'nodesEdit.importSuccess': '成功导入 {count} 个节点',
    'nodesEdit.saveFailed': '保存失败',
    'nodesEdit.saved': '节点配置已保存',
    'nodesEdit.removedManual': '已移除手动节点，请记得保存',
    'nodesEdit.disabledSubscription': '已禁用订阅节点，请记得保存',
    'nodesEdit.enabledSubscription': '已重新启用订阅节点，请记得保存'
  },
  en: {
    'language.switch': 'Language',
    'language.zh': '中文',
    'language.en': 'English',
    'nav.dashboard': 'Dashboard',
    'nav.kernel': 'Kernel',
    'nav.config': 'Config',
    'nav.logs': 'Logs',
    'nav.nodes': 'Nodes',
    'nav.primary': 'Main menu',
    'nav.sidebar': 'Sidebar menu',
    'nav.open': 'Open menu',
    'brand.home': 'sub2socks5 home',
    'sidebar.caption': 'SOCKS5 console',
    'status.running': 'Running',
    'status.stopped': 'Stopped',
    'config.title': 'Configuration',
    'config.subtitle': 'Set the Web UI, DNS, subscription URLs, and SOCKS5 services. Each field includes a short filling guide.',
    'config.basic': 'Basic Settings',
    'config.dns': 'DNS Settings',
    'config.subscriptionUrls': 'Subscription URLs',
    'config.socksServices': 'SOCKS5 Services',
    'config.generated': 'Generated Config',
    'config.loading': 'Loading...',
    'config.saved': 'Saved',
    'config.unsaved': 'Unsaved changes',
    'config.invalid': 'Invalid: {error}',
    'config.switchFailed': 'Switch failed: {error}',
    'config.save': 'Save',
    'config.form': 'Form',
    'config.json': 'JSON',
    'config.summary': 'Summary',
    'action.addUrl': '+ Add URL',
    'action.addService': '+ Add Service',
    'action.remove': 'Remove',
    'label.appHost': 'Web UI Host',
    'label.appPort': 'Web UI Port',
    'label.appBinary': 'sing-box Binary Path',
    'label.appLogLevel': 'Log Level',
    'label.appAutoStart': 'Auto Start',
    'label.dnsStrategy': 'DNS Strategy',
    'label.dohServer': 'DoH Server',
    'label.customDohUrl': 'Custom DoH URL',
    'label.bootstrapDns': 'Bootstrap DNS',
    'label.customBootstrapDns': 'Custom Bootstrap DNS',
    'label.routeFinal': 'Default Route Outbound',
    'label.subscriptionUrl': 'Subscription URL',
    'label.socksTag': 'Service Name',
    'label.socksListen': 'Listen Address',
    'label.socksPort': 'Port',
    'label.socksTarget': 'Target Outbound',
    'help.appHost': 'Use 127.0.0.1 for local-only access. Use 0.0.0.0 for LAN/VPS access, then restrict source IPs with a firewall.',
    'help.appPort': 'Port for this Web UI. Default is 18080; after changing it, visit the new port.',
    'help.appBinary': 'Path to the sing-box executable. If you download it from the Kernel page, the default usually works.',
    'help.appLogLevel': 'Use info for normal use, debug for troubleshooting. trace can generate many logs.',
    'help.appAutoStart': 'When enabled, the app refreshes subscriptions and starts sing-box on launch.',
    'help.dnsStrategy': 'prefer_ipv4 works for most networks. Use prefer_ipv6 or ipv6_only only when you need IPv6.',
    'help.dnsRemotePreset': 'Choose a common DoH provider, or choose Custom and fill the URL below.',
    'help.dnsRemoteUrl': 'Enter the full HTTPS DoH URL, for example https://dns.google/dns-query.',
    'help.dnsBootstrapPreset': 'DNS server used to resolve the DoH hostname. 223.5.5.5 can be useful on China-based VPS networks.',
    'help.dnsBootstrap': 'Enter a plain IP address, for example 1.1.1.1 or 223.5.5.5.',
    'help.routeFinal': 'Outbound used when no route rule matches. Usually choose proxy or a node group.',
    'help.subscriptionUrl': 'Paste your provider subscription URL. Add multiple URLs one by one, then save and refresh subscriptions.',
    'help.socksTag': 'Unique name for this SOCKS5 service, for example default-socks.',
    'help.socksListen': 'Use 127.0.0.1 for local-only access. Use 0.0.0.0 or a LAN IP for other devices.',
    'help.socksPort': 'Local SOCKS5 port, for example 18081. Do not reuse the same listen address and port.',
    'help.socksTarget': 'Outbound this port forwards to. Usually proxy, auto, a node group, or a specific node.',
    'common.loading': 'Loading...',
    'common.ready': 'Ready',
    'common.form': 'Form',
    'common.json': 'JSON',
    'common.summary': 'Summary',
    'common.timeline': 'Timeline',
    'common.raw': 'Raw',
    'common.collapse': 'Collapse',
    'common.expand': 'Expand',
    'common.custom': 'Custom',
    'common.delete': 'Delete',
    'common.enable': 'Enable',
    'common.disable': 'Disable',
    'common.check': 'Check',
    'common.checking': 'Checking...',
    'common.failed': 'Failed',
    'common.noContent': 'No content',
    'common.noLogs': 'No logs',
    'common.log': 'Log',
    'common.manual': 'Manual',
    'common.subscription': 'Subscription',
    'common.group': 'Group',
    'common.chain': 'Chain',
    'common.builtin': 'Built-in',
    'common.noNodes': 'No nodes',
    'common.noGroups': 'No node groups',
    'common.noChains': 'No chains',
    'common.noMembers': 'No members',
    'common.nodesCount': '{count} nodes',
    'common.unnamed': 'unnamed',
    'common.yes': 'Yes',
    'common.no': 'No',
    'status.actionProgress': '{label}...',
    'status.actionDone': '{label} done',
    'status.actionFailed': '{label} failed: {error}',
    'status.download': 'Downloading kernel [{stage}] {message} {percent}{threads}',
    'status.processing': 'processing',
    'status.downloading': 'downloading',
    'status.initFailed': 'Init failed: {error}',
    'status.runningText': 'sing-box is running',
    'status.configSaved': 'Config saved',
    'pageTitle.dashboard': 'Dashboard - sub2socks5',
    'pageTitle.kernel': 'Kernel - sub2socks5',
    'pageTitle.config': 'Config - sub2socks5',
    'pageTitle.logs': 'Logs - sub2socks5',
    'pageTitle.nodes': 'Nodes - sub2socks5',
    'pageTitle.nodesEdit': 'Node Editor - sub2socks5',
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Complete kernel, nodes, SOCKS5, and runtime in order. Each area has its own page.',
    'dashboard.start': 'Start Service',
    'dashboard.stop': 'Stop Service',
    'dashboard.refreshSubscription': 'Refresh Subscription',
    'dashboard.flowEyebrow': 'Setup flow',
    'dashboard.flowTitle': 'From subscription to SOCKS5 service',
    'dashboard.flowText': 'Confirm the sing-box kernel, import subscription or manual nodes, then configure the listen port and start the service.',
    'dashboard.stepKernelTitle': 'Install Kernel',
    'dashboard.stepKernelText': 'Detect system architecture, select a sing-box version, and download it.',
    'dashboard.stepNodesTitle': 'Import Nodes',
    'dashboard.stepNodesText': 'Manage subscription nodes, manual nodes, groups, and chains.',
    'dashboard.stepConfigTitle': 'Configure SOCKS5',
    'dashboard.stepConfigText': 'Set listen address, port, DNS, and the default outbound.',
    'dashboard.stepStartTitle': 'Start Service',
    'dashboard.stepStartText': 'Generate config and start runtime, then check output on the Logs page.',
    'dashboard.safetyTitle': 'VPS Safety',
    'dashboard.safetyText': 'Do not expose unauthenticated SOCKS5 directly to the public internet. For cross-device use, restrict source IPs with a firewall or bind only to LAN/VPN addresses.',
    'dashboard.cardArchitecture': 'System Architecture',
    'dashboard.cardKernel': 'Kernel',
    'dashboard.cardSubscription': 'Subscription',
    'dashboard.cardRuntime': 'Runtime',
    'dashboard.cardSocks': 'SOCKS5 Services',
    'dashboard.cardGenerated': 'Generated Config',
    'dashboard.actionStart': 'Starting sing-box',
    'dashboard.actionStop': 'Stopping sing-box',
    'dashboard.actionRefresh': 'Refreshing subscription',
    'dashboard.notInstalled': 'Not installed',
    'dashboard.noSocksServices': 'No SOCKS5 services configured',
    'dashboard.nodesBadge': '{count} nodes',
    'summary.stored': 'Stored Architecture',
    'summary.platform': 'Platform',
    'summary.os': 'OS',
    'summary.archName': 'Architecture Name',
    'summary.assetSuffix': 'Asset Suffix',
    'summary.executable': 'Executable',
    'summary.installed': 'Installed',
    'summary.binaryPath': 'Binary Path',
    'summary.installedVersion': 'Installed Version',
    'summary.plannedVersion': 'Planned Version',
    'summary.plannedAsset': 'Planned Asset',
    'summary.releaseListCount': 'Release Count',
    'summary.updatedAt': 'Updated At',
    'summary.nodeCount': 'Node Count',
    'summary.warningCount': 'Warning Count',
    'summary.firstNode': 'First Node',
    'summary.warnings': 'Warnings',
    'summary.rawLength': 'Raw Length',
    'summary.state': 'State',
    'summary.running': 'Running',
    'summary.logCount': 'Log Count',
    'summary.latestLog': 'Latest Log',
    'summary.inboundCount': 'Inbound Count',
    'summary.outboundCount': 'Outbound Count',
    'summary.routeRuleCount': 'Route Rule Count',
    'summary.dnsServerCount': 'DNS Server Count',
    'summary.finalOutbound': 'Final Outbound',
    'summary.logLevel': 'Log Level',
    'kernel.title': 'Kernel Management',
    'kernel.subtitle': 'Detect architecture, select and download sing-box kernel.',
    'kernel.architectureVersion': 'Architecture & Version',
    'kernel.detectArchitecture': 'Detect Architecture',
    'kernel.checkInstalled': 'Check Installed',
    'kernel.checkUpdates': 'Check Updates',
    'kernel.architecture': 'Architecture',
    'kernel.version': 'Version',
    'kernel.setPlanned': 'Set as Planned',
    'kernel.download': 'Download Kernel',
    'kernel.architectureInfo': 'Architecture Info',
    'kernel.kernelStatus': 'Kernel Status',
    'kernel.releaseList': 'Release List',
    'kernel.detectFirst': 'Detect architecture first',
    'kernel.actionDetect': 'Detecting architecture',
    'kernel.actionCheck': 'Checking kernel',
    'kernel.actionUpdates': 'Checking updates',
    'kernel.actionPlan': 'Setting planned version',
    'kernel.selectVersionFirst': 'Please select a version first',
    'kernel.downloading': 'Downloading sing-box kernel...',
    'kernel.downloadFailed': 'Download failed: {error}',
    'kernel.releaseAsset': 'Asset: {asset}',
    'logs.title': 'Logs & Output',
    'logs.subtitle': 'Real-time runtime logs and generated sing-box configuration.',
    'logs.runtimeLogs': 'Runtime Logs',
    'logs.generatedConfig': 'Generated sing-box Config',
    'nodes.title': 'Node Management',
    'nodes.subtitle': 'Import nodes first, then assemble policies. Groups handle auto-test or fallback, and chains handle multi-hop routes.',
    'nodes.save': 'Save Node Config',
    'nodes.workspace': 'Workspace',
    'nodes.workspaceSubtitle': 'Groups are for auto-test or fallback; chains are for multi-hop proxy.',
    'nodes.groups': 'Node Groups',
    'nodes.addGroup': 'Add Group',
    'nodes.chains': 'Chains',
    'nodes.addChain': 'Add Chain',
    'nodes.availableNodes': 'Available Nodes',
    'nodes.checkAll': 'Refresh all node checks',
    'nodes.openEditor': 'Manage Manual Nodes',
    'nodes.currentActive': 'Current Active Node',
    'nodes.lastSwitched': 'Last Switched',
    'nodes.groupName': 'Node Group {index}',
    'nodes.chainName': 'Chain {index}',
    'nodes.strategy': 'Strategy',
    'nodes.testUrl': 'Test URL',
    'nodes.interval': 'Interval',
    'nodes.timeoutMs': 'Timeout (ms)',
    'nodes.customTestUrl': 'Custom Test URL',
    'nodes.name': 'Name',
    'nodes.addNode': '+ Add Node',
    'nodes.loadFailed': 'Failed to load nodes',
    'nodes.checkTitle': 'Check latency',
    'nodes.checkFailed': 'Node check failed',
    'nodes.batchCheckFailed': 'Batch node check failed',
    'nodes.noCheckableNodes': 'No checkable nodes',
    'nodes.checkAllProgress': 'Checking all nodes in batches...',
    'nodes.checkAllDone': 'All node checks finished',
    'nodes.checkNodeDone': 'Node {tag} check finished',
    'nodes.saveFailed': 'Save failed',
    'nodes.saved': 'Node config saved',
    'nodesEdit.title': 'Node Editor',
    'nodesEdit.back': 'Back to Nodes',
    'nodesEdit.save': 'Save',
    'nodesEdit.importManual': 'Import Manual Nodes',
    'nodesEdit.currentNodes': 'Current Nodes',
    'nodesEdit.form': 'Form',
    'nodesEdit.rawJson': 'Raw / JSON',
    'nodesEdit.protocol': 'Protocol',
    'nodesEdit.nodeName': 'Node Name',
    'nodesEdit.server': 'Server',
    'nodesEdit.port': 'Port',
    'nodesEdit.addNode': 'Add Node',
    'nodesEdit.importNodes': 'Import Nodes',
    'nodesEdit.rawPlaceholder': 'Supports vless://, vmess://, trojan://, ss://, socks5:// etc.',
    'nodesEdit.field.uuid': 'UUID',
    'nodesEdit.field.flow': 'Flow',
    'nodesEdit.field.sni': 'SNI',
    'nodesEdit.field.security': 'Security',
    'nodesEdit.field.alterId': 'Alter ID',
    'nodesEdit.field.password': 'Password',
    'nodesEdit.field.method': 'Method',
    'nodesEdit.field.username': 'Username',
    'nodesEdit.loadFailed': 'Failed to load nodes',
    'nodesEdit.deleteNode': 'Delete node',
    'nodesEdit.enableNode': 'Enable node',
    'nodesEdit.disableNode': 'Disable node',
    'nodesEdit.parseSuccess': 'Parsed {count} nodes',
    'nodesEdit.notice': 'Notice',
    'nodesEdit.noImportableNodes': 'No importable nodes',
    'nodesEdit.requiredFields': 'Manual node requires name, server, and port',
    'nodesEdit.addedManual': 'Added manual node {tag}; remember to save',
    'nodesEdit.importFailed': 'Import failed',
    'nodesEdit.importSuccess': 'Imported {count} nodes',
    'nodesEdit.saveFailed': 'Save failed',
    'nodesEdit.saved': 'Node config saved',
    'nodesEdit.removedManual': 'Removed manual node; remember to save',
    'nodesEdit.disabledSubscription': 'Disabled subscription node; remember to save',
    'nodesEdit.enabledSubscription': 'Re-enabled subscription node; remember to save'
  }
};

let currentLanguage = readStoredLanguage();

export let latestData = {
  config: null,
  subscription: null,
  availableOutbounds: [],
  runtime: null,
  kernel: null,
  architecture: null,
  plannedKernel: null,
  releaseList: [],
  generated: null,
  logs: null,
  download: null
};

export function t(key, lang = currentLanguage) {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}

export function format(key, replacements = {}, lang = currentLanguage) {
  return Object.entries(replacements).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    t(key, lang)
  );
}

export function getLanguage() {
  return currentLanguage;
}

const SUMMARY_LABEL_KEYS = {
  stored: 'summary.stored',
  platform: 'summary.platform',
  os: 'summary.os',
  archName: 'summary.archName',
  assetSuffix: 'summary.assetSuffix',
  executable: 'summary.executable',
  installed: 'summary.installed',
  binaryPath: 'summary.binaryPath',
  installedVersion: 'summary.installedVersion',
  plannedVersion: 'summary.plannedVersion',
  plannedAsset: 'summary.plannedAsset',
  releaseListCount: 'summary.releaseListCount',
  updatedAt: 'summary.updatedAt',
  nodeCount: 'summary.nodeCount',
  warningCount: 'summary.warningCount',
  firstNode: 'summary.firstNode',
  warnings: 'summary.warnings',
  rawLength: 'summary.rawLength',
  state: 'summary.state',
  running: 'summary.running',
  logCount: 'summary.logCount',
  latestLog: 'summary.latestLog',
  inboundCount: 'summary.inboundCount',
  outboundCount: 'summary.outboundCount',
  routeRuleCount: 'summary.routeRuleCount',
  dnsServerCount: 'summary.dnsServerCount',
  finalOutbound: 'summary.finalOutbound',
  logLevel: 'summary.logLevel'
};

export function applyTranslations(root = document) {
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
  root.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-title]').forEach((element) => {
    element.title = t(element.dataset.i18nTitle);
  });
  root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
  });
  root.querySelectorAll('[data-status-i18n]').forEach((element) => {
    let args = {};
    try {
      args = JSON.parse(element.dataset.statusI18nArgs || '{}');
    } catch {}
    element.textContent = format(element.dataset.statusI18n, args);
  });
}

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch {}
  return 'zh';
}

function setLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language) || language === currentLanguage) return;
  currentLanguage = language;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {}
  applyTranslations();
  updateLanguageToggle();
  updateSidebarStatus();
  window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: { language } }));
}

// --- API helpers ---

export async function api(path) {
  const response = await fetch(path);
  const data = await readResponseJson(response);
  if (!response.ok) throw new Error(extractErrorMessage(data, response));
  return data;
}

export async function post(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : '{}'
  });
  const data = await readResponseJson(response);
  if (!response.ok) throw new Error(extractErrorMessage(data, response));
  return data;
}

async function readResponseJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function extractErrorMessage(data, response) {
  if (data?.error?.message) return data.error.message;
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.raw === 'string' && data.raw.trim()) return data.raw;
  return `Request failed: ${response.status}`;
}

// --- Status bar ---

let statusBar;
let busyTargets = [];

export function setStatus(message, kind = 'idle', i18nKey = null, replacements = {}) {
  if (!statusBar) return;
  statusBar.textContent = message;
  statusBar.className = `status-bar is-${kind}`;
  if (i18nKey) {
    statusBar.dataset.statusI18n = i18nKey;
    statusBar.dataset.statusI18nArgs = JSON.stringify(replacements);
  } else {
    delete statusBar.dataset.statusI18n;
    delete statusBar.dataset.statusI18nArgs;
  }
}

export function syncStatusBarWithDownload(downloadState = {}) {
  if (downloadState?.active !== true) return false;
  const progress = downloadState.progress || {};
  const stage = progress.stage || 'download';
  const message = progress.message || t('status.downloading');
  const percent = typeof progress.percent === 'number' ? `${progress.percent.toFixed(0)}%` : t('status.processing');
  const threads = progress.threads ? `, ${progress.threads} threads` : '';
  setStatus(
    format('status.download', { stage, message, percent, threads }),
    'loading',
    'status.download',
    { stage, message, percent, threads }
  );
  return true;
}

export function setBusy(isBusy) {
  for (const button of busyTargets) {
    button.disabled = isBusy;
  }
}

// --- Common rendering ---

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function escapeHtmlAttr(value) {
  return escapeHtml(value);
}

export function flattenObject(input, prefix = '', output = {}) {
  for (const [key, value] of Object.entries(input || {})) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value, nextKey, output);
    } else {
      output[nextKey] = Array.isArray(value) ? JSON.stringify(value) : (value ?? '');
    }
  }
  return output;
}

export function renderKeyValue(container, entries) {
  container.innerHTML = '';
  for (const [key, value] of Object.entries(entries)) {
    const label = SUMMARY_LABEL_KEYS[key] ? t(SUMMARY_LABEL_KEYS[key]) : key;
    const displayValue = typeof value === 'boolean' ? t(value ? 'common.yes' : 'common.no') : value;
    const item = document.createElement('div');
    item.className = 'kv-item';
    item.innerHTML = `<div class="key">${escapeHtml(label)}</div><div class="value">${escapeHtml(String(displayValue))}</div>`;
    container.appendChild(item);
  }
}

export function renderTimeline(container, items) {
  container.innerHTML = '';
  if (!items.length) {
    container.innerHTML = `<div class="timeline-item"><div class="title">${escapeHtml(t('common.noContent'))}</div></div>`;
    return;
  }
  for (const item of items.slice().reverse()) {
    const node = document.createElement('div');
    node.className = 'timeline-item';
    node.innerHTML = `
      <div class="time">${escapeHtml(item.time || '')}</div>
      <div class="title">${escapeHtml(item.title || '')}</div>
      <div class="details">${escapeHtml(item.details || '')}</div>
    `;
    container.appendChild(node);
  }
}

export function renderLogTimeline(container, logs) {
  renderTimeline(container, logs.map((line, index) => ({
    time: `#${index + 1}`,
    title: t('common.log'),
    details: line
  })));
}

export function buildOutboundOptionsHtml(selectedTag, outbounds) {
  const list = outbounds?.length
    ? outbounds
    : latestData.availableOutbounds?.length
      ? latestData.availableOutbounds
      : [{ tag: 'direct', label: 'direct', type: 'direct', source: 'builtin' }];
  return list
    .map((o) => `<option value="${escapeHtmlAttr(o.tag)}" ${o.tag === selectedTag ? 'selected' : ''}>${escapeHtml(o.label || o.tag)}</option>`)
    .join('');
}

export function buildSubscriptionSummary(subscription) {
  const nodes = subscription?.nodes || [];
  return {
    updatedAt: subscription?.updatedAt || '',
    nodeCount: nodes.length + 1,
    warningCount: (subscription?.warnings || []).length,
    firstNode: 'direct',
    warnings: (subscription?.warnings || []).join(' | '),
    rawLength: subscription?.rawLength || 0
  };
}

export function buildRuntimeSummary(runtime) {
  return {
    state: runtime?.state || '',
    running: runtime?.running || false,
    logCount: (runtime?.logs || []).length,
    latestLog: runtime?.logs?.slice(-1)[0] || ''
  };
}

export function buildGeneratedSummary(generated) {
  return {
    inboundCount: generated?.inbounds?.length || 0,
    outboundCount: generated?.outbounds?.length || 0,
    routeRuleCount: generated?.route?.rules?.length || 0,
    dnsServerCount: generated?.dns?.servers?.length || 0,
    finalOutbound: generated?.route?.final || '',
    logLevel: generated?.log?.level || ''
  };
}

// --- Action helper ---

export async function action(label, fn) {
  try {
    setBusy(true);
    const labelText = t(label);
    setStatus(format('status.actionProgress', { label: labelText }), 'loading', 'status.actionProgress', { label: labelText });
    await fn();
    if (!syncStatusBarWithDownload(latestData.download)) {
      setStatus(format('status.actionDone', { label: labelText }), 'success', 'status.actionDone', { label: labelText });
    }
  } catch (error) {
    const labelText = t(label);
    setStatus(
      format('status.actionFailed', { label: labelText, error: error.message }),
      'error',
      'status.actionFailed',
      { label: labelText, error: error.message }
    );
  } finally {
    setBusy(false);
  }
}

// --- Data loading ---

export async function loadConfig() {
  const [configData, generatedData, logsData, downloadData] = await Promise.all([
    api('/api/config'),
    api('/api/runtime/generated'),
    api('/api/runtime/logs'),
    api('/api/kernel/download')
  ]);
  latestData = {
    config: configData.config,
    subscription: configData.subscription,
    availableOutbounds: configData.availableOutbounds || [],
    runtime: configData.runtime,
    kernel: configData.kernel,
    architecture: configData.architecture || { stored: false },
    plannedKernel: configData.plannedKernel || null,
    releaseList: configData.releaseList || [],
    generated: generatedData,
    logs: logsData,
    download: downloadData
  };
  return latestData;
}

// --- Navigation shell ---

const NAV_ITEMS = [
  { id: 'dashboard', labelKey: 'nav.dashboard', eyebrowKey: 'nav.dashboard', icon: 'dashboard', href: '/dashboard.html' },
  { id: 'kernel', labelKey: 'nav.kernel', eyebrowKey: 'nav.kernel', icon: 'kernel', href: '/kernel.html' },
  { id: 'config', labelKey: 'nav.config', eyebrowKey: 'nav.config', icon: 'config', href: '/config.html' },
  { id: 'logs', labelKey: 'nav.logs', eyebrowKey: 'nav.logs', icon: 'logs', href: '/logs.html' },
  { id: 'nodes', labelKey: 'nav.nodes', eyebrowKey: 'nav.nodes', icon: 'nodes', href: '/nodes.html' }
];

const ICONS = {
  dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  kernel: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><line x1="9" y1="15" x2="15" y2="15"/><path d="M9 9h6v6H9z"/></svg>',
  config: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  logs: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>',
  nodes: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="20" cy="8" r="2"/><circle cx="4" cy="16" r="2"/><circle cx="20" cy="16" r="2"/><line x1="6" y1="8" x2="10" y2="10.5"/><line x1="18" y1="8" x2="14" y2="10.5"/><line x1="6" y1="16" x2="10" y2="13.5"/><line x1="18" y1="16" x2="14" y2="13.5"/></svg>'
};

function renderNavLinks(activePage, variant) {
  const linkClass = variant === 'sidebar' ? 'sidebar-link' : 'menu-link';
  return NAV_ITEMS.map((item) => `
    <a href="${item.href}" class="${linkClass}${item.id === activePage ? ' is-active' : ''}" data-page="${item.id}" aria-current="${item.id === activePage ? 'page' : 'false'}">
      <span class="${variant}-icon">${ICONS[item.icon]}</span>
      <span class="${variant}-text">
        <span class="${variant}-label" data-i18n="${item.labelKey}">${t(item.labelKey)}</span>
        ${variant === 'sidebar' ? `<span class="sidebar-eyebrow" data-i18n="${item.eyebrowKey}">${t(item.eyebrowKey)}</span>` : ''}
      </span>
    </a>
  `).join('');
}

function injectMenuBar(activePage) {
  const menu = document.getElementById('menu-bar');
  if (!menu) return;
  const activeItem = NAV_ITEMS.find((item) => item.id === activePage) || NAV_ITEMS[0];
  menu.innerHTML = `
    <div class="menu-brand">
      <button id="sidebar-toggle" class="menu-toggle" type="button" aria-label="${t('nav.open')}" data-i18n-aria-label="nav.open" aria-controls="sidebar" aria-expanded="false">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
      </button>
      <a class="brand-mark" href="/dashboard.html" aria-label="${t('brand.home')}" data-i18n-aria-label="brand.home">
        <span class="brand-logo">S5</span>
        <span class="brand-copy">
          <span class="brand-title">sub2socks5</span>
          <span class="brand-subtitle" data-i18n="${activeItem.eyebrowKey}">${t(activeItem.eyebrowKey)}</span>
        </span>
      </a>
    </div>
    <nav class="menu-nav" aria-label="${t('nav.primary')}" data-i18n-aria-label="nav.primary">
      ${renderNavLinks(activePage, 'menu')}
    </nav>
    <div id="language-toggle" class="language-toggle" role="group" aria-label="${t('language.switch')}" data-i18n-aria-label="language.switch">
      <button type="button" class="language-option" data-language-toggle="zh" aria-pressed="false">中文</button>
      <button type="button" class="language-option" data-language-toggle="en" aria-pressed="false">English</button>
    </div>
  `;
  setupLanguageToggle();
  updateLanguageToggle();
}

function injectSidebar(activePage) {
  const nav = document.getElementById('sidebar');
  if (!nav) return;

  nav.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">S5</div>
      <div>
        <span class="sidebar-title">sub2socks5</span>
        <span class="sidebar-caption" data-i18n="sidebar.caption">${t('sidebar.caption')}</span>
      </div>
    </div>
    <nav class="sidebar-nav" aria-label="${t('nav.sidebar')}" data-i18n-aria-label="nav.sidebar">
      ${renderNavLinks(activePage, 'sidebar')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-status-dot" id="sidebar-status-dot"></div>
      <span class="sidebar-status-label" id="sidebar-status-label">${t('status.stopped')}</span>
    </div>
  `;
}

function updateSidebarStatus() {
  const dot = document.getElementById('sidebar-status-dot');
  const label = document.getElementById('sidebar-status-label');
  if (!dot || !label) return;
  const running = latestData.runtime?.running;
  dot.className = `sidebar-status-dot ${running ? 'is-running' : ''}`;
  label.textContent = running ? t('status.running') : t('status.stopped');
}

function setupLanguageToggle() {
  document.querySelectorAll('[data-language-toggle]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.languageToggle));
  });
}

function updateLanguageToggle() {
  document.querySelectorAll('[data-language-toggle]').forEach((button) => {
    const active = button.dataset.languageToggle === currentLanguage;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

// --- Mobile sidebar toggle ---

function setupSidebarToggle() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!toggle || !sidebar) return;

  const setOpen = (isOpen) => {
    sidebar.classList.toggle('is-open', isOpen);
    overlay?.classList.toggle('is-visible', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  };

  toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('is-open')));

  overlay?.addEventListener('click', () => setOpen(false));
}

// --- Init layout ---

export function initLayout(activePage) {
  injectMenuBar(activePage);
  injectSidebar(activePage);
  setupSidebarToggle();
  statusBar = document.getElementById('status-bar');
  busyTargets = [...document.querySelectorAll('.actions button, .section-heading-actions button, .page-actions button')];
  applyTranslations();
  updateSidebarStatus();
}

export function refreshSidebarStatus() {
  updateSidebarStatus();
}

// --- Helper for outbound select in HTML ---

export function inferDnsPreset(remoteUrl = '') {
  if (remoteUrl === DNS_PRESET_URLS.google) return 'google';
  if (remoteUrl === DNS_PRESET_URLS.cloudflare) return 'cloudflare';
  return 'custom';
}

export function inferBootstrapPreset(value = '') {
  return DNS_BOOTSTRAP_PRESETS.includes(value) ? value : 'custom';
}

export function normalizePorts(ports) {
  if (!Array.isArray(ports) || !ports.length) {
    return [{ tag: 'socks-1', listen: '127.0.0.1', port: '', target: 'proxy', sniff: true }];
  }
  return ports.map((item, index) => ({
    tag: item.tag || `socks-${index + 1}`,
    listen: item.listen || '127.0.0.1',
    port: item.port || '',
    target: item.target || 'proxy',
    sniff: true
  }));
}
