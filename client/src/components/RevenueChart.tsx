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
  }
  className?: string
}

export default function RevenueChart({ data, className = '' }: RevenueChartProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Use static mock data with 7 days of revenue (multiple data points per day)
  const staticMockData = {
    labels: [
      'Jan 9', 'Jan 9', 'Jan 9', 'Jan 9', 'Jan 9', 'Jan 9',
      'Jan 10', 'Jan 10', 'Jan 10', 'Jan 10', 'Jan 10', 'Jan 10',
      'Jan 11', 'Jan 11', 'Jan 11', 'Jan 11', 'Jan 11', 'Jan 11',
      'Jan 12', 'Jan 12', 'Jan 12', 'Jan 12', 'Jan 12', 'Jan 12',
      'Jan 13', 'Jan 13', 'Jan 13', 'Jan 13', 'Jan 13', 'Jan 13',
      'Jan 14', 'Jan 14', 'Jan 14', 'Jan 14', 'Jan 14', 'Jan 14',
      'Jan 15', 'Jan 15', 'Jan 15', 'Jan 15', 'Jan 15', 'Jan 15'
    ],
    datasets: [
      {
        label: 'Revenue ($)',
        data: [
          // Jan 9 (6 data points)
          45.50, 52.75, 48.25, 56.80, 62.40, 58.90,
          // Jan 10 (6 data points)
          68.15, 72.30, 65.75, 71.40, 78.90, 75.15,
          // Jan 11 (6 data points)
          82.20, 88.75, 85.40, 92.15, 89.80, 86.25,
          // Jan 12 (6 data points)
          95.50, 102.75, 98.25, 105.80, 108.40, 104.90,
          // Jan 13 (6 data points)
          112.15, 118.30, 115.75, 121.40, 125.90, 122.15,
          // Jan 14 (6 data points)
          128.20, 135.75, 132.40, 138.15, 142.80, 139.25,
          // Jan 15 (6 data points)
          145.50, 152.75, 148.25, 155.80, 158.40, 154.90
        ],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y'
      }
    ]
  }

  const chartData = data || staticMockData

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
          <Line data={chartData} options={options} />
        </div>
        
        {/* Chart Summary */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-900">
              ${chartData.datasets[0].data.reduce((a, b) => a + b, 0).toFixed(0)}
            </div>
            <div className="text-sm text-indigo-700">Total Revenue (7 days)</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              ${(chartData.datasets[0].data.reduce((a, b) => a + b, 0) / 7).toFixed(2)}
            </div>
            <div className="text-sm text-green-700">Average Daily Revenue</div>
          </div>
        </div>
      </div>
    </div>
  )
}
