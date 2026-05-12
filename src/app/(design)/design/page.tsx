'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OptionGrid from '../_components/OptionGrid'
import ImageUploader, { type UploadedRef } from '../_components/ImageUploader'
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
  type DesignConditions,
} from '@/lib/design-constants'

const STEPS = [
  { key: 'refs', label: '參考圖' },
  { key: 'basic', label: '基本資訊' },
  { key: 'lifestyle', label: '生活需求' },
  { key: 'style', label: '設計風格' },
  { key: 'confirm', label: '確認送出' },
] as const

const INITIAL_CONDITIONS: DesignConditions = {
  homeType: '',
  size: '',
  layout: '',
  spaces: [],
  residents: [],
  lifestyles: [],
  storageNeeds: [],
  specialNeeds: [],
  style: '',
  colorScheme: '',
  materials: [],
  freeformNotes: '',
}

export default function DesignFormPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [refs, setRefs] = useState<UploadedRef[]>([])
  const [conditions, setConditions] = useState<DesignConditions>(INITIAL_CONDITIONS)
  const [quota, setQuota] = useState<{ used: number; quota: number; remaining: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/design/generate')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setQuota(d))
      .catch(() => {})
  }, [])

  const update = <K extends keyof DesignConditions>(k: K, v: DesignConditions[K]) =>
    setConditions((prev) => ({ ...prev, [k]: v }))

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        // refs are optional; can always proceed (but block if any are still uploading)
        return !refs.some((r) => r.status === 'uploading')
      case 1:
        return (
          !!conditions.homeType &&
          !!conditions.size &&
          !!conditions.layout &&
          conditions.spaces.length > 0
        )
      case 2:
        return true // all optional
      case 3:
        return !!conditions.style && !!conditions.colorScheme
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const referenceGcsKeys = refs
        .filter((r) => r.status === 'done' && r.gcsKey)
        .map((r) => r.gcsKey)

      const res = await fetch('/api/design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditions, referenceGcsKeys }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '生成失敗，請稍後再試')
      }
      router.push(`/design/result/${data.id}`)
    } catch (err: any) {
      setSubmitError(err?.message || '生成失敗')
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* ===== Progress bar ===== */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
          <span>
            步驟 {step + 1} / {STEPS.length}
          </span>
          {quota && (
            <span>
              今日剩餘 <b className="text-stone-900">{quota.remaining}</b> / {quota.quota}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={[
                'flex-1 h-1 rounded-full transition-colors',
                i <= step ? 'bg-stone-900' : 'bg-stone-200',
              ].join(' ')}
            />
          ))}
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">{STEPS[step].label}</h2>
      </div>

      {/* ===== Step content ===== */}
      <div className="space-y-8">
        {step === 0 && (
          <section>
            <p className="text-sm text-stone-600 mb-4">
              上傳你喜歡的風格參考圖、現況照片或格局圖（可選，最多 8 張）。
              AI 會把這些作為材質、色調、家具風格的「靈感」，不會直接照抄。
            </p>
            <ImageUploader value={refs} onChange={setRefs} maxCount={8} />
          </section>
        )}

        {step === 1 && (
          <>
            <Field label="房屋類型">
              <OptionGrid
                mode="single"
                options={HOME_TYPES}
                value={conditions.homeType}
                onChange={(v) => update('homeType', v)}
                columns={3}
              />
            </Field>
            <Field label="坪數">
              <OptionGrid
                mode="single"
                options={SIZE_RANGES}
                value={conditions.size}
                onChange={(v) => update('size', v)}
                columns={3}
              />
            </Field>
            <Field label="格局">
              <OptionGrid
                mode="single"
                options={LAYOUTS}
                value={conditions.layout}
                onChange={(v) => update('layout', v)}
                columns={3}
              />
            </Field>
            <Field label="需要的空間（可多選，最多會渲染 6 個）">
              <OptionGrid
                mode="multi"
                options={SPACES}
                value={conditions.spaces}
                onChange={(v) => update('spaces', v)}
                columns={3}
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="居住成員（可多選）">
              <OptionGrid
                mode="multi"
                options={RESIDENTS}
                value={conditions.residents}
                onChange={(v) => update('residents', v)}
                columns={3}
              />
            </Field>
            <Field label="生活習慣（可多選）">
              <OptionGrid
                mode="multi"
                options={LIFESTYLES}
                value={conditions.lifestyles}
                onChange={(v) => update('lifestyles', v)}
                columns={2}
              />
            </Field>
            <Field label="收納需求（可多選）">
              <OptionGrid
                mode="multi"
                options={STORAGE_NEEDS}
                value={conditions.storageNeeds}
                onChange={(v) => update('storageNeeds', v)}
                columns={3}
              />
            </Field>
            <Field label="特殊需求（可多選）">
              <OptionGrid
                mode="multi"
                options={SPECIAL_NEEDS}
                value={conditions.specialNeeds}
                onChange={(v) => update('specialNeeds', v)}
                columns={2}
              />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="設計風格">
              <OptionGrid
                mode="single"
                options={STYLES}
                value={conditions.style}
                onChange={(v) => update('style', v)}
                columns={2}
              />
            </Field>
            <Field label="主色系">
              <OptionGrid
                mode="single"
                options={COLOR_SCHEMES}
                value={conditions.colorScheme}
                onChange={(v) => update('colorScheme', v)}
                columns={2}
              />
            </Field>
            <Field label="想使用的材質（可多選）">
              <OptionGrid
                mode="multi"
                options={MATERIALS}
                value={conditions.materials}
                onChange={(v) => update('materials', v)}
                columns={3}
              />
            </Field>
            <Field label="補充說明（可選）">
              <textarea
                value={conditions.freeformNotes}
                onChange={(e) => update('freeformNotes', e.target.value)}
                placeholder="例：希望廚房有中島、客廳要能容納大型沙發、想保留紅磚牆…"
                rows={4}
                maxLength={400}
                className="w-full rounded-lg border border-stone-200 bg-white p-3 text-sm focus:outline-none focus:border-stone-900"
              />
              <p className="text-xs text-stone-400 mt-1 text-right">
                {(conditions.freeformNotes?.length || 0)} / 400
              </p>
            </Field>
          </>
        )}

        {step === 4 && (
          <ConfirmSection
            conditions={conditions}
            refsCount={refs.filter((r) => r.status === 'done').length}
          />
        )}
      </div>

      {/* ===== Footer nav ===== */}
      <div className="mt-10 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={step === 0 || submitting}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="px-5 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          上一步
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canProceed()}
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="px-6 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-sm font-medium"
          >
            下一步
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting || (quota && quota.remaining <= 0) || false}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-sm font-medium"
          >
            {submitting ? '生成中…' : '產生設計圖'}
          </button>
        )}
      </div>

      {submitError && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {submitError}
        </div>
      )}
      {quota && quota.remaining <= 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3">
          今日生成額度已用完（{quota.used}/{quota.quota}），請明天再試。
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-800 mb-2">{label}</label>
      {children}
    </div>
  )
}

function ConfirmSection({
  conditions,
  refsCount,
}: {
  conditions: DesignConditions
  refsCount: number
}) {
  const rows: Array<[string, string]> = [
    ['房屋類型', findOption(HOME_TYPES, conditions.homeType)?.label || '—'],
    ['坪數', findOption(SIZE_RANGES, conditions.size)?.label || '—'],
    ['格局', findOption(LAYOUTS, conditions.layout)?.label || '—'],
    [
      '空間',
      findOptions(SPACES, conditions.spaces).map((o) => o.label).join('、') || '—',
    ],
    [
      '居住成員',
      findOptions(RESIDENTS, conditions.residents).map((o) => o.label).join('、') || '—',
    ],
    [
      '生活習慣',
      findOptions(LIFESTYLES, conditions.lifestyles).map((o) => o.label).join('、') || '—',
    ],
    [
      '收納需求',
      findOptions(STORAGE_NEEDS, conditions.storageNeeds).map((o) => o.label).join('、') || '—',
    ],
    [
      '特殊需求',
      findOptions(SPECIAL_NEEDS, conditions.specialNeeds).map((o) => o.label).join('、') || '—',
    ],
    ['風格', findOption(STYLES, conditions.style)?.label || '—'],
    ['色系', findOption(COLOR_SCHEMES, conditions.colorScheme)?.label || '—'],
    [
      '材質',
      findOptions(MATERIALS, conditions.materials).map((o) => o.label).join('、') || '—',
    ],
    ['參考圖', refsCount > 0 ? `${refsCount} 張` : '無'],
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">
        確認以下條件後送出，AI 大約需要 30-60 秒生成。
      </p>
      <div className="rounded-lg border border-stone-200 bg-white divide-y divide-stone-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex px-4 py-3 text-sm">
            <span className="w-24 shrink-0 text-stone-500">{label}</span>
            <span className="text-stone-900">{value}</span>
          </div>
        ))}
        {conditions.freeformNotes && (
          <div className="px-4 py-3 text-sm">
            <span className="block text-stone-500 mb-1">補充說明</span>
            <p className="text-stone-900 whitespace-pre-wrap">{conditions.freeformNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
