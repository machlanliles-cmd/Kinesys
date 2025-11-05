
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SimulationDataPoint } from '../types';

interface StatChartProps {
  data: SimulationDataPoint[];
  dataKey: keyof SimulationDataPoint;
  label: string;
  unit: string;
  color: string;
}

export const StatChart: React.FC<StatChartProps> = ({ data, dataKey, label, unit, color }) => {
  const CustomTooltip: React.FC<any> = ({ active, payload, label: monthLabel }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 p-3 border border-slate-600 rounded-md shadow-lg">
          <p className="label text-slate-300">{`Month: ${monthLabel}`}</p>
          <p className="intro" style={{ color }}>{`${label}: ${payload[0].value.toFixed(2)} ${unit}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
      <h4 className="text-xl font-serif font-semibold text-white mb-4 text-center">{label}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#94a3b8' }} 
            stroke="#64748b"
            label={{ value: 'Months', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
          />
          <YAxis 
            tick={{ fill: '#94a3b8' }} 
            stroke="#64748b" 
            domain={['dataMin - 1', 'dataMax + 1']} 
            tickFormatter={(tick) => Math.round(tick).toString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{color: 'white'}}/>
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            name={label} 
            stroke={color} 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 5 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};