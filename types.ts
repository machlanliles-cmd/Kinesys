export interface InitialPhysiology {
  age: number;
  bodyWeight: number;
  muscleMassPercentage: number;
  bodyFat: number;
  strengthIndex: number;
  enduranceIndex: number;
  mobilityScore: number;
}

export interface TrainingParams {
  initialPhysiology: InitialPhysiology;
  trainingHours: number;
  intensity: number; // Changed from enum to number (percentage)
  diet: number;      // Changed from enum to number (percentage)
  sleepHours: number;
}

export interface SimulationDataPoint {
  month: number;
  muscleMass: number;
  vo2Max: number;
  bodyFat: number;
  strengthIndex: number;
  enduranceIndex: number; // New statistic
  trainingStimulus: number;
  recoveryFactor: number;
  ageFactor: number;
}

export interface TrainingAnalysis {
  summary: string;
  strengths: string;
  risks: string;
}

export interface OptimalTrainingAnalysis {
  whyItWorks: string;
  projectedOutcome: string;
}