import React, { useState, useEffect } from 'react'
import {
  Form,
  Select,
  InputNumber,
  Input,
  DatePicker,
  Button,
  message,
  Card,
  Space
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import type { Category } from '../types'
import dayjs from 'dayjs'

const { TextArea } = Input

interface Props {
  onSuccess: () => void
}

const AddExpense: React.FC<Props> = ({ onSuccess }) => {
  const [form] = Form.useForm()
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const cats = await window.api.getCategories()
    setCategories(cats)
  }

  const parentCategories = categories.filter((c) => c.parent_id === null)

  const handleParentChange = (parentId: number) => {
    const subs = categories.filter((c) => c.parent_id === parentId)
    setSubCategories(subs)
    form.setFieldValue('categoryId', undefined)
  }

  const handleSubmit = async (values: { amount: number; categoryId: number; date: dayjs.Dayjs; note: string }) => {
    setLoading(true)
    try {
      // 金额单位：元 → 分
      const amountInCents = Math.round(values.amount * 100)
      await window.api.addExpense({
        amount: amountInCents,
        categoryId: values.categoryId,
        date: values.date.format('YYYY-MM-DD'),
        note: values.note || ''
      })
      message.success('记账成功！')
      form.resetFields()
      setSubCategories([])
      onSuccess()
    } catch (err) {
      message.error('记账失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card style={{ maxWidth: 500, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ date: dayjs() }}
      >
        <Form.Item
          label="金额（元）"
          name="amount"
          rules={[{ required: true, message: '请输入金额' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.01}
            max={999999.99}
            precision={2}
            placeholder="例如：36.50"
            addonBefore="¥"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="日期"
          name="date"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker style={{ width: '100%' }} size="large" />
        </Form.Item>

        <Space style={{ width: '100%' }} size="middle">
          <Form.Item
            label="分类"
            name="parentCategory"
            rules={[{ required: true, message: '请选择大类' }]}
            style={{ flex: 1 }}
          >
            <Select
              placeholder="选择大类"
              onChange={handleParentChange}
              options={parentCategories.map((c) => ({
                label: c.name,
                value: c.id
              }))}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="子分类"
            name="categoryId"
            rules={[{ required: true, message: '请选择子分类' }]}
            style={{ flex: 1 }}
          >
            <Select
              placeholder="选择子分类"
              options={subCategories.map((c) => ({
                label: c.name,
                value: c.id
              }))}
              disabled={subCategories.length === 0}
              size="large"
            />
          </Form.Item>
        </Space>

        <Form.Item label="备注" name="note">
          <TextArea rows={2} placeholder="可选：写点备注..." maxLength={200} showCount />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
            block
          >
            记一笔
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default AddExpense
