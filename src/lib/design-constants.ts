/**
 * AI 居家設計工具的選項清單與英文視覺描述對照。
 *
 * 結構：每個選項都有 value（內部 ID）、label（中文顯示）、desc（英文視覺描述）。
 * desc 會被組進 OpenAI prompt — 用具體的視覺詞，而非中文直譯。
 */

export interface Option {
  value: string
  label: string
  desc: string
}

// ===== Step 2-1: 房屋類型 =====
export const HOME_TYPES: Option[] = [
  { value: 'apartment', label: '電梯大樓', desc: 'mid-rise apartment in modern building' },
  { value: 'townhouse', label: '透天厝', desc: 'multi-story townhouse with private floors' },
  { value: 'old-renovation', label: '老屋翻新', desc: 'renovated older home with retained character walls and updated finishes' },
  { value: 'presale', label: '預售屋', desc: 'newly-built apartment with standard developer layout' },
  { value: 'office', label: '辦公室', desc: 'home office / live-work space' },
]

// ===== Step 2-2: 坪數 =====
export const SIZE_RANGES: Option[] = [
  { value: 'tiny', label: '15 坪以下', desc: 'compact ~50 sqm space, micro-apartment scale' },
  { value: 'small', label: '15-25 坪', desc: 'compact ~70 sqm home' },
  { value: 'medium', label: '25-40 坪', desc: 'mid-size ~100 sqm family home' },
  { value: 'large', label: '40-60 坪', desc: 'spacious ~165 sqm family home' },
  { value: 'xlarge', label: '60 坪以上', desc: 'large ~200+ sqm luxury home' },
]

// ===== Step 2-3: 格局 =====
export const LAYOUTS: Option[] = [
  { value: '1br', label: '1 房', desc: '1-bedroom layout, studio-feel open plan' },
  { value: '2br', label: '2 房', desc: '2-bedroom layout with separated public and private zones' },
  { value: '3br', label: '3 房', desc: '3-bedroom layout with clear master/kids/study zoning' },
  { value: '4br', label: '4 房', desc: '4-bedroom layout, family-sized with multiple private rooms' },
  { value: 'open', label: '開放式', desc: 'fully open-plan layout with minimal partitions, flexible zoning' },
]

// ===== Step 2-4: 空間需求（多選）=====
export const SPACES: Option[] = [
  { value: 'living', label: '客廳', desc: 'living room with sofa seating area, TV wall, coffee table' },
  { value: 'dining', label: '餐廳', desc: 'dining area with dining table, pendant lighting' },
  { value: 'kitchen', label: '廚房', desc: 'kitchen with countertops, cabinets, cooking zone' },
  { value: 'master', label: '主臥', desc: 'master bedroom with double bed, headboard wall, soft lighting' },
  { value: 'guest', label: '次臥', desc: 'guest bedroom, simpler styling, multi-function' },
  { value: 'kid', label: '小孩房', desc: "kid's room with playful but tasteful styling, single bed, study desk" },
  { value: 'study', label: '書房', desc: 'study / home office with desk, shelving, focused lighting' },
  { value: 'closet', label: '更衣室', desc: 'walk-in closet with organized wardrobe system, full-height mirror' },
  { value: 'entry', label: '玄關', desc: 'entryway with shoe storage, console, mirror' },
  { value: 'balcony', label: '陽台', desc: 'balcony with planters, outdoor seating, soft lighting' },
]

// ===== Step 3-1: 居住成員（多選）=====
export const RESIDENTS: Option[] = [
  { value: 'single', label: '單身', desc: 'single adult, personal-focused space' },
  { value: 'couple', label: '情侶 / 夫妻', desc: 'couple, balanced shared spaces' },
  { value: 'with-kid', label: '有小孩', desc: 'family with young children, kid-safe materials' },
  { value: 'with-elder', label: '有長輩', desc: 'multi-generational with elderly members, accessibility priority' },
  { value: 'with-pet', label: '有寵物', desc: 'pet-friendly home (cats/dogs), durable finishes' },
]

// ===== Step 3-2: 生活習慣（多選）=====
export const LIFESTYLES: Option[] = [
  { value: 'open-kitchen', label: '喜歡開放式餐廚', desc: 'open-plan kitchen connected to dining/living, social cooking' },
  { value: 'big-living', label: '喜歡大客廳', desc: 'oversized living area as the heart of the home' },
  { value: 'display', label: '需要展示空間', desc: 'curated display shelving for collectibles, books, art' },
  { value: 'entertain', label: '常招待朋友', desc: 'designed for entertaining, larger dining, bar / drink corner' },
  { value: 'wfh', label: '居家工作', desc: 'dedicated home-office area, ergonomic, quiet zoning' },
  { value: 'cooking', label: '熱愛料理', desc: 'serious cook kitchen with island, pro appliances, prep zones' },
]

// ===== Step 3-3: 收納需求（多選）=====
export const STORAGE_NEEDS: Option[] = [
  { value: 'heavy', label: '大量收納', desc: 'maximized concealed storage, floor-to-ceiling cabinetry' },
  { value: 'hidden', label: '隱藏收納', desc: 'handleless flush cabinets, push-to-open, seamless walls' },
  { value: 'display', label: '展示櫃', desc: 'glass-front display cabinets with internal lighting' },
  { value: 'shoe-wall', label: '鞋牆', desc: 'full-height shoe wall at entryway' },
  { value: 'system', label: '系統家具', desc: 'modular system furniture, custom built-ins' },
]

// ===== Step 3-4: 特殊需求（多選）=====
export const SPECIAL_NEEDS: Option[] = [
  { value: 'robot-vacuum', label: '掃地機器人友善', desc: 'raised furniture, no thresholds, robot-vacuum friendly layout' },
  { value: 'cat-proof', label: '貓抓耐磨材質', desc: 'scratch-resistant fabrics and durable wall finishes' },
  { value: 'elderly', label: '老人友善', desc: 'no-step flooring, grab bars, anti-slip surfaces, wider walkways' },
  { value: 'accessible', label: '無障礙', desc: 'wheelchair accessible, wider doors, accessible bathroom' },
  { value: 'sound', label: '隔音強化', desc: 'acoustic treatments, sound-isolated bedrooms' },
  { value: 'eco', label: '環保建材', desc: 'low-VOC and eco-friendly materials throughout' },
]

// ===== Step 4-1: 風格 =====
export const STYLES: Option[] = [
  { value: 'modern-minimal', label: '現代簡約', desc: 'modern minimalist, clean lines, neutral palette, minimal ornamentation, restrained' },
  { value: 'cream', label: '奶油風', desc: 'cream-tone aesthetic, soft beige and ivory, rounded furniture corners, warm 3000K lighting, gentle' },
  { value: 'modern-luxury', label: '輕奢', desc: 'modern luxury, brushed brass accents, marble surfaces, velvet textures, refined elegance' },
  { value: 'nordic', label: '北歐', desc: 'scandinavian, light oak and birch wood, white walls, functional minimalism, hygge atmosphere' },
  { value: 'wabisabi', label: '侘寂', desc: 'wabi-sabi, raw plaster and microcement walls, weathered wood, muted earth tones, asymmetric and imperfect beauty' },
  { value: 'midcentury', label: 'Mid-century Modern', desc: 'mid-century modern, walnut wood, tapered legs, graphic textiles, 50s-60s silhouettes' },
  { value: 'japanese', label: '日式', desc: 'Japanese, tatami, shoji-inspired screens, low furniture, cedar wood, zen minimalism' },
  { value: 'vintage', label: '中古風', desc: 'vintage / retro, mixed eras, terrazzo, curved silhouettes, warm tobacco and rust tones' },
  { value: 'industrial', label: '工業風', desc: 'industrial, exposed concrete and steel, blackened metal frames, raw textures' },
  { value: 'french', label: '法式', desc: 'French classic, wainscoting, curved moldings, soft pastels, brass hardware' },
]

// ===== Step 4-2: 色系 =====
export const COLOR_SCHEMES: Option[] = [
  { value: 'white-gray', label: '白灰', desc: 'white and grey palette, cool neutral tones (#FFFFFF, #E5E5E5, #888888)' },
  { value: 'milk-tea', label: '奶茶色', desc: 'milk tea / latte tones, warm beige to creamy white (#D4B895 to #F5EBDC)' },
  { value: 'wood', label: '木質色', desc: 'wood-tone dominant, walnut and oak hues, natural and warm' },
  { value: 'dark', label: '深色系', desc: 'dark and moody, charcoal grey, deep walnut, low-key dramatic lighting' },
  { value: 'mono', label: '黑白', desc: 'monochrome black and white, high contrast graphic feel' },
  { value: 'morandi', label: '莫蘭迪', desc: 'Morandi muted palette, dusty sage, blush pink, ash blue, soft and powdery' },
  { value: 'earth', label: '大地色', desc: 'earth tones, terracotta, ochre, sand, clay-warm' },
  { value: 'cool', label: '冷色調', desc: 'cool palette, soft blues and greens, fresh and airy' },
]

// ===== Step 4-3: 材質（多選）=====
export const MATERIALS: Option[] = [
  { value: 'marble', label: '大理石', desc: 'Carrara marble with subtle grey veins on countertops or accent walls' },
  { value: 'wood', label: '木皮', desc: 'natural wood veneer (walnut or oak) cabinetry and wall paneling' },
  { value: 'metal', label: '金屬', desc: 'metal accents (brushed brass or matte black) on hardware and frames' },
  { value: 'stone', label: '霧面石材', desc: 'matte natural stone surfaces, soft tactile finish' },
  { value: 'leather', label: '皮革', desc: 'leather upholstery (tan or cognac) on key seating' },
  { value: 'fabric', label: '布料', desc: 'soft fabric textiles, linen and bouclé textures' },
  { value: 'glass', label: '玻璃', desc: 'clear and fluted glass partitions, light-transmitting' },
  { value: 'rattan', label: '藤編', desc: 'rattan / cane weave detailing on furniture' },
  { value: 'microcement', label: '微水泥', desc: 'microcement seamless walls and floors, contemporary raw look' },
  { value: 'terrazzo', label: '磨石子', desc: 'terrazzo flooring with mixed aggregate chips' },
]

// ===== 配額 =====
export const DEFAULT_DAILY_QUOTA = 5

export function getDailyQuota(): number {
  const raw = process.env.DESIGN_DAILY_QUOTA
  const parsed = raw ? parseInt(raw, 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_QUOTA
}

// ===== Conditions schema (what we save to DB + receive from frontend) =====
export interface DesignConditions {
  homeType: string
  size: string
  layout: string
  spaces: string[]
  residents: string[]
  lifestyles: string[]
  storageNeeds: string[]
  specialNeeds: string[]
  style: string
  colorScheme: string
  materials: string[]
  freeformNotes?: string  // 使用者額外自由文字補充
}

// ===== Lookup helpers =====
export function findOption(list: Option[], value: string): Option | undefined {
  return list.find((o) => o.value === value)
}

export function findOptions(list: Option[], values: string[]): Option[] {
  return values.map((v) => list.find((o) => o.value === v)).filter((o): o is Option => !!o)
}

export function describeList(list: Option[], values: string[]): string {
  return findOptions(list, values).map((o) => o.desc).join('; ')
}
