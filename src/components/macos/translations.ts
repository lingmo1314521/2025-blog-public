// components/macos/translations.ts
export type Language = 'en' | 'zh' | 'mix'

export const TRANSLATIONS = {
  en: {
    // --- Identity ---
    'login_user_name': 'LynxMuse',
    'login_placeholder': 'Enter Password',
    'click_to_sleep': 'Click to Sleep',
    
    // --- Apps Names ---
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
    'about': 'About Lynx',
    'text-editor': 'TextEdit',

    // --- System Menu ---
    'about_mac': 'About This Portfolio',
    'sys_settings': 'System Settings...',
    'sleep': 'Sleep',
    'restart': 'Restart...',
    'shutdown': 'Shut Down...',
    'lock_screen': 'Lock Screen',
    'log_out': 'Log Out LynxMuse...',

    // --- Top Bar ---
    'file': 'File', 'edit': 'Edit', 'view': 'View', 'window': 'Window', 'help': 'Help',
    'new_window': 'New Window', 'new_folder': 'New Folder', 'open': 'Open...', 
    'close_window': 'Close Window',
    'undo': 'Undo', 'redo': 'Redo', 'cut': 'Cut', 'copy': 'Copy', 'paste': 'Paste', 'select_all': 'Select All',
    'enter_fullscreen': 'Enter Full Screen', 'exit_fullscreen': 'Exit Full Screen', 
    'actual_size': 'Actual Size', 'zoom_in': 'Zoom In', 'zoom_out': 'Zoom Out',
    'minimize': 'Minimize', 'zoom': 'Zoom', 'bring_all_front': 'Bring All to Front',
    'search_help': 'Search', 'get_help': 'Get Help',
    'about_app': 'About', 'hide_app': 'Hide', 'hide_others': 'Hide Others', 'show_all': 'Show All', 'quit_app': 'Quit',

    // --- Finder ---
    'favorites': 'Favorites', 'all_posts': 'All Posts', 'recent': 'Recent', 
    'drafts': 'Drafts', 'locations': 'Locations', 'icloud': 'iCloud Drive', 
    'downloads': 'Downloads', 'folder_empty': 'Folder is empty', 'items': 'items', 
    'loading': 'Loading...',
    
    // --- Context Menu ---
    'ctx_open': 'Open', 'ctx_edit': 'Edit Post...', 'ctx_delete': 'Delete',
    'ctx_refresh': 'Refresh', 'ctx_wallpaper': 'Change Wallpaper',

    // --- DocViewer ---
    'read_mode': 'Read Mode', 'edit_mode': 'Edit Mode', 'invalid_link': 'Invalid Link',
    'loading_doc': 'Loading Document...',

    // --- General ---
    'search': 'Search', 'wifi': 'Wi-Fi', 'bluetooth': 'Bluetooth', 'dnd': 'Do Not Disturb',
    'display': 'Display', 'sound': 'Sound', 'battery': 'Battery',
    'control_center': 'Control Center', 'spotlight_placeholder': 'Spotlight Search',
    'click_apply': 'Click to apply instantly', 'new_tab': 'New Tab',
    'language': 'Language', 'wallpaper': 'Wallpaper',
    'not_playing': 'Not Playing', 'music_playing': 'Music Player',

    // --- Terminal ---
    'term_welcome': 'Welcome to LynxMuse Terminal. Type "help" to see commands.',
    'term_login': 'Last login: Today on console',
    'term_cmd_not_found': 'command not found',
    'term_permission_denied': 'Permission denied',
    'term_dir_exists': 'Directory already exists',
    'term_file_exists': 'File already exists',
    'term_no_such': 'No such file or directory',
    'term_is_dir': 'is a directory',
    'term_help_header': 'Available commands:',
    'term_sudo_joke': 'LynxMuse is not in the sudoers file. This incident will be reported.',
    'term_rm_joke': "I'm sorry, Lynx. I'm afraid I can't do that.",
    'term_prompt_user': 'lynx',

    // --- Mail ---
    'inbox': 'Inbox', 'sent': 'Sent', 'trash': 'Trash', 'no_mail': 'No Mail Selected',
    'mail_sent': 'Email sent successfully!', 'mail_deleted': 'Email moved to Trash',
    'mail_to_me': 'To: LynxMuse <lynx@macos.web>',

    // --- Calendar ---
    'today': 'Today',
    'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April', 'may': 'May', 'jun': 'June',
    'jul': 'July', 'aug': 'August', 'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December',
    'sun': 'Sun', 'mon': 'Mon', 'tue': 'Tue', 'wed': 'Wed', 'thu': 'Thu', 'fri': 'Fri', 'sat': 'Sat',

    // --- Notes ---
    'notes_title': 'Notes', 'new_note': 'New Note', 'type_here': 'Type here...', 'no_note': 'No note selected',

    // --- About ---
    'about_title': 'My Portfolio',
    'about_version': 'Version 2.0 (macOS Edition)',
    'processor': 'Processor', 'processor_desc': 'Human Brain 1.0 (Lynx Core)',
    'memory': 'Memory', 'memory_desc': 'Limited & Volatile',
    'graphics': 'Graphics', 'graphics_desc': 'Real Vision Pro',
    'rights': '© 2026 LynxMuse (Ling). All rights reserved.',
  },
  zh: {
    // --- Identity ---
    'login_user_name': '翎',
    'login_placeholder': '输入密码',
    'click_to_sleep': '点击休眠',

    // --- Apps Names ---
    'finder': '访达', 'launchpad': '启动台', 'safari': 'Safari浏览器', 'terminal': '终端',
    'mail': '邮件', 'calendar': '日历', 'calculator': '计算器', 'music': '音乐',
    'notes': '备忘录', 'vscode': 'VS Code', 'settings': '系统设置', 'about': '关于翎',
    'text-editor': '文本编辑',

    // --- System Menu ---
    'about_mac': '关于本站',
    'sys_settings': '系统设置...',
    'sleep': '睡眠',
    'restart': '重启...',
    'shutdown': '关机...',
    'lock_screen': '锁定屏幕',
    'log_out': '退出 LynxMuse...',

    // --- Top Bar ---
    'file': '文件', 'edit': '编辑', 'view': '显示', 'window': '窗口', 'help': '帮助',
    'new_window': '新建窗口', 'new_folder': '新建文件夹', 'open': '打开...', 'close_window': '关闭窗口',
    'undo': '撤销', 'redo': '重做', 'cut': '剪切', 'copy': '拷贝', 'paste': '粘贴', 'select_all': '全选',
    'enter_fullscreen': '进入全屏', 'exit_fullscreen': '退出全屏', 'actual_size': '实际大小', 'zoom_in': '放大', 'zoom_out': '缩小',
    'minimize': '最小化', 'zoom': '缩放', 'bring_all_front': '前置全部窗口',
    'search_help': '搜索', 'get_help': '获取帮助',
    'about_app': '关于', 'hide_app': '隐藏', 'hide_others': '隐藏其他', 'show_all': '显示全部', 'quit_app': '退出',
    
    // --- Finder ---
    'favorites': '个人收藏', 'all_posts': '所有文章', 'recent': '最近使用', 'drafts': '草稿',
    'locations': '位置', 'icloud': 'iCloud 云盘', 'downloads': '下载',
    'folder_empty': '文件夹为空', 'items': '项', 'loading': '加载中...',
    
    // --- Context Menu ---
    'ctx_open': '打开', 'ctx_edit': '编辑文章...', 'ctx_delete': '删除',
    'ctx_refresh': '刷新', 'ctx_wallpaper': '更换壁纸',

    // --- DocViewer ---
    'read_mode': '阅读模式', 'edit_mode': '编辑模式', 'invalid_link': '无效链接',
    'loading_doc': '正在加载文档...',

    // --- General ---
    'search': '搜索', 'wifi': '无线局域网', 'bluetooth': '蓝牙', 'dnd': '勿扰模式',
    'display': '显示器', 'sound': '声音', 'battery': '电池',
    'control_center': '控制中心', 'spotlight_placeholder': '聚焦搜索',
    'click_apply': '点击即可立即应用', 'new_tab': '新标签页',
    'language': '语言', 'wallpaper': '壁纸',
    'not_playing': '未在播放', 'music_playing': '音乐播放器',

    // --- Terminal ---
    'term_welcome': '欢迎使用 LynxMuse 终端。输入 "help" 查看可用命令。',
    'term_login': '上次登录时间: 今天 ttys000',
    'term_cmd_not_found': '找不到命令',
    'term_permission_denied': '权限被拒绝',
    'term_dir_exists': '目录已存在',
    'term_file_exists': '文件已存在',
    'term_no_such': '没有此文件或目录',
    'term_is_dir': '是一个目录',
    'term_help_header': '可用命令:',
    'term_sudo_joke': 'LynxMuse 不在 sudoers 文件中。此事将被报告。',
    'term_rm_joke': '抱歉，翎。我恐怕不能这样做。',
    'term_prompt_user': 'lynx',

    // --- Mail ---
    'inbox': '收件箱', 'sent': '已发送', 'trash': '废纸篓', 'no_mail': '未选择邮件',
    'mail_sent': '邮件发送成功！', 'mail_deleted': '邮件已移至废纸篓',
    'mail_to_me': '收件人: 翎 <lynx@macos.web>',

    // --- Calendar ---
    'today': '今天',
    'jan': '一月', 'feb': '二月', 'mar': '三月', 'apr': '四月', 'may': '五月', 'jun': '六月',
    'jul': '七月', 'aug': '八月', 'sep': '九月', 'oct': '十月', 'nov': '十一月', 'dec': '十二月',
    'sun': '周日', 'mon': '周一', 'tue': '周二', 'wed': '周三', 'thu': '周四', 'fri': '周五', 'sat': '周六',

    // --- Notes ---
    'notes_title': '备忘录', 'new_note': '新建备忘录', 'type_here': '在此输入...', 'no_note': '未选择备忘录',

    // --- About ---
    'about_title': '我的主页',
    'about_version': '版本 2.0 (macOS Edition)',
    'processor': '处理器', 'processor_desc': '人类大脑 1.0 (Lynx 核心)',
    'memory': '内存', 'memory_desc': '有限且易失',
    'graphics': '显卡', 'graphics_desc': '真实视觉 Pro',
    'rights': '© 2026 LynxMuse (翎). 保留所有权利.',
  },
  mix: {
    // 混合模式：关键UI保留双语，其他回退到英文
    'finder': 'Finder 访达', 'launchpad': 'Launchpad 启动台', 'safari': 'Safari 浏览器', 'terminal': 'Terminal 终端',
    'mail': 'Mail 邮件', 'calendar': 'Calendar 日历', 'calculator': 'Calculator 计算器', 'music': 'Music 音乐',
    'notes': 'Notes 备忘录', 'vscode': 'VS Code', 'settings': 'Settings 设置', 'about': 'About 翎',
    'login_user_name': 'LynxMuse (翎)',
    'file': 'File 文件', 'edit': 'Edit 编辑', 'view': 'View 显示', 'window': 'Window 窗口', 'help': 'Help 帮助',
    'favorites': 'Favorites 个人收藏', 'all_posts': 'Posts 所有文章',
    'about_mac': 'About This Portfolio 关于本站',
    'search': 'Search 搜索',
    'term_welcome': 'Welcome. 输入 "help" for commands.',
    'term_cmd_not_found': 'command not found 找不到命令',
    'rights': '© 2026 LynxMuse (翎). All rights reserved.',
  }
}