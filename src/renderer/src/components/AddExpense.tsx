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
  Space,
  Modal,
  Tag,
  Popconfirm,
  List,
  Divider
} from 'antd'
import {
  SaveOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UserOutlined
} from '@ant-design/icons'
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

  // 分类管理弹窗状态
  const [manageModalOpen, setManageModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newParentId, setNewParentId] = useState<number | null>(null)
  const [addingCategory, setAddingCategory] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

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

  // ========== 分类管理方法 ==========

  const handleAddCategory = async () => {
    if (!newName.trim()) {
      message.warning('请输入分类名称')
      return
    }
    setAddingCategory(true)
    try {
      const result = await window.api.addCategory(newName.trim(), newParentId)
      if (result.success) {
        message.success(result.message)
        setNewName('')
        setNewParentId(null)
        await loadCategories()
      } else {
        message.error(result.message)
      }
    } catch (err) {
      message.error('添加失败')
    } finally {
      setAddingCategory(false)
    }
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleUpdateCategory = async (id: number) => {
    if (!editName.trim()) {
      message.warning('分类名称不能为空')
      return
    }
    if (editName.trim() === categories.find(c => c.id === id)?.name) {
      cancelEdit()
      return
    }
    try {
      const result = await window.api.updateCategory(id, editName.trim())
      if (result.success) {
        message.success(result.message)
        cancelEdit()
        await loadCategories()
      } else {
        message.error(result.message)
      }
    } catch (err) {
      message.error('修改失败')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      const result = await window.api.deleteCategory(id)
      if (result.success) {
        message.success(result.message)
        await loadCategories()
      } else {
        message.error(result.message)
      }
    } catch (err) {
      message.error('删除失败')
    }
  }

  // 归类：按父分类整理
  const getChildrenCategories = (parentId: number | null) => {
    return categories.filter((c) => c.parent_id === parentId)
  }

  return (
    <>
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

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Space style={{ flex: 1 }} size="middle">
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

            <Button
              icon={<SettingOutlined />}
              size="large"
              onClick={() => setManageModalOpen(true)}
              title="管理分类"
            />
          </div>

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

      {/* ========== 分类管理弹窗 ========== */}
      <Modal
        title="管理分类"
        open={manageModalOpen}
        onCancel={() => {
          setManageModalOpen(false)
          cancelEdit()
        }}
        footer={null}
        width={560}
      >
        {/* 添加新分类 */}
        <div style={{ marginBottom: 16 }}>
          <Space.Compact style={{ width: '100%' }}>
            <Select
              style={{ width: 140 }}
              placeholder="所属大类"
              allowClear
              value={newParentId}
              onChange={(val) => setNewParentId(val ?? null)}
              options={[
                { label: '无（作为一级分类）', value: '__none__' },
                ...parentCategories.map((c) => ({
                  label: c.name,
                  value: c.id
                }))
              ]}
              onSelect={(val) => {
                if (val === '__none__') setNewParentId(null)
              }}
            />
            <Input
              placeholder="新分类名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onPressEnter={handleAddCategory}
              maxLength={20}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={addingCategory}
              onClick={handleAddCategory}
            >
              添加
            </Button>
          </Space.Compact>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 分类列表（按一级分类分组） */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {parentCategories.map((parent) => {
            const children = getChildrenCategories(parent.id)
            return (
              <div key={parent.id} style={{ marginBottom: 16 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: 14,
                  padding: '4px 0',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  {parent.name}
                  <Tag color={parent.is_preset === 1 ? 'blue' : 'green'} style={{ fontSize: 11 }}>
                    {parent.is_preset === 1 ? '预置' : '自定义'}
                  </Tag>
                  {parent.is_preset === 1 && <LockOutlined style={{ fontSize: 12, color: '#999' }} />}
                </div>
                <List
                  size="small"
                  dataSource={children}
                  renderItem={(child) => (
                    <List.Item
                      style={{ paddingLeft: 16 }}
                      actions={
                        child.is_preset === 1
                          ? [
                              <Tag key="preset" color="blue" style={{ fontSize: 11 }}>预置</Tag>,
                              <LockOutlined key="lock" style={{ fontSize: 12, color: '#999' }} />
                            ]
                          : [
                              editingId === child.id ? (
                                <Space key="edit-actions" size="small">
                                  <Button
                                    size="small"
                                    type="link"
                                    onClick={() => handleUpdateCategory(child.id)}
                                  >
                                    保存
                                  </Button>
                                  <Button size="small" type="link" onClick={cancelEdit}>
                                    取消
                                  </Button>
                                </Space>
                              ) : (
                                <Button
                                  key="edit"
                                  size="small"
                                  type="link"
                                  icon={<EditOutlined />}
                                  onClick={() => startEdit(child)}
                                />
                              ),
                              <Popconfirm
                                key="delete"
                                title="确定删除此分类？"
                                description="如有账单记录则无法删除"
                                onConfirm={() => handleDeleteCategory(child.id)}
                                okText="删除"
                                cancelText="取消"
                              >
                                <Button
                                  size="small"
                                  type="link"
                                  danger
                                  icon={<DeleteOutlined />}
                                />
                              </Popconfirm>
                            ]
                      }
                    >
                      {editingId === child.id ? (
                        <Input
                          size="small"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onPressEnter={() => handleUpdateCategory(child.id)}
                          maxLength={20}
                          style={{ width: 160 }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {child.name}
                          <Tag color="green" style={{ fontSize: 11 }}>自定义</Tag>
                        </span>
                      )}
                    </List.Item>
                  )}
                  locale={{ emptyText: '暂无子分类' }}
                />
              </div>
            )
          })}
        </div>
      </Modal>
    </>
  )
}

export default AddExpense
