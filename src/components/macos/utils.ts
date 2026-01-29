// components/macos/utils.ts

export function clsx(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatTime(date: Date) {
  // 简单的 macOS 风格时间格式化
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const day = days[date.getDay()];
  const month = date.getMonth() + 1;
  const d = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes().toString().padStart(2, '0');
  
  return `${month}月${d}日 ${day} ${hour}:${minute}`;
}