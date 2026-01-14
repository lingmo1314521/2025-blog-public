export type Language = 'en' | 'zh' | 'mix'

export const TRANSLATIONS = {
  en: {
    // Identity
    'login_user_name': 'LynxMuse',
    'login_placeholder': 'Enter Password',
    'click_to_sleep': 'Click to Sleep',
    
    // Apps
    'finder': 'Finder',
    'launchpad': 'Launchpad',
    'safari': 'Safari',
    'terminal': 'Terminal',
    'mail': 'Mail',
    'calendar': 'Calendar',
    'calculator': 'Calculator',
    'music': 'Music',
    'notes': 'Notes',
    'vscode': 'VS Code',
    'settings': 'Settings',
    'about': 'About',
    'storage_manager': 'Disk Manager',

    // System Menu
    'about_mac': 'About This Portfolio',
    'sys_settings': 'System Settings...',
    'sleep': 'Sleep',
    'restart': 'Restart...',
    'shutdown': 'Shut Down...',
    'lock_screen': 'Lock Screen',
    'log_out': 'Log Out...',

    // Menu Bar
    'file': 'File', 'edit': 'Edit', 'view': 'View', 'window': 'Window', 'help': 'Help',
    'new_window': 'New Window', 'close_window': 'Close Window',
    'enter_fullscreen': 'Enter Full Screen', 'exit_fullscreen': 'Exit Full Screen', 
    'minimize': 'Minimize', 'zoom': 'Zoom', 'bring_all_front': 'Bring All to Front',
    'search_help': 'Search Help',
    'app_settings': 'Settings...', 'hide_app': 'Hide', 'quit_app': 'Quit',

    // Generic Actions
    'search': 'Search',
    'search_placeholder': 'Search...',
    'cancel': 'Cancel',
    'add': 'Add',
    'delete': 'Delete',
    'rename': 'Rename',
    'download': 'Download',
    'upload': 'Upload',
    'refresh': 'Refresh',

    // Context Menu
    'ctx_open': 'Open',
    'ctx_refresh': 'Refresh Pages',
    'ctx_wallpaper': 'Change Wallpaper',
    'ctx_edit': 'Edit File',
    
    // Finder / Storage
    'fd_favorites': 'Favorites',
    'fd_locations': 'Locations',
    'fd_tags': 'Tags',
    'fd_airdrop': 'AirDrop',
    'fd_recents': 'Recents',
    'fd_applications': 'Applications',
    'fd_desktop': 'Desktop',
    'fd_documents': 'Documents',
    'fd_downloads': 'Downloads',
    'fd_icloud': 'iCloud Drive',
    'fd_macintosh_hd': 'Macintosh HD',
    'fd_network': 'Network',
    'fd_items': 'items',
    'fd_format_disk': 'Format Disk (Reset)',
    'fd_name': 'Name',
    'fd_date': 'Date Modified',
    'fd_size': 'Size',
    'fd_kind': 'Kind',
    'folder': 'Folder',
    'file': 'File',
    'app': 'Application',
    'fm_no_files': 'No files found',

    // VS Code
    'explorer': 'EXPLORER',
    'search_files': 'SEARCH',
    'user_settings': 'User Settings',
    'new_file': 'New File',
    'new_folder': 'New Folder',
    'export_zip': 'Export ZIP',
    'import_file': 'Import File',
    'editor_preview': 'Preview',
    'editor_run': 'Run',
    'editor_ln': 'Ln',
    'editor_col': 'Col',
    'console_terminal': 'TERMINAL',
    'console_ready': 'Console Ready',
    'select_to_start': 'Select a file to start editing',
    'font_size': 'Font Size',
    'word_wrap': 'Word Wrap',
    'line_numbers': 'Line Numbers',
    'minimap': 'Minimap',

    // Browser
    'browser_search': 'Search or enter website name',
    'browser_favorites': 'Favorites',
    'browser_privacy': 'Privacy Report',
    'new_tab': 'New Tab',

    // Notes
    'new_note': 'New Note',
    'no_note': 'No note selected',
    'type_here': 'Type here...',
    'notes_title': 'Notes',

    // Mail
    'inbox': 'Inbox', 'sent': 'Sent', 'trash': 'Trash',
    'no_mail': 'No Mail Selected',
    'mail_sent': 'Email sent successfully!', 
    'mail_deleted': 'Email moved to Trash',
    'mail_to_me': 'To: LynxMuse <lynx@macos.web>',

    // Calendar & Clock
    'today': 'Today',
    'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April', 'may': 'May', 'jun': 'June',
    'jul': 'July', 'aug': 'August', 'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December',
    'sun': 'Sun', 'mon': 'Mon', 'tue': 'Tue', 'wed': 'Wed', 'thu': 'Thu', 'fri': 'Fri', 'sat': 'Sat',
    
    // Control Center
    'wifi': 'Wi-Fi', 'bluetooth': 'Bluetooth', 'dnd': 'Do Not Disturb',
    'display': 'Display', 'sound': 'Sound', 'music_player': 'Music',
    'battery': 'Battery',
    'control_center': 'Control Center',
    'not_playing': 'Not Playing',
    'music_playing': 'Music Player',

    // Settings
    'wallpaper': 'Wallpaper', 'language': 'Language', 'click_apply': 'Click to apply',

    // About
    'about_title': 'LynxMuse Portfolio',
    'about_version': 'Version 2.0 (macOS Web)',
    'processor': 'Processor', 'processor_desc': 'Human Brain (Bio-Neural)',
    'memory': 'Memory', 'memory_desc': 'Limited & Volatile',
    'graphics': 'Graphics', 'graphics_desc': 'Real Vision Pro',
    'rights': '© 2026 LynxMuse. All rights reserved.',
    
    // Spotlight
    'spotlight_placeholder': 'Spotlight Search',

    // Doc Viewer
    'invalid_link': 'Invalid Link',
    'edit_mode': 'Edit Mode',
    'read_mode': 'Read Mode',
    'loading_doc': 'Loading Document...',
    'loading': 'Loading...',
    
    // Terminal
    'term_welcome': 'Welcome to LynxMuse Terminal. Type "help" to see commands.',
    'term_login': 'Last login: Today on console',
    'term_cmd_not_found': 'command not found',
    'term_permission_denied': 'Permission denied',
    'term_help_header': 'Available commands:',
    'term_sudo_joke': 'LynxMuse is not in the sudoers file. This incident will be reported.',
    'term_prompt_user': 'lynx',
    'term_is_dir': 'is a directory',
    'term_no_such': 'no such file or directory',
    'term_dir_exists': 'File exists',
    'term_rm_joke': 'Nice try.',
  },
  zh: {
    // 身份
    'login_user_name': '翎',
    'login_placeholder': '输入密码',
    'click_to_sleep': '点击休眠',

    // 应用名称
    'finder': '博客归档',
    'launchpad': '启动台',
    'safari': '浏览器',
    'terminal': '终端',
    'mail': '邮件',
    'calendar': '日历',
    'calculator': '计算器',
    'music': '音乐',
    'notes': '备忘录',
    'vscode': 'VS Code',
    'settings': '设置',
    'about': '关于',
    'storage_manager': '访达', 

    // 系统菜单
    'about_mac': '关于本站',
    'sys_settings': '系统设置...',
    'sleep': '睡眠',
    'restart': '重新启动...',
    'shutdown': '关机...',
    'lock_screen': '锁定屏幕',
    'log_out': '退出登录...',

    // 菜单栏
    'file': '文件', 'edit': '编辑', 'view': '显示', 'window': '窗口', 'help': '帮助',
    'new_window': '新建窗口', 'close_window': '关闭窗口',
    'enter_fullscreen': '进入全屏', 'exit_fullscreen': '退出全屏', 
    'minimize': '最小化', 'zoom': '缩放', 'bring_all_front': '前置全部窗口',
    'search_help': '搜索帮助',
    'app_settings': '设置...', 'hide_app': '隐藏', 'quit_app': '退出',

    // 通用操作
    'search': '搜索',
    'search_placeholder': '搜索...',
    'cancel': '取消',
    'add': '添加',
    'delete': '删除',
    'rename': '重命名',
    'download': '下载',
    'upload': '上传',
    'refresh': '刷新',

    // 右键菜单
    'ctx_open': '打开',
    'ctx_refresh': '刷新页面',
    'ctx_wallpaper': '更换壁纸',
    'ctx_edit': '编辑文件',

    // Finder / Storage
    'fd_favorites': '个人收藏',
    'fd_locations': '位置',
    'fd_tags': '标签',
    'fd_airdrop': '隔空投送',
    'fd_recents': '最近使用',
    'fd_applications': '应用程序',
    'fd_desktop': '桌面',
    'fd_documents': '文稿',
    'fd_downloads': '下载',
    'fd_icloud': 'iCloud 云盘',
    'fd_macintosh_hd': 'Macintosh HD',
    'fd_network': '网络',
    'fd_items': '项',
    'fd_format_disk': '抹掉磁盘数据 (重置)',
    'fd_name': '名称',
    'fd_date': '修改日期',
    'fd_size': '大小',
    'fd_kind': '种类',
    'folder': '文件夹',
    'file': '文件',
    'app': '应用程序',
    'fm_no_files': '暂无文件',

    // VS Code
    'explorer': '资源管理器',
    'search_files': '搜索',
    'user_settings': '用户设置',
    'new_file': '新建文件',
    'new_folder': '新建文件夹',
    'export_zip': '导出 ZIP',
    'import_file': '导入文件',
    'editor_preview': '预览',
    'editor_run': '运行',
    'editor_ln': '行',
    'editor_col': '列',
    'console_terminal': '终端',
    'console_ready': '控制台就绪',
    'select_to_start': '选择一个文件以开始编辑',
    'font_size': '字体大小',
    'word_wrap': '自动换行',
    'line_numbers': '行号显示',
    'minimap': '代码缩略图',

    // Browser
    'browser_search': '搜索或输入网站名称',
    'browser_favorites': '个人收藏',
    'browser_privacy': '隐私报告',
    'new_tab': '新标签页',

    // Notes
    'new_note': '新建备忘录',
    'no_note': '未选择备忘录',
    'type_here': '在此输入...',
    'notes_title': '备忘录',

    // Mail
    'inbox': '收件箱', 'sent': '已发送', 'trash': '废纸篓',
    'no_mail': '未选择邮件',
    'mail_sent': '邮件发送成功！', 
    'mail_deleted': '邮件已移至废纸篓',
    'mail_to_me': '收件人: 翎 <lynx@macos.web>',

    // Calendar & Clock
    'today': '今天',
    'jan': '一月', 'feb': '二月', 'mar': '三月', 'apr': '四月', 'may': '五月', 'jun': '六月',
    'jul': '七月', 'aug': '八月', 'sep': '九月', 'oct': '十月', 'nov': '十一月', 'dec': '十二月',
    'sun': '周日', 'mon': '周一', 'tue': '周二', 'wed': '周三', 'thu': '周四', 'fri': '周五', 'sat': '周六',

    // Control Center
    'wifi': '无线局域网', 'bluetooth': '蓝牙', 'dnd': '勿扰模式',
    'display': '显示器', 'sound': '声音', 'music_player': '音乐',
    'battery': '电池',
    'control_center': '控制中心',
    'not_playing': '未在播放',
    'music_playing': '音乐播放器',

    // Settings
    'wallpaper': '壁纸', 'language': '语言', 'click_apply': '点击即可应用',

    // About
    'about_title': 'LynxMuse 个人主页',
    'about_version': '版本 2.0 (macOS Web)',
    'processor': '处理器', 'processor_desc': '人类大脑 (生物神经网络)',
    'memory': '内存', 'memory_desc': '有限且易失',
    'graphics': '显卡', 'graphics_desc': 'Real Vision Pro',
    'rights': '© 2026 翎. 保留所有权利.',

    // Spotlight
    'spotlight_placeholder': '聚焦搜索',

    // Doc Viewer
    'invalid_link': '无效链接',
    'edit_mode': '编辑模式',
    'read_mode': '阅读模式',
    'loading_doc': '加载文档中...',
    'loading': '加载中...',

    // Terminal
    'term_welcome': '欢迎使用 LynxMuse 终端。输入 "help" 查看可用命令。',
    'term_login': '上次登录时间: 今天 ttys000',
    'term_cmd_not_found': '找不到命令',
    'term_permission_denied': '权限被拒绝',
    'term_help_header': '可用命令:',
    'term_sudo_joke': 'LynxMuse 不在 sudoers 文件中。此事将被报告。',
    'term_prompt_user': 'lynx',
    'term_is_dir': '是一个目录',
    'term_no_such': '没有那个文件或目录',
    'term_dir_exists': '文件已存在',
    'term_rm_joke': '想得美。',
  },
  mix: {
      // 混合模式，fallback 到英文
      // 可以在这里自定义混合模式的特殊翻译
  }
}