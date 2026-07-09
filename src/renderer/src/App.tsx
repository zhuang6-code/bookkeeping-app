import React, { useState } from 'react'
import { Layout, Tabs } from 'antd'
import { PlusCircleOutlined, UnorderedListOutlined, PieChartOutlined } from '@ant-design/icons'
import AddExpense from './components/AddExpense'
import ExpenseList from './components/ExpenseList'
import Statistics from './components/Statistics'

const { Header, Content } = Layout

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('add')

  const tabItems = [
    {
      key: 'add',
      label: (
        <span>
          <PlusCircleOutlined />
          记一笔
        </span>
      ),
      children: <AddExpense onSuccess={() => setActiveTab('list')} />
    },
    {
      key: 'list',
      label: (
        <span>
          <UnorderedListOutlined />
          账单
        </span>
      ),
      children: <ExpenseList />
    },
    {
      key: 'stats',
      label: (
        <span>
          <PieChartOutlined />
          统计
        </span>
      ),
      children: <Statistics />
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px'
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>💰 记账</h1>
      </Header>
      <Content style={{ padding: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          centered
        />
      </Content>
    </Layout>
  )
}

export default App
