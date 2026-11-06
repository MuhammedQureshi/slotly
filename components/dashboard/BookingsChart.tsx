'use client'

import { useMemo, useState } from 'react'

type ChartPoint = {
  date: string
  count: number
}

function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-GB', options).format(new Date(`${date}T12:00:00Z`))
}

export function BookingsChart({ data }: { data: ChartPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const chart = useMemo(() => {
    const highestValue = Math.max(...data.map((point) => point.count), 1)
    const tickSize = Math.max(1, Math.ceil(highestValue / 4))
    const yMax = tickSize * 4
    const bandWidth = data.length ? 100 / data.length : 100
    const barWidth = bandWidth * 0.58
    const bars = data.map((point, index) => {
      const height = (point.count / yMax) * 100
      return {
        ...point,
        x: (index * bandWidth) + ((bandWidth - barWidth) / 2),
        y: 100 - height,
        height,
        width: barWidth,
        center: (index * bandWidth) + (bandWidth / 2),
      }
    })
    return { tickSize, yMax, bandWidth, bars }
  }, [data])

  const activePoint = activeIndex === null ? null : chart.bars[activeIndex]
  const labelIndexes = data.length > 1
    ? Array.from(new Set([0, Math.floor((data.length - 1) / 3), Math.floor(((data.length - 1) * 2) / 3), data.length - 1]))
    : [0]

  function updateActivePoint(clientX: number, bounds: DOMRect) {
    if (!data.length) return
    const rawIndex = Math.floor(((clientX - bounds.left) / bounds.width) * data.length)
    setActiveIndex(Math.max(0, Math.min(data.length - 1, rawIndex)))
  }

  return (
    <figure className="mt-5" aria-labelledby="bookings-chart-caption">
      <figcaption id="bookings-chart-caption" className="sr-only">
        Daily confirmed bookings over the last 30 days.
      </figcaption>
      <div className="flex gap-3">
        <div aria-hidden="true" className="flex h-52 shrink-0 flex-col justify-between pb-px text-right text-xs text-muted-foreground">
          {Array.from({ length: 5 }, (_, index) => <span key={index}>{chart.yMax - (index * chart.tickSize)}</span>)}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="relative h-52"
            onPointerMove={(event) => updateActivePoint(event.clientX, event.currentTarget.getBoundingClientRect())}
            onPointerLeave={() => setActiveIndex(null)}
          >
            {activePoint && (
              <div
                className="pointer-events-none absolute z-10 min-w-28 -translate-x-1/2 -translate-y-full rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg"
                style={{
                  left: `${Math.min(90, Math.max(10, activePoint.center))}%`,
                  top: `${Math.max(activePoint.y, 30)}%`,
                }}
              >
                <p className="font-medium text-foreground">
                  {formatDate(activePoint.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {activePoint.count} booking{activePoint.count === 1 ? '' : 's'}
                </p>
              </div>
            )}
            <svg
              className="absolute inset-0 size-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              role="img"
              aria-label="Bookings per day for the last 30 days"
            >
              {Array.from({ length: 5 }, (_, index) => (
                <line
                  key={index}
                  x1="0"
                  x2="100"
                  y1={index * 25}
                  y2={index * 25}
                  className="stroke-border"
                  strokeDasharray={index === 4 ? undefined : '1 1.5'}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {chart.bars.map((bar, index) => {
                const isActive = index === activeIndex
                const visibleHeight = bar.count === 0 ? 1 : Math.max(bar.height, 2.5)
                return (
                  <rect
                    key={bar.date}
                    x={bar.x}
                    y={100 - visibleHeight}
                    width={bar.width}
                    height={visibleHeight}
                    rx="0.6"
                    className={isActive ? 'fill-accent' : 'fill-accent/65'}
                  />
                )
              })}
            </svg>
          </div>
          <div aria-hidden="true" className="mt-2 flex justify-between text-xs text-muted-foreground">
            {labelIndexes.map((index) => {
              const point = chart.bars[index]
              return point ? <span key={point.date}>{formatDate(point.date, { day: 'numeric', month: 'short' })}</span> : null
            })}
          </div>
        </div>
      </div>
    </figure>
  )
}
