import OpenAI, { toFile } from 'openai'
import type {
  DesignConditions,
} from './design-constants'
import {
  HOME_TYPES,
  SIZE_RANGES,
  LAYOUTS,
  SPACES,
  RESIDENTS,
  LIFESTYLES,
  STORAGE_NEEDS,
  SPECIAL_NEEDS,
  STYLES,
  COLOR_SCHEMES,
  MATERIALS,
  findOption,
  findOptions,
  describeList,
} from './design-constants'

// ===== Lazy client =====
let client: OpenAI | null = null
function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
    client = new OpenAI({ apiKey })
  }
  return client
}

/** Returns the image model id to use. Override via OPENAI_IMAGE_MODEL env. */
export function getImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2'
}

// ===== Prompt Builder =====
export function buildDesignPrompt(conditions: DesignConditions): string {
  const homeType = findOption(HOME_TYPES, conditions.homeType)?.desc || 'residential home'
  const size = findOption(SIZE_RANGES, conditions.size)?.desc || 'mid-size home'
  const layout = findOption(LAYOUTS, conditions.layout)?.desc || 'standard layout'

  const selectedSpaces = findOptions(SPACES, conditions.spaces)
  const spacesCount = Math.min(selectedSpaces.length, 6) // cap at 6 for visual clarity
  const spacesToRender = selectedSpaces.slice(0, spacesCount)

  const residentsDesc = describeList(RESIDENTS, conditions.residents) || 'residents'
  const lifestylesDesc = describeList(LIFESTYLES, conditions.lifestyles) || 'comfortable everyday living'
  const storageDesc = describeList(STORAGE_NEEDS, conditions.storageNeeds) || 'adequate storage'
  const specialDesc = describeList(SPECIAL_NEEDS, conditions.specialNeeds) || 'no special requirements'

  const styleDesc = findOption(STYLES, conditions.style)?.desc || 'modern minimalist'
  const colorDesc = findOption(COLOR_SCHEMES, conditions.colorScheme)?.desc || 'warm neutral palette'
  const materialsDesc = describeList(MATERIALS, conditions.materials) || 'curated mix of natural materials'

  const spaceLines = spacesToRender
    .map((s, i) => `${i + 1}. ${s.label} (${s.value}) — ${s.desc}`)
    .join('\n')

  const extraNotes = conditions.freeformNotes?.trim()
    ? `\n[ADDITIONAL USER NOTES]\n${conditions.freeformNotes.trim()}\n`
    : ''

  return `Create a professional INTERIOR DESIGN CONCEPT BOARD — a single 16:9 landscape
presentation poster styled like a high-end design studio portfolio for a residential project.

==========================================
OVERALL LAYOUT (compose as a magazine-style poster)
==========================================
- Off-white (#F8F6F2) background with subtle paper texture.
- LEFT one-third: a clean 2D top-down floor plan illustration in architect's
  concept-sketch style — light grey walls, thin lines, simple zoning labels.
  Keep it DIAGRAMMATIC and stylized; do NOT attempt a photorealistic floor plan.
- RIGHT two-thirds: a 2x3 grid (or 2x2 if fewer spaces) of photorealistic interior
  render thumbnails, each with a small caption underneath. Renders MUST look like
  the SAME home — consistent flooring, consistent wall color temperature,
  consistent 3000K warm lighting, consistent material vocabulary throughout.
- BOTTOM strip (about 15% of image height): a horizontal MATERIAL & COLOR PALETTE —
  4-6 swatches showing key materials and color samples with thin minimal labels.

==========================================
SPACES TO RENDER (${spacesToRender.length} total)
==========================================
${spaceLines}

==========================================
HOME CONTEXT
==========================================
- Home type: ${homeType}
- Size: ${size}
- Layout: ${layout}
- Residents: ${residentsDesc}
- Lifestyle priorities: ${lifestylesDesc}
- Storage approach: ${storageDesc}
- Special requirements: ${specialDesc}

==========================================
DESIGN DIRECTION (apply globally and consistently)
==========================================
- Style: ${styleDesc}
- Color palette: ${colorDesc}
- Key materials: ${materialsDesc}
- Lighting: warm 3000K interior lighting with natural daylight from windows
- Furniture vocabulary: cohesive across all rooms, contemporary, well-proportioned
${extraNotes}
==========================================
REFERENCE IMAGES (if provided)
==========================================
Use the provided reference images as inspiration ONLY for materials, color mood,
and furniture silhouettes. Do NOT replicate any reference image directly.
Do NOT include any logos, watermarks, or recognizable third-party brands.

==========================================
HARD CONSTRAINTS
==========================================
- All room renders must share identical floor material and consistent color temperature.
- Floor plan stays diagrammatic, 2D top-down, simple line art (no perspective, no 3D).
- Minimal text in the image — only short room labels under each render
  (e.g. "LIVING", "KITCHEN", "MASTER", "STUDY"). NO paragraphs of text.
- High detail, sharp focus, magazine-quality finish.
- Single cohesive 16:9 landscape composition — NOT four separate images.
- Photorealistic for room renders; stylized illustration for floor plan.
`.trim()
}

// ===== Image Generation =====
export interface GenerateOptions {
  prompt: string
  /** Reference image buffers (already downloaded from GCS). */
  referenceImages?: Array<{ buffer: Buffer; mimeType: string; filename: string }>
}

export interface GenerateResult {
  /** Base64-encoded PNG image. */
  imageB64: string
  /** Approximate cost in USD (informational; based on OpenAI pricing as of 2025). */
  estimatedCostUsd: number
}

/**
 * Calls OpenAI gpt-image-1 to generate a concept board.
 * - With reference images → uses images.edit endpoint (multi-image input).
 * - Without reference images → falls back to images.generate.
 */
export async function generateDesignImage({
  prompt,
  referenceImages,
}: GenerateOptions): Promise<GenerateResult> {
  const openai = getClient()
  const model = getImageModel()

  // gpt-image-1 / gpt-image-2 both support 1024x1024, 1536x1024 (landscape), 1024x1536.
  const size = '1536x1024' as const
  const quality = 'high' as const // HD tier

  let b64: string | undefined

  if (referenceImages && referenceImages.length > 0) {
    // Cap at 8 reference images (API supports more but quality drops with too many)
    const refs = referenceImages.slice(0, 8)
    const files = await Promise.all(
      refs.map((r) =>
        toFile(r.buffer, r.filename, { type: r.mimeType }),
      ),
    )

    console.log(
      `[openai] model=${model} mode=images.edit refs=${files.length} size=${size} quality=${quality}`,
    )
    const result = await openai.images.edit({
      model,
      image: files,
      prompt,
      size,
      quality,
      n: 1,
    })
    b64 = result.data?.[0]?.b64_json
  } else {
    console.log(
      `[openai] model=${model} mode=images.generate refs=0 size=${size} quality=${quality}`,
    )
    const result = await openai.images.generate({
      model,
      prompt,
      size,
      quality,
      n: 1,
    })
    b64 = result.data?.[0]?.b64_json
  }

  if (!b64) {
    throw new Error('OpenAI returned no image data')
  }

  // Rough cost estimate (gpt-image-2 is token-billed; this is a coarse landscape-HD ballpark).
  const estimatedCostUsd = 0.2

  return { imageB64: b64, estimatedCostUsd }
}
