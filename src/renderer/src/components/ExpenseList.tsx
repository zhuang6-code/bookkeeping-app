import React, { useState, useEffect, useCallback } from 'react'
import { Table, Button, Popconfirm, message, Card, DatePicker, Space, Tag, Empty } from 'antd'
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ExpenseWithCategory } from '../types'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const PAGE_SIZE = 20

const ExpenseList: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.api.getExpenses({
        page,
        pageSize: PAGE_SIZE,
        startDate: dateRange?.[0],
        endDate: dateRange?.[1]
      })
      setExpenses(result.list)
      setTotal(result.total)
    } catch (err) {
      message.error('加载账单失败')
    } finally {
      setLoading(false)
    }
  }, [page, dateRange])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  const handleDelete = async (id: number) => {
    try {
      await window.api.deleteExpense(id)
      message.success('删除成功')
      loadExpenses()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (d: string) => <span style={{ fontWeight: 500 }}>{d}</span>
    },
    {
      title: '分类',
      key: 'category',
      width: 160,
      render: (_: unknown, record: ExpenseWithCategory) => (
        <Space size={4}>
          {record.parent_category_name && (
            <Tag color="blue">{record.parent_category_name}</Tag>
          )}
          <Tag>{record.category_name}</Tag>
        </Space>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 16 }}>
          ¥{(amount / 100).toFixed(2)}
        </span>
      )
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note: string) => note || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: ExpenseWithCategory) => (
        <Popconfirm
          title="确认删除这条记录？"
          onConfirm={() => handleDelete(record.id)}
          okText="删除"
          cancelText="取消"
        >
          <Button type="link" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      )
    }
  ]

  return (
    <Card>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <RangePicker
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')])
              setPage(1)
            } else {
              setDateRange(null)
              setPage(1)
            }
          }}
          placeholder={['开始日期', '结束日期']}
        />
        <Button icon={<ReloadOutlined />} onClick={loadExpenses}>
          刷新
        </Button>
      </Space>

      <Table
        dataSource={expenses}
        columns={columns}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: <Empty description="还没有账单记录，快去记一笔吧！" /> }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          onChange: (p) => setPage(p),
          showTotal: (t) => `共 ${t} 条记录`,
          showSizeChanger: false
        }}
        size="middle"
      />
    </Card>
  )
}

export default ExpenseList
