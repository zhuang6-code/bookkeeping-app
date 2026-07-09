import React, { useState, useEffect } from 'react'
import { Card, DatePicker, Statistic, Row, Col, Table, Progress, Empty, message } from 'antd'
import { WalletOutlined, ShoppingOutlined } from '@ant-design/icons'
import type { MonthlyStats } from '../types'
import dayjs from 'dayjs'

const Statistics: React.FC = () => {
  const [yearMonth, setYearMonth] = useState(dayjs().format('YYYY-MM'))
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStats()
  }, [yearMonth])

  const loadStats = async () => {
    setLoading(true)
    try {
      const result = await window.api.getMonthlyStats({ yearMonth })
      setStats(result)
    } catch (err) {
      message.error('加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '分类',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 200,
      render: (name: string) => name || '未分类'
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
          ¥{(amount / 100).toFixed(2)}
        </span>
      )
    },
    {
      title: '占比',
      key: 'percent',
      render: (_: unknown, record: { amount: number; categoryName: string }) => {
        const total = stats?.totalAmount || 1
        const pct = Math.round((record.amount / total) * 100)
        return <Progress percent={pct} size="small" style={{ minWidth: 100 }} />
      }
    },
    {
      title: '笔数',
      dataIndex: 'count',
      key: 'count',
      align: 'center' as const,
      render: (c: number) => `${c}笔`
    }
  ]

  return (
    <Card>
      <DatePicker
        picker="month"
        value={dayjs(yearMonth)}
        onChange={(d) => {
          if (d) setYearMonth(d.format('YYYY-MM'))
        }}
        allowClear={false}
        style={{ marginBottom: 24 }}
        size="large"
      />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="本月总支出"
              value={stats ? stats.totalAmount / 100 : 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#ff4d4f' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="日均支出"
              value={
                stats
                  ? stats.totalAmount / 100 / dayjs(yearMonth).daysInMonth()
                  : 0
              }
              precision={2}
              prefix="¥"
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Card title="分类支出" size="small">
        <Table
          dataSource={stats?.byCategory || []}
          columns={columns}
          rowKey="categoryName"
          loading={loading}
          pagination={false}
          size="middle"
          locale={{ emptyText: <Empty description="本月还没有支出记录" /> }}
          summary={() => {
            if (!stats) return null
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>合计</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <span style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 16 }}>
                    ¥{(stats.totalAmount / 100).toFixed(2)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>-</Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="center">
                  {stats.byCategory.reduce((sum, c) => sum + c.count, 0)}笔
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
        />
      </Card>
    </Card>
  )
}

export default Statistics
