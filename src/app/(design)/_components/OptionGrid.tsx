'use client'

import type { Option } from '@/lib/design-constants'

interface BaseProps {
  options: Option[]
  columns?: 2 | 3 | 4
}

interface SingleProps extends BaseProps {
  mode: 'single'
  value: string
  onChange: (value: string) => void
}

interface MultiProps extends BaseProps {
  mode: 'multi'
  value: string[]
  onChange: (value: string[]) => void
}

type Props = SingleProps | MultiProps

export default function OptionGrid(props: Props) {
  const { options, columns = 2 } = props
  const isSelected = (v: string) =>
    props.mode === 'single' ? props.value === v : props.value.includes(v)

  const handleClick = (v: string) => {
    if (props.mode === 'single') {
      props.onChange(v)
    } else {
      const next = props.value.includes(v)
        ? props.value.filter((x) => x !== v)
        : [...props.value, v]
      props.onChange(next)
    }
  }

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns]

  return (
    <div className={`grid ${gridCols} gap-2`}>
      {options.map((opt) => {
        const selected = isSelected(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleClick(opt.value)}
            className={[
              'rounded-lg border px-3 py-3 text-sm text-left transition-all',
              selected
                ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
