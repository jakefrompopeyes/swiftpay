import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface RevenueChartProps {
  data?: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      tension: number
      fill: boolean
    }[]
  } | null
  className?: string
}

export default function RevenueChart({ data, className = '' }: RevenueChartProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // If no real data provided, render an empty state (no mock data)
  const chartData = data && data.datasets[0]?.data?.length > 0 ? data : null

  // Don't render chart on server to prevent hydration errors
  if (!isClient) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    )
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: '7-Day Revenue Trends',
        font: {
          size: 16,
          weight: 'bold' as const,
          family: 'Inter, system-ui, sans-serif'
        },
        color: '#374151'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `Revenue: $${context.parsed.y.toFixed(2)}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6B7280'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6B7280',
          callback: function(value: any) {
            return '$' + value.toFixed(0)
          }
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: 'white',
        borderWidth: 2
      },
      line: {
        borderWidth: 3
      }
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="h-80">
          {chartData ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              No revenue data yet
            </div>
          )}
        </div>
        {chartData && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-900">
                ${chartData.datasets[0].data.reduce((a, b) => a + b, 0).toFixed(0)}
              </div>
              <div className="text-sm text-indigo-700">Total Revenue (period)</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {(chartData.datasets[0].data.reduce((a, b) => a + b, 0) / Math.max(1, chartData.datasets[0].data.length)).toFixed(2)}
              </div>
              <div className="text-sm text-green-700">Average Per Data Point</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
