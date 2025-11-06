import React from 'react';
import { StatChart } from './StatChart';
import type { SimulationDataPoint, TrainingParams, TrainingAnalysis, OptimalTrainingAnalysis } from '../types';
import { marked } from 'marked';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ConfigurationError } from './ConfigurationError';

interface ResultsPanelProps {
  simulationData: SimulationDataPoint[];
  geminiAnalysis: TrainingAnalysis | null;
  isLoading: boolean;
  error: string;
  movementAnalysis: string;
  isLoadingMovement: boolean;
  errorMovement: string;
  trainingParams: TrainingParams;
  optimalParams: TrainingParams | null;
  optimalSimulationResult: SimulationDataPoint[] | null;
  optimalAnalysis: OptimalTrainingAnalysis | null;
  isOptimizing: boolean;
  errorOptimizing: string;
}

const Placeholder: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800 rounded-xl border border-slate-700 h-full">
     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
     </svg>
    <h3 className="text-2xl font-serif font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 max-w-sm">{children}</p>
  </div>
);

const LoadingSpinner: React.FC<{text?: string}> = ({text = "Generating charts and AI analysis..."}) => (
  <div className="flex items-center justify-center h-full p-8">
    <div className="flex flex-col items-center">
      <svg className="animate-spin h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-slate-300 text-lg font-medium">{text}</p>
    </div>
  </div>
);

const FactorsChart: React.FC<{ data: SimulationDataPoint[] }> = ({ data }) => {
  const CustomTooltip: React.FC<any> = ({ active, payload, label: monthLabel }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 p-3 border border-slate-600 rounded-md shadow-lg">
          <p className="label text-slate-300">{`Month: ${monthLabel}`}</p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.color }}>
              {`${pld.name}: ${pld.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
      <h4 className="text-xl font-serif font-semibold text-white mb-4 text-center">Performance Factors</h4>
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
            domain={[0, 'dataMax + 0.2']}
            tickFormatter={(tick) => tick.toFixed(1)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{color: 'white'}}/>
          <Line 
            type="monotone" 
            dataKey="trainingStimulus" 
            name="Training Stimulus" 
            stroke="#38bdf8"
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 5 }} 
          />
          <Line 
            type="monotone" 
            dataKey="recoveryFactor" 
            name="Recovery Factor" 
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }} 
          />
          <Line 
            type="monotone" 
            dataKey="ageFactor" 
            name="Age Factor" 
            stroke="#fbbf24"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const ComparisonCard: React.FC<{ label: string; yourPlanValue: number; optimalPlanValue: number; unit: string; higherIsBetter?: boolean; }> = ({ label, yourPlanValue, optimalPlanValue, unit, higherIsBetter = true }) => {
    const difference = optimalPlanValue - yourPlanValue;
    const formattedDifference = `${difference >= 0 ? '+' : ''}${difference.toFixed(1)}`;
    
    const isImprovementForOptimal = (higherIsBetter && difference > 0.05) || (!higherIsBetter && difference < -0.05);
    const isRegressionForOptimal = (higherIsBetter && difference < -0.05) || (!higherIsBetter && difference > 0.05);

    const differenceColor = isImprovementForOptimal ? 'text-green-400' : isRegressionForOptimal ? 'text-red-400' : 'text-slate-400';

    const yourPlanIsBetter = (higherIsBetter && yourPlanValue > optimalPlanValue) || (!higherIsBetter && yourPlanValue < optimalPlanValue);
    const optimalPlanIsBetter = (higherIsBetter && optimalPlanValue > yourPlanValue) || (!higherIsBetter && optimalPlanValue < yourPlanValue);
    const isEqual = Math.abs(difference) < 0.05;

    return (
        <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 flex flex-col">
            <h5 className="text-base font-semibold text-center text-slate-300 mb-3 truncate" title={label}>{label}</h5>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 text-center flex-grow items-center">
                <div className="overflow-hidden">
                    <div className="text-xs text-cyan-400 truncate">Your Plan</div>
                    <div className={`text-xl font-bold truncate ${!isEqual && yourPlanIsBetter ? 'text-cyan-400' : 'text-white'}`} title={yourPlanValue.toFixed(1)}>{yourPlanValue.toFixed(1)}</div>
                    <div className="text-xs text-slate-500 truncate" title={unit}>{unit}</div>
                </div>
                <div className="self-center px-1">
                    <div className={`font-bold text-lg ${differenceColor}`}>
                        {isEqual ? '—' : formattedDifference}
                    </div>
                </div>
                <div className="overflow-hidden">
                    <div className="text-xs text-indigo-400 truncate">Optimal Plan</div>
                    <div className={`text-xl font-bold truncate ${!isEqual && optimalPlanIsBetter ? 'text-indigo-400' : 'text-white'}`} title={optimalPlanValue.toFixed(1)}>{optimalPlanValue.toFixed(1)}</div>
                    <div className="text-xs text-slate-500 truncate" title={unit}>{unit}</div>
                </div>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ label: string; onClick: () => void; isActive: boolean; }> = ({ label, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`px-3 py-3 sm:px-4 sm:py-2 text-base font-medium transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 rounded-t-md ${
      isActive
        ? 'text-cyan-400 border-b-2 border-cyan-400'
        : 'text-slate-400 hover:text-white border-b-2 border-transparent'
    }`}
    role="tab"
    aria-selected={isActive}
  >
    {label}
  </button>
);

const SummaryStatCard: React.FC<{ label: string; value: string; unit: string; change: string; changeColor: string }> = ({ label, value, unit, change, changeColor }) => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-4 rounded-xl border border-slate-700 text-center flex flex-col justify-between">
        <div>
            <p className="text-sm font-medium text-slate-400 truncate" title={label}>{label}</p>
            <p className="text-3xl font-bold text-white mt-2 truncate" title={`${value} ${unit}`}>
                {value}
                <span className="text-base text-slate-300 ml-1">{unit}</span>
            </p>
        </div>
        <p className={`text-sm font-semibold ${changeColor} mt-1`}>{change}</p>
    </div>
);

interface ComparisonChartProps {
  yourFinalStats: SimulationDataPoint;
  optimalFinalStats: SimulationDataPoint;
}

const ComparisonChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const color = value >= 0 ? '#4ade80' : '#f87171';
    const prefix = value >= 0 ? '+' : '';
    return (
      <div className="bg-slate-800 p-3 border border-slate-600 rounded-md shadow-lg">
        <p className="label text-slate-300">{label}</p>
        <p className="intro" style={{ color: color }}>
          {`Change: ${prefix}${value.toFixed(1)}%`}
        </p>
      </div>
    );
  }
  return null;
};

const ComparisonChart: React.FC<ComparisonChartProps> = ({ yourFinalStats, optimalFinalStats }) => {
  const metrics: { key: keyof Omit<SimulationDataPoint, 'month' | 'trainingStimulus' | 'recoveryFactor' | 'ageFactor'>; name: string; higherIsBetter: boolean }[] = [
    { key: 'muscleMass', name: 'Muscle Mass', higherIsBetter: true },
    { key: 'vo2Max', name: 'VO2 Max', higherIsBetter: true },
    { key: 'bodyFat', name: 'Body Fat', higherIsBetter: false },
    { key: 'strengthIndex', name: 'Strength', higherIsBetter: true },
    { key: 'enduranceIndex', name: 'Endurance', higherIsBetter: true },
  ];

  const chartData = metrics.map(metric => {
    const yourValue = yourFinalStats[metric.key] as number;
    const optimalValue = optimalFinalStats[metric.key] as number;
    const change = yourValue !== 0 ? ((optimalValue - yourValue) / Math.abs(yourValue)) * 100 : 0;
    return {
      name: metric.name,
      change: parseFloat(change.toFixed(1)),
      higherIsBetter: metric.higherIsBetter,
    };
  });

  const GREEN = '#4ade80'; // green-400
  const RED = '#f87171'; // red-400

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis 
          type="number" 
          tick={{ fill: '#94a3b8' }} 
          stroke="#64748b" 
          tickFormatter={(tick) => `${tick}%`}
          domain={['auto', 'auto']}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          tick={{ fill: '#cbd5e1' }} 
          stroke="#64748b"
          width={80}
          interval={0}
        />
        <Tooltip content={<ComparisonChartTooltip />} cursor={{ fill: 'rgba(71, 85, 105, 0.5)' }}/>
        <Bar dataKey="change">
          {chartData.map((entry, index) => {
            let isImprovement: boolean;
            if (entry.higherIsBetter) {
              isImprovement = entry.change >= 0;
            } else {
              isImprovement = entry.change <= 0;
            }
            return <Cell key={`cell-${index}`} fill={isImprovement ? GREEN : RED} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const AnalysisCard: React.FC<{ title: string; content: string; }> = ({ title, content }) => {
  if (!content) return null;
  const htmlContent = marked.parse(content);
  return (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 h-full">
      <h4 className="text-xl font-serif font-bold text-slate-200 mb-3 flex items-center gap-2">
        {title}
      </h4>
      <div 
        className="prose prose-sm prose-invert max-w-none prose-p:text-slate-300 prose-ul:text-slate-300 prose-li:text-slate-300"
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
    </div>
  );
};

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ 
  simulationData, 
  geminiAnalysis, 
  isLoading, 
  error,
  movementAnalysis,
  isLoadingMovement,
  errorMovement,
  trainingParams,
  optimalParams,
  optimalSimulationResult,
  optimalAnalysis,
  isOptimizing,
  errorOptimizing,
}) => {
  const [activeTab, setActiveTab] = React.useState('your_plan');

  const hasYourPlan = simulationData.length > 0;
  const hasOptimalPlan = !!optimalSimulationResult;
  const hasComparison = hasYourPlan && hasOptimalPlan;
  const hasMovementAnalysis = !!movementAnalysis.trim();

  // Effect to manage active tab when data changes
  React.useEffect(() => {
    if (activeTab === 'optimal_plan' && !hasOptimalPlan) setActiveTab('your_plan');
    if (activeTab === 'comparison' && !hasComparison) setActiveTab('your_plan');
    if (activeTab === 'movement' && !hasMovementAnalysis) setActiveTab(hasYourPlan ? 'your_plan' : 'optimal_plan');
    if (!hasYourPlan && hasOptimalPlan) setActiveTab('optimal_plan');
    if (hasYourPlan) setActiveTab('your_plan');
  }, [simulationData, optimalSimulationResult, movementAnalysis]);

  if (isLoading && !hasYourPlan && !hasOptimalPlan) return <LoadingSpinner />;

  const effectiveError = error || errorOptimizing;
  if (effectiveError) {
    if (effectiveError.includes('Configuration Error')) {
      return <ConfigurationError errorType="missing" />;
    }
    if (effectiveError.includes('Authentication Error')) {
      return <ConfigurationError errorType="invalid" />;
    }
    return <Placeholder title="Error">{effectiveError}</Placeholder>;
  }

  if (isOptimizing && !hasOptimalPlan) return <LoadingSpinner text="Running simulations to find the best plan..."/>

  const hasAnyData = hasYourPlan || hasOptimalPlan || hasMovementAnalysis;
  if (!hasAnyData) {
    return <Placeholder title="Awaiting Simulation">Adjust parameters and click "Run Simulation" or "Find Optimal Plan" to see projected athlete development.</Placeholder>;
  }

  // --- Data for Summary Header ---
  const summarySourceData = hasYourPlan ? simulationData : hasOptimalPlan ? optimalSimulationResult : null;
  const summaryStats = summarySourceData ? summarySourceData[summarySourceData.length - 1] : null;

  const getSummaryCardProps = (label: string, finalValue: number, initialValue: number, unit: string, higherIsBetter = true) => {
    const change = finalValue - initialValue;
    const isImprovement = higherIsBetter ? change >= 0 : change <= 0;
    const changeColor = isImprovement ? 'text-green-400' : 'text-red-400';
    const changeText = `${change > 0 ? '+' : ''}${change.toFixed(1)} ${unit}`;
    return { label, value: finalValue.toFixed(1), unit, change: changeText, changeColor };
  };

  const yourFinalStats = hasYourPlan ? simulationData[simulationData.length - 1] : null;
  const optimalFinalStats = hasOptimalPlan ? optimalSimulationResult[optimalSimulationResult.length - 1] : null;

  const movementAnalysisHtml = movementAnalysis ? marked.parse(movementAnalysis) : '';

  return (
    <div className="space-y-8">
      {/* --- Performance Snapshot Header --- */}
      {summaryStats && summarySourceData && (
        <div>
          <h2 className="text-4xl font-serif font-bold text-white mb-4">Performance Snapshot</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <SummaryStatCard {...getSummaryCardProps('Muscle Mass', summaryStats.muscleMass, trainingParams.initialPhysiology.bodyWeight * (trainingParams.initialPhysiology.muscleMassPercentage / 100), 'kg')} />
            <SummaryStatCard {...getSummaryCardProps('VO2 Max', summaryStats.vo2Max, summarySourceData[0].vo2Max, 'ml/kg/min')} />
            <SummaryStatCard {...getSummaryCardProps('Body Fat', summaryStats.bodyFat, trainingParams.initialPhysiology.bodyFat, '%', false)} />
            <SummaryStatCard {...getSummaryCardProps('Strength', summaryStats.strengthIndex, trainingParams.initialPhysiology.strengthIndex, 'pts')} />
            <SummaryStatCard {...getSummaryCardProps('Endurance', summaryStats.enduranceIndex, trainingParams.initialPhysiology.enduranceIndex, 'pts')} />
          </div>
        </div>
      )}

      {/* --- Tab Navigation --- */}
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-2 sm:space-x-6 overflow-x-auto" role="tablist" aria-label="Results Tabs">
          {hasYourPlan && <TabButton label="Your Plan Analysis" isActive={activeTab === 'your_plan'} onClick={() => setActiveTab('your_plan')} />}
          {hasOptimalPlan && <TabButton label="Optimal Plan Analysis" isActive={activeTab === 'optimal_plan'} onClick={() => setActiveTab('optimal_plan')} />}
          {hasComparison && <TabButton label="Comparison" isActive={activeTab === 'comparison'} onClick={() => setActiveTab('comparison')} />}
          {hasMovementAnalysis && <TabButton label="Movement Analysis" isActive={activeTab === 'movement'} onClick={() => setActiveTab('movement')} />}
        </nav>
      </div>

      {/* --- Tab Content --- */}
      <div className="mt-6">
        {activeTab === 'your_plan' && hasYourPlan && (
          <div className="space-y-8" role="tabpanel">
            <div>
              <h3 className="text-3xl font-serif font-bold text-white mb-4">Projected Development</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatChart data={simulationData} dataKey="muscleMass" label="Muscle Mass" unit="kg" color="#22d3ee" />
                <StatChart data={simulationData} dataKey="vo2Max" label="VO2 Max" unit="ml/kg/min" color="#6ee7b7" />
                <StatChart data={simulationData} dataKey="bodyFat" label="Body Fat" unit="%" color="#f87171" />
                <StatChart data={simulationData} dataKey="strengthIndex" label="Strength Index" unit="pts" color="#facc15" />
                <StatChart data={simulationData} dataKey="enduranceIndex" label="Endurance Index" unit="pts" color="#818cf8" />
                <FactorsChart data={simulationData} />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-serif font-bold text-white mb-4">AI Coach Analysis</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                      <h4 className="text-2xl font-serif font-bold text-cyan-400 mb-4">Your Training Plan</h4>
                      <div className="space-y-3 text-slate-300 text-base">
                         <p><strong>Training:</strong> <span className="font-semibold text-white">{trainingParams.trainingHours} hrs/day</span></p>
                         <p><strong>Intensity:</strong> <span className="font-semibold text-white">{trainingParams.intensity}%</span></p>
                         <p><strong>Diet Quality:</strong> <span className="font-semibold text-white">{trainingParams.diet}%</span></p>
                         <p><strong>Sleep:</strong> <span className="font-semibold text-white">{trainingParams.sleepHours} hrs/night</span></p>
                      </div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  {geminiAnalysis ? (
                    <div className="grid grid-cols-1 gap-6">
                        <AnalysisCard title="Overall Summary" content={geminiAnalysis.summary} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <AnalysisCard title="Plan Strengths" content={geminiAnalysis.strengths} />
                            <AnalysisCard title="Risks & Improvements" content={geminiAnalysis.risks} />
                        </div>
                    </div>
                  ) : isLoading ? (
                     <div className="h-full flex items-center justify-center"><LoadingSpinner text="Analyzing..."/></div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'optimal_plan' && hasOptimalPlan && optimalParams && (
           <div className="space-y-8" role="tabpanel">
             <div>
               <h3 className="text-3xl font-serif font-bold text-white mb-4">Optimal Plan: Projected Development</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <StatChart data={optimalSimulationResult} dataKey="muscleMass" label="Muscle Mass" unit="kg" color="#22d3ee" />
                 <StatChart data={optimalSimulationResult} dataKey="vo2Max" label="VO2 Max" unit="ml/kg/min" color="#6ee7b7" />
                 <StatChart data={optimalSimulationResult} dataKey="bodyFat" label="Body Fat" unit="%" color="#f87171" />
                 <StatChart data={optimalSimulationResult} dataKey="strengthIndex" label="Strength Index" unit="pts" color="#facc15" />
                 <StatChart data={optimalSimulationResult} dataKey="enduranceIndex" label="Endurance Index" unit="pts" color="#818cf8" />
                 <FactorsChart data={optimalSimulationResult} />
               </div>
             </div>
             <div>
               <h3 className="text-3xl font-serif font-bold text-white mb-4">AI Coach Explanation</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-fit">
                      <h4 className="text-2xl font-serif font-bold text-indigo-400 mb-4">Your Optimal Plan</h4>
                      <div className="space-y-3 text-slate-300 text-base">
                         <p><strong>Training:</strong> <span className="font-semibold text-white">{optimalParams.trainingHours} hrs/day</span></p>
                         <p><strong>Intensity:</strong> <span className="font-semibold text-white">{optimalParams.intensity}%</span></p>
                         <p><strong>Diet Quality:</strong> <span className="font-semibold text-white">{optimalParams.diet}%</span></p>
                         <p><strong>Sleep:</strong> <span className="font-semibold text-white">{optimalParams.sleepHours} hrs/night</span></p>
                      </div>
                  </div>
                   <div className="lg:col-span-2">
                    {optimalAnalysis ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <AnalysisCard title="Why It Works For You" content={optimalAnalysis.whyItWorks} />
                        <AnalysisCard title="Projected Outcome" content={optimalAnalysis.projectedOutcome} />
                      </div>
                    ) : isOptimizing ? (
                       <div className="h-full flex items-center justify-center"><LoadingSpinner text="Analyzing..."/></div>
                    ) : null}
                  </div>
                </div>
             </div>
           </div>
        )}
        
        {activeTab === 'comparison' && hasComparison && yourFinalStats && optimalFinalStats && (
            <div role="tabpanel" className="space-y-8">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <p className="text-slate-400 mb-6 text-center max-w-2xl mx-auto">Here's a side-by-side comparison of the projected final outcomes from your custom plan versus the AI-optimized plan.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ComparisonCard label="Muscle Mass" yourPlanValue={yourFinalStats.muscleMass} optimalPlanValue={optimalFinalStats.muscleMass} unit="kg" />
                        <ComparisonCard label="VO2 Max" yourPlanValue={yourFinalStats.vo2Max} optimalPlanValue={optimalFinalStats.vo2Max} unit="ml/kg/min" />
                        <ComparisonCard label="Body Fat" yourPlanValue={yourFinalStats.bodyFat} optimalPlanValue={optimalFinalStats.bodyFat} unit="%" higherIsBetter={false}/>
                        <ComparisonCard label="Strength" yourPlanValue={yourFinalStats.strengthIndex} optimalPlanValue={optimalFinalStats.strengthIndex} unit="pts" />
                        <ComparisonCard label="Endurance" yourPlanValue={yourFinalStats.enduranceIndex} optimalPlanValue={optimalFinalStats.enduranceIndex} unit="pts" />
                    </div>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h4 className="text-2xl font-serif font-semibold text-white mb-2 text-center">Optimal Plan vs. Your Plan (% Difference)</h4>
                    <p className="text-slate-400 mb-6 text-center max-w-2xl mx-auto">This chart shows the percentage improvement (or regression) of the optimal plan compared to yours. Green bars indicate a better outcome with the optimal plan.</p>
                    <ComparisonChart
                        yourFinalStats={yourFinalStats}
                        optimalFinalStats={optimalFinalStats}
                    />
                </div>
            </div>
        )}
        
        {activeTab === 'movement' && hasMovementAnalysis && (
            <div role="tabpanel">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    {isLoadingMovement ? (
                        <div className="flex items-center justify-center p-6">
                            <svg className="animate-spin h-6 w-6 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="ml-3 text-slate-300">Biomechanist is analyzing movement...</p>
                        </div>
                    ) : errorMovement ? (
                         <p className="text-red-400 text-center">{errorMovement}</p>
                    ) : (
                        <div className="prose prose-invert prose-headings:text-teal-400 prose-strong:text-white max-w-none" dangerouslySetInnerHTML={{ __html: movementAnalysisHtml }} />
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
