
import React, { useState, useEffect, useCallback } from 'react';
import { InputPanel } from './components/InputPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { getTrainingAnalysis, getMovementAnalysis, getOptimalTrainingAnalysis } from './services/geminiService';
import type { TrainingParams, SimulationDataPoint, InitialPhysiology, TrainingAnalysis, OptimalTrainingAnalysis } from './types';
import { runSimulation, findOptimalTraining } from './services/simulationService';

const App: React.FC = () => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [trainingParams, setTrainingParams] = useState<TrainingParams>({
    initialPhysiology: {
      age: 25,
      bodyWeight: 75,
      muscleMassPercentage: 40,
      bodyFat: 15,
      strengthIndex: 100,
      enduranceIndex: 100,
      mobilityScore: 70,
    },
    trainingHours: 2,
    intensity: 50,
    diet: 75,
    sleepHours: 8,
  });
  const [simulationDuration, setSimulationDuration] = useState<number>(12); // in months
  const [simulationData, setSimulationData] = useState<SimulationDataPoint[]>([]);
  const [geminiAnalysis, setGeminiAnalysis] = useState<TrainingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [movementDescription, setMovementDescription] = useState<string>('');
  const [movementAnalysis, setMovementAnalysis] = useState<string>('');
  const [isLoadingMovement, setIsLoadingMovement] = useState<boolean>(false);
  const [errorMovement, setErrorMovement] = useState<string>('');

  const [optimalAnalysis, setOptimalAnalysis] = useState<OptimalTrainingAnalysis | null>(null);
  const [optimalParams, setOptimalParams] = useState<TrainingParams | null>(null);
  const [optimalSimulationResult, setOptimalSimulationResult] = useState<SimulationDataPoint[] | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [errorOptimizing, setErrorOptimizing] = useState<string>('');

  const clearValidationError = useCallback((fieldName: string) => {
    setValidationErrors(prev => {
      if (!prev[fieldName]) return prev;
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const validateAllParams = (): boolean => {
    const errors: Record<string, string> = {};
    const { initialPhysiology, trainingHours, intensity, diet, sleepHours } = trainingParams;

    if (initialPhysiology.age < 11 || initialPhysiology.age > 50) errors.age = 'Age must be between 11 and 50.';
    if (initialPhysiology.bodyWeight < 30 || initialPhysiology.bodyWeight > 120) errors.bodyWeight = 'Weight must be between 30 and 120 kg.';
    if (initialPhysiology.muscleMassPercentage < 25 || initialPhysiology.muscleMassPercentage > 55) errors.muscleMassPercentage = 'Muscle mass must be between 25% and 55%.';
    if (initialPhysiology.bodyFat < 5 || initialPhysiology.bodyFat > 35) errors.bodyFat = 'Body fat must be between 5% and 35%.';
    if (initialPhysiology.strengthIndex < 30 || initialPhysiology.strengthIndex > 200) errors.strengthIndex = 'Strength index must be between 30 and 200.';
    if (initialPhysiology.enduranceIndex < 30 || initialPhysiology.enduranceIndex > 200) errors.enduranceIndex = 'Endurance index must be between 30 and 200.';
    if (initialPhysiology.mobilityScore < 30 || initialPhysiology.mobilityScore > 100) errors.mobilityScore = 'Mobility score must be between 30 and 100.';
    if (trainingHours < 0.5 || trainingHours > 6) errors.trainingHours = 'Training hours must be between 0.5 and 6.';
    if (intensity < 0 || intensity > 100) errors.intensity = 'Intensity must be between 0 and 100%.';
    if (diet < 0 || diet > 100) errors.diet = 'Diet quality must be between 0 and 100%.';
    if (sleepHours < 4 || sleepHours > 10) errors.sleepHours = 'Sleep hours must be between 4 and 10.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getDisplayError = (error: any): string => {
    const message = error.message || 'An unknown error occurred. Please try again.';
    // Check for specific messages from our service layer
    if (message.includes('API key is missing')) {
      return 'Configuration Error: The Gemini API key is not set. Please go to your Vercel project settings, add an Environment Variable named API_KEY with your key, and then redeploy.';
    }
    if (message.includes('API key is invalid')) {
      return 'Authentication Error: The provided Gemini API key is invalid. Please verify the key in your Vercel environment variables is correct and has the necessary permissions.';
    }
    return message;
  };

  const handleRunSimulation = async () => {
    if (!validateAllParams()) return;

    setIsLoading(true);
    setError('');
    setGeminiAnalysis(null);
    setSimulationData([]);

    try {
      const data = runSimulation(trainingParams, simulationDuration);
      setSimulationData(data);

      const finalStats = data[data.length - 1];
      const analysis = await getTrainingAnalysis(trainingParams, simulationDuration, finalStats);
      setGeminiAnalysis(analysis);
    } catch (err: any) {
      console.error(err);
      setError(getDisplayError(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnalyzeMovement = async () => {
    if (!movementDescription.trim()) {
      setValidationErrors(prev => ({ ...prev, movementDescription: 'Please describe a movement to analyze.' }));
      return;
    }
    clearValidationError('movementDescription');
    setIsLoadingMovement(true);
    setErrorMovement('');
    setMovementAnalysis('');

    try {
      const analysis = await getMovementAnalysis(movementDescription);
      setMovementAnalysis(analysis);
    } catch (err: any) {
      console.error(err);
      setErrorMovement(getDisplayError(err));
    } finally {
      setIsLoadingMovement(false);
    }
  };

  const handleFindOptimalPlan = async () => {
    if (!validateAllParams()) return;
    
    setIsOptimizing(true);
    setErrorOptimizing('');
    setOptimalAnalysis(null);
    setOptimalParams(null);
    setOptimalSimulationResult(null);

    try {
      // This heavy computation runs on the user's browser.
      // For a real-world app, this would be offloaded to a server/worker.
      const { optimalParams, simulationResult } = findOptimalTraining(trainingParams.initialPhysiology, simulationDuration);
      
      setOptimalParams(optimalParams);
      setOptimalSimulationResult(simulationResult);

      const finalStats = simulationResult[simulationResult.length - 1];
      const analysis = await getOptimalTrainingAnalysis(trainingParams.initialPhysiology, optimalParams, finalStats, simulationDuration);

      setOptimalAnalysis(analysis);
    } catch (err: any) {
      console.error(err);
      setErrorOptimizing(getDisplayError(err));
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 lg:mb-12">
          <h1 className="text-5xl sm:text-6xl font-serif font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">
            Kinesys
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Model an athlete's performance over time. Adjust training parameters and let AI provide insights on the projected outcomes.
          </p>
        </header>

        <main className="flex flex-col lg:flex-row gap-8">
          <InputPanel
            isPanelCollapsed={isPanelCollapsed}
            onToggleCollapse={() => setIsPanelCollapsed(p => !p)}
            trainingParams={trainingParams}
            setTrainingParams={setTrainingParams}
            simulationDuration={simulationDuration}
            setSimulationDuration={setSimulationDuration}
            onRunSimulation={handleRunSimulation}
            isLoading={isLoading}
            movementDescription={movementDescription}
            setMovementDescription={setMovementDescription}
            onAnalyzeMovement={handleAnalyzeMovement}
            isLoadingMovement={isLoadingMovement}
            onFindOptimalPlan={handleFindOptimalPlan}
            isOptimizing={isOptimizing}
            validationErrors={validationErrors}
            onClearValidationError={clearValidationError}
          />
          <div className="flex-1 min-w-0">
            <ResultsPanel
              simulationData={simulationData}
              geminiAnalysis={geminiAnalysis}
              isLoading={isLoading}
              error={error}
              movementAnalysis={movementAnalysis}
              isLoadingMovement={isLoadingMovement}
              errorMovement={errorMovement}
              trainingParams={trainingParams}
              optimalParams={optimalParams}
              optimalSimulationResult={optimalSimulationResult}
              optimalAnalysis={optimalAnalysis}
              isOptimizing={isOptimizing}
              errorOptimizing={errorOptimizing}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
