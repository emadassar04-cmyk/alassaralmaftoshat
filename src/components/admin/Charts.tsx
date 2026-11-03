'use client'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const C = '#8f6a2e'
export function DailyChart({ data }: { data: { day: string; sales: number; orders: number }[] }) {
  return (
    <div className="h-64 w-full" dir="ltr" role="img" aria-label="المبيعات اليومية">
      <ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e6d9c0" /><XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} /><YAxis tick={{ fontSize: 11 }} width={44} />
        <Tooltip formatter={(v) => `${Number(v).toLocaleString('en-US')} ₪`} labelFormatter={(l) => String(l)} /><Bar dataKey="sales" name="المبيعات" fill={C} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
    </div>
  )
}
export function BranchChart({ data }: { data: { branch: string; sales: number; orders: number }[] }) {
  return (
    <div className="h-56 w-full" dir="ltr" role="img" aria-label="مقارنة الفرعين">
      <ResponsiveContainer><BarChart data={data} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e6d9c0" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="branch" width={90} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => `${Number(v).toLocaleString('en-US')} ₪`} /><Bar dataKey="sales" name="المبيعات" fill={C} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
    </div>
  )
}
