export type AsciiCharacterSet = 
  | 'ascii'        // Ascii Only
  | 'extended'     // Extended Character Set
  | 'boxonly'      // All Box Shapes
  | 'block'        // Block Style
  | 'outline'      // Outline Shapes
  | 'slash'        // Slashes & Dashes
  | 'oldskool'     // Oldskool/Amiga
  | 'braille'      // Braille
  | 'hebrew'       // Hebrew
  | 'greek'        // Greek
  | 'hangul'       // Hangul
  | 'sjis'         // Shift-JIS
  | 'custom';      // Custom

export type ColorMode = 
  | 'wonb'         // White on Black
  | 'bonw'         // Black on White
  | 'c16'          // Retro/16 Colors
  | 'color';       // Full Color

export type SizePreset =
  | 'signature'    // 120x4
  | 'tag'          // 80x30
  | 'post'         // 100x50
  | 'letter'       // 200x100
  | 'wallpaper'    // 300x78
  | 'tshirt'       // 412x108
  | 'poster'       // 600x310
  | 'custom';      // Custom

export interface AsciiOptions {
  // 尺寸设置
  sizePreset: SizePreset
  customWidth: number
  customHeight: number
  
  // 字符集设置
  characterSet: AsciiCharacterSet
  customCharset: string
  
  // 颜色设置
  colorMode: ColorMode
  transparentBg: boolean
  
  // 图像处理
  contrast: number      // 对比度
  sharpness: number    // 锐度
  colorize: number     // 颜色化程度 (0-255)
  blackPoint: number   // 黑点 (0-180)
  whitePoint: number   // 白点 (181-255)
}

export interface AsciiResult {
  asciiText: string
  colorAscii?: string  // HTML with colors
  bbCode?: string      // BBCode for forums
  htmlCode?: string    // HTML code
  markdown?: string    // Markdown/Reddit format
  imageUrl?: string    // Generated image data URL
  width: number
  height: number
  originalSize: string
  processingTime: number
}

export interface GalleryItem {
  id: string
  title: string
  description: string
  imageUrl: string
  asciiUrl?: string
  category: 'photos' | 'graphics' | 'selfies' | 'artwork'
  createdAt: string
}