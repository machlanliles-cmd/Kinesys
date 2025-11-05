
import React from 'react';
import type { TrainingParams, InitialPhysiology } from '../types';

interface InputPanelProps {
  trainingParams: TrainingParams;
  setTrainingParams: React.Dispatch<React.SetStateAction<TrainingParams>>;
  simulationDuration: number;
  setSimulationDuration: (duration: number) => void;
  onRunSimulation: () => void;
  isLoading: boolean;
  movementDescription: string;
  setMovementDescription: (description: string) => void;
  onAnalyzeMovement: () => void;
  isLoadingMovement: boolean;
  onFindOptimalPlan: () => void;
  isOptimizing: boolean;
  isPanelCollapsed: boolean;
  onToggleCollapse: () => void;
  validationErrors: Record<string, string>;
  onClearValidationError: (fieldName: string) => void;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="relative group flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-slate-500 cursor-help"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-slate-900 border border-slate-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        {text}
      </div>
    </div>
  );
};

const InputLabel: React.FC<{ htmlFor: string; children: React.ReactNode; value?: string; reference?: string; tooltipText?: string }> = ({ htmlFor, children, value, reference, tooltipText }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300">
    <div className="flex justify-between items-baseline">
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        {tooltipText && <Tooltip text={tooltipText} />}
      </div>
      {reference && <span className="text-xs text-slate-400 italic">{reference}</span>}
    </div>
    {value && <div className="text-cyan-400 font-semibold text-right mt-1">{value}</div>}
  </label>
);

// --- Helper functions for dynamic reference ranges ---
const getReferenceRanges = (age: number) => {
  const peakStrengthAge = 28;
  const peakEnduranceAge = 32;
  const peakFatAge = 25;
  const growthStartAge = 11;

  // --- Body Weight ---
  let weightMin, weightMax;
  if (age < 20) {
    const baseMin = 35, baseMax = 45, peakMin = 65, peakMax = 85;
    const progress = Math.max(0, (age - growthStartAge) / (20 - growthStartAge));
    weightMin = Math.round(baseMin + (peakMin - baseMin) * progress);
    weightMax = Math.round(baseMax + (peakMax - baseMax) * progress);
  } else {
    weightMin = 65;
    weightMax = 90;
  }

  // --- Body Fat ---
  let fatMin, fatMax;
  if (age < peakFatAge) {
      const baseMin = 12, baseMax = 20, peakMin = 8, peakMax = 15;
      const progress = Math.max(0, (age - growthStartAge) / (peakFatAge - growthStartAge));
      fatMin = Math.round(baseMin - (baseMin - peakMin) * progress);
      fatMax = Math.round(baseMax - (baseMax - peakMax) * progress);
  } else {
      const fatAgeAdjustment = Math.floor(Math.max(0, age - peakFatAge) / 5);
      fatMin = 8 + fatAgeAdjustment;
      fatMax = 15 + fatAgeAdjustment;
  }
  
  // --- Strength Index ---
  let strengthNovice, strengthElite;
  if (age < peakStrengthAge) {
    const baseNovice = 30, baseElite = 60, peakNovice = 80, peakElite = 150;
    const progress = Math.max(0, (age - growthStartAge) / (peakStrengthAge - growthStartAge));
    strengthNovice = Math.round(baseNovice + (peakNovice - baseNovice) * progress);
    strengthElite = Math.round(baseElite + (peakElite - baseElite) * progress);
  } else {
    const strengthAgeFactor = 1 - Math.max(0, age - peakStrengthAge) * 0.012;
    strengthNovice = Math.round(80 * strengthAgeFactor);
    strengthElite = Math.round(150 * strengthAgeFactor);
  }
  
  // --- Endurance Index ---
  let enduranceNovice, enduranceElite;
  if (age < peakEnduranceAge) {
    const baseNovice = 40, baseElite = 70, peakNovice = 80, peakElite = 150;
    const progress = Math.max(0, (age - growthStartAge) / (peakEnduranceAge - growthStartAge));
    enduranceNovice = Math.round(baseNovice + (peakNovice - baseNovice) * progress);
    enduranceElite = Math.round(baseElite + (peakElite - baseElite) * progress);
  } else {
    const enduranceAgeFactor = 1 - Math.max(0, age - peakEnduranceAge) * 0.012;
    enduranceNovice = Math.round(80 * enduranceAgeFactor);
    enduranceElite = Math.round(150 * enduranceAgeFactor);
  }

  return {
      bodyWeight: `Avg: ${weightMin}-${weightMax}kg`,
      muscleMassPercentage: `Athlete: 35-45%`,
      bodyFat: `Athlete: ${fatMin}-${fatMax}%`,
      strengthIndex: `Novice: ${strengthNovice}, Elite: ${strengthElite}+`,
      enduranceIndex: `Novice: ${enduranceNovice}, Elite: ${enduranceElite}+`,
      mobilityScore: `Athlete: 60-85+`,
  };
};


export const InputPanel: React.FC<InputPanelProps> = ({
  trainingParams,
  setTrainingParams,
  simulationDuration,
  setSimulationDuration,
  onRunSimulation,
  isLoading,
  movementDescription,
  setMovementDescription,
  onAnalyzeMovement,
  isLoadingMovement,
  onFindOptimalPlan,
  isOptimizing,
  isPanelCollapsed,
  onToggleCollapse,
  validationErrors,
  onClearValidationError,
}) => {
  const handleParamChange = (field: keyof Omit<TrainingParams, 'initialPhysiology'>, value: string | number) => {
    onClearValidationError(field);
    setTrainingParams(prev => ({ ...prev, [field]: value }));
  };

  const handlePhysiologyChange = (field: keyof InitialPhysiology, value: number) => {
    onClearValidationError(field);
    setTrainingParams(prev => ({
      ...prev,
      initialPhysiology: {
        ...prev.initialPhysiology,
        [field]: value
      }
    }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onClearValidationError('movementDescription');
    setMovementDescription(e.target.value);
  };
  
  const references = getReferenceRanges(trainingParams.initialPhysiology.age);

  return (
    <aside className={`relative transition-all duration-300 ease-in-out ${isPanelCollapsed ? 'w-full lg:w-0' : 'w-full lg:w-1/4 lg:min-w-[420px]'}`}>
      <button
        onClick={onToggleCollapse}
        className="absolute top-1/2 -right-4 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center ring-8 ring-slate-900"
        aria-label={isPanelCollapsed ? 'Show input panel' : 'Hide input panel'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 transition-transform duration-300 ${isPanelCollapsed ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <div className={`h-full transition-opacity duration-150 ${isPanelCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
        <div className="bg-slate-800 p-6 sm:p-8 rounded-xl border border-slate-700 shadow-lg h-full overflow-y-auto">
        
          <div>
            <h2 className="text-3xl font-bold text-white mb-6 font-serif">Initial Physiology</h2>
            <div className="space-y-7">
              {/* Age */}
              <div>
                <InputLabel
                  htmlFor="age"
                  value={`${trainingParams.initialPhysiology.age} years`}
                  tooltipText="Defines the athlete's age. Age is a critical factor influencing anabolic potential, recovery capacity, and injury risk. Athletes typically reach peak strength around age 25-30 and peak endurance in their late 20s to early 30s. The simulation models these physiological changes."
                >
                  Age
                </InputLabel>
                <input
                  id="age" type="range" min="11" max="50" step="1"
                  value={trainingParams.initialPhysiology.age}
                  onChange={(e) => handlePhysiologyChange('age', parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 mt-2"
                />
                {validationErrors.age && <p className="text-red-400 text-xs mt-2">{validationErrors.age}</p>}
              </div>
              {/* Body Weight */}
              <div>
                <InputLabel
                  htmlFor="bodyWeight"
                  value={`${trainingParams.initialPhysiology.bodyWeight} kg`}
                  reference={references.bodyWeight}
                  tooltipText="Total body mass in kilograms. While a general indicator, its composition (muscle vs. fat) is key. For many sports, an optimal power-to-weight ratio is more important than total weight. The displayed 'Avg' range is a general population guide for the selected age."
                >
                  Body Weight
                </InputLabel>
                <input
                  id="bodyWeight" type="range" min="30" max="120" step="1"
                  value={trainingParams.initialPhysiology.bodyWeight}
                  onChange={(e) => handlePhysiologyChange('bodyWeight', parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 mt-2"
                />
                {validationErrors.bodyWeight && <p className="text-red-400 text-xs mt-2">{validationErrors.bodyWeight}</p>}
              </div>
              {/* Muscle Mass Percentage */}
              <div>
                <InputLabel
                  htmlFor="muscleMassPercentage"
                  value={`${trainingParams.initialPhysiology.muscleMassPercentage}%`}
                  reference={references.muscleMassPercentage}
                  tooltipText="The proportion of body weight composed of muscle. This is a primary driver of strength, power, and metabolic rate. Elite male strength athletes can exceed 50%, while endurance athletes are typically leaner. The 'Athlete' range of 35-45% represents a common goal for many sports."
                >
                  Muscle Mass %
                </InputLabel>
                <input
                  id="muscleMassPercentage" type="range" min="25" max="55" step="1"
                  value={trainingParams.initialPhysiology.muscleMassPercentage}
                  onChange={(e) => handlePhysiologyChange('muscleMassPercentage', parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 mt-2"
                />
                 {validationErrors.muscleMassPercentage && <p className="text-red-400 text-xs mt-2">{validationErrors.muscleMassPercentage}</p>}
              </div>
              {/* Body Fat */}
              <div>
                <InputLabel
                  htmlFor="bodyFat"
                  value={`${trainingParams.initialPhysiology.bodyFat}%`}
                  reference={references.bodyFat}
                  tooltipText="The proportion of body weight that is fat tissue. Essential fat is necessary for health, but excess fat can impede performance by adding non-functional mass. Elite male athletes often fall in the 6-13% range, and elite female athletes in the 14-20% range, varying by sport."
                >
                  Body Fat %
                </InputLabel>
                <input
                  id="bodyFat" type="range" min="5" max="35" step="1"
                  value={trainingParams.initialPhysiology.bodyFat}
                  onChange={(e) => handlePhysiologyChange('bodyFat', parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 mt-2"
                />
                {validationErrors.bodyFat && <p className="text-red-400 text-xs mt-2">{validationErrors.bodyFat}</p>}
              </div>
              {/* Strength Index */}
              <div>
                <InputLabel
                  htmlFor="strengthIndex"
                  value={`${trainingParams.initialPhysiology.strengthIndex} pts`}
                  reference={references.strengthIndex}
                  tooltipText="An abstract measure of an athlete's maximal force production, relative to their age and weight. A score of 100 represents a well-trained amateur. Scores of 150+ are typical for elite strength-focused athletes. The 'Novice' and 'Elite' references are dynamically adjusted for age."
                >
                  Strength Index
                </InputLabel>
                <input
                  id="strengthIndex" type="range" min="30" max="200" step="1"
                  value={trainingParams.initialPhysiology.strengthIndex}
                  onChange={(e) => handlePhysiologyChange('strengthIndex', parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 mt-2"
                />
                {validationErrors.strengthIndex && <p className="text-red-400 text-xs mt-2">{validationErrors.strengthIndex}</p>}
              </div>
              {/* Endurance Index */}
              <div>
                <InputLabel
                  htmlFor="enduranceIndex"
                  value={`${trainingParams.initialPhysiology.enduranceIndex} pts`}
                  reference={references.enduranceIndex}
                  tooltipText="An abstract measure of an athlete's ability to sustain aerobic effort, linked to factors like VO2 max and lactate threshold. A score of 100 represents a serious recreational athlete. Scores of 150+ indicate professional-level cardiovascular fitness. The 'Novice' and 'Elite' references are dynamically adjusted for age."
                >
                  Endurance Index
                </InputLabel>
                <input
                  id="enduranceIndex" type="range" min="30" max="200" step="1"
                  value={trainingParams.initialPhysiology.enduranceIndex}
                  onChange={(e) => handlePhysiologyChange('enduranceIndex', parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 mt-2"
                />
                {validationErrors.enduranceIndex && <p className="text-red-400 text-xs mt-2">{validationErrors.enduranceIndex}</p>}
              </div>
              {/* Mobility Score */}
              <div>
                <InputLabel
                  htmlFor="mobilityScore"
                  value={`${trainingParams.initialPhysiology.mobilityScore} pts`}
                  reference={references.mobilityScore}
                  tooltipText="An abstract measure of an athlete's range of motion and movement quality. A higher score indicates better flexibility and more efficient biomechanics, which can enhance the effectiveness of training and potentially reduce injury risk. 50 is average, 100 is exceptional."
                >
                  Mobility Score
                </InputLabel>
                <input
                  id="mobilityScore" type="range" min="30" max="100" step="1"
                  value={trainingParams.initialPhysiology.mobilityScore}
                  onChange={(e) => handlePhysiologyChange('mobilityScore', parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 mt-2"
                />
                {validationErrors.mobilityScore && <p className="text-red-400 text-xs mt-2">{validationErrors.mobilityScore}</p>}
              </div>
            </div>
          </div>
          
          <div className="my-8 border-t border-slate-700"></div>
    
          <div>
            <h2 className="text-3xl font-bold text-white mb-6 font-serif">Training Plan</h2>
            <div className="space-y-7">
              
              {/* Training Hours */}
              <div>
                <InputLabel htmlFor="trainingHours" value={`${trainingParams.trainingHours} hrs/day`}>
                  Training Hours
                </InputLabel>
                <input
                  id="trainingHours"
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.5"
                  value={trainingParams.trainingHours}
                  onChange={(e) => handleParamChange('trainingHours', parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 mt-2"
                />
                {validationErrors.trainingHours && <p className="text-red-400 text-xs mt-2">{validationErrors.trainingHours}</p>}
              </div>
    
              {/* Training Intensity */}
              <div>
                <InputLabel htmlFor="intensity" value={`${trainingParams.intensity}%`}>
                  Training Intensity
                </InputLabel>
                <input
                  id="intensity"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={trainingParams.intensity}
                  onChange={(e) => handleParamChange('intensity', parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 mt-2"
                />
                {validationErrors.intensity && <p className="text-red-400 text-xs mt-2">{validationErrors.intensity}</p>}
              </div>
    
              {/* Diet Quality */}
              <div>
                <InputLabel htmlFor="diet" value={`${trainingParams.diet}%`}>
                  Diet Quality
                </InputLabel>
                 <input
                  id="diet"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={trainingParams.diet}
                  onChange={(e) => handleParamChange('diet', parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 mt-2"
                />
                {validationErrors.diet && <p className="text-red-400 text-xs mt-2">{validationErrors.diet}</p>}
              </div>
    
              {/* Sleep Hours */}
              <div>
                <InputLabel htmlFor="sleepHours" value={`${trainingParams.sleepHours} hrs/night`}>
                  Sleep Hours
                </InputLabel>
                <input
                  id="sleepHours"
                  type="range"
                  min="4"
                  max="10"
                  step="0.5"
                  value={trainingParams.sleepHours}
                  onChange={(e) => handleParamChange('sleepHours', parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 mt-2"
                />
                {validationErrors.sleepHours && <p className="text-red-400 text-xs mt-2">{validationErrors.sleepHours}</p>}
              </div>
    
              {/* Simulation Duration */}
              <div>
                <InputLabel htmlFor="duration">Simulation Duration</InputLabel>
                <select
                  id="duration"
                  value={simulationDuration}
                  onChange={(e) => setSimulationDuration(parseInt(e.target.value, 10))}
                  className="mt-2 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-3"
                >
                  <option value={6}>6 Months</option>
                  <option value={12}>1 Year</option>
                  <option value={24}>2 Years</option>
                  <option value={36}>3 Years</option>
                </select>
              </div>
            </div>
            <button
              onClick={onRunSimulation}
              disabled={isLoading || isOptimizing}
              className="w-full text-lg mt-8 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Simulating...
                </>
              ) : 'Run Simulation & AI Analysis'}
            </button>
            <button
              onClick={onFindOptimalPlan}
              disabled={isLoading || isOptimizing}
              className="w-full text-lg mt-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
            >
              {isOptimizing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finding Optimal Plan...
                </>
              ) : 'Find Optimal Plan'}
            </button>
          </div>
    
          <div className="my-8 border-t border-slate-700"></div>
    
          <div>
            <h2 className="text-3xl font-bold text-white mb-6 font-serif">Biomechanical Analysis</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="movementDescription" className="block mb-2 text-sm font-medium text-slate-300">
                  Describe Movement Pattern
                </label>
                <textarea
                  id="movementDescription"
                  rows={5}
                  className="block p-3 w-full text-base text-white bg-slate-700 rounded-lg border border-slate-600 focus:ring-cyan-500 focus:border-cyan-500 placeholder-slate-400"
                  placeholder="e.g., During my squat, my knees cave inward and I lean forward too much on the ascent."
                  value={movementDescription}
                  onChange={handleDescriptionChange}
                ></textarea>
                {validationErrors.movementDescription && <p className="text-red-400 text-xs mt-2">{validationErrors.movementDescription}</p>}
              </div>
              <button
                onClick={onAnalyzeMovement}
                disabled={isLoadingMovement || !movementDescription.trim()}
                className="w-full text-lg mt-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
              >
                {isLoadingMovement ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : 'Analyze Movement Pattern'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};