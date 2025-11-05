import type { TrainingParams, SimulationDataPoint, InitialPhysiology } from '../types';

export const runSimulation = (params: TrainingParams, durationMonths: number): SimulationDataPoint[] => {
  const data: SimulationDataPoint[] = [];
  const { initialPhysiology } = params;
  const { age, bodyWeight, muscleMassPercentage, bodyFat, strengthIndex, enduranceIndex, mobilityScore } = initialPhysiology;

  // Initial state of the athlete from user input
  let currentBodyWeight = bodyWeight;
  let currentMuscleMass = bodyWeight * (muscleMassPercentage / 100);
  let currentBodyFatPercentage = bodyFat;
  let currentBodyFatMass = currentBodyWeight * (currentBodyFatPercentage / 100);
  let currentStrengthIndex = strengthIndex;
  let currentEnduranceIndex = enduranceIndex;

  // --- Derive initial VO2 max from other stats ---
  // Models growth phase, peak, and decline based on age.
  let ageBasedVo2MaxBase;
  if (age < 20) {
    // Growth phase: increase from a base of 38 at age 11 to 45 at age 20
    ageBasedVo2MaxBase = 38 + ((age - 11) / (20 - 11)) * (45 - 38);
  } else if (age <= 25) {
    // Peak
    ageBasedVo2MaxBase = 45;
  } else {
    // Decline
    ageBasedVo2MaxBase = 45 - (age - 25) * 0.3;
  }
  let currentVo2Max = ageBasedVo2MaxBase + (initialPhysiology.enduranceIndex - 100) * 0.2;

  // --- BASE FACTORS ---
  // These are calculated once based on the training plan, then adjusted dynamically in the loop.
  const effectiveHours = -0.08 * Math.pow(params.trainingHours, 2) + 1.0 * params.trainingHours;
  const intensityFactor = 0.5 + params.intensity / 100; // More sensitive range: 0.5 to 1.5
  const baseTrainingStimulus = Math.max(0, effectiveHours * intensityFactor);

  const sleepQuality = Math.pow(Math.min(1.0, params.sleepHours / 8.0), 2);
  const dietQuality = 0.5 + params.diet / 100; // Range 0.5 to 1.5
  const baseRecoveryFactor = sleepQuality * dietQuality;
  
  const mobilityFactor = 1 + (mobilityScore - 50) * 0.002; // +10% / -6% effect from mobility

  for (let month = 0; month <= durationMonths; month++) {
    // --- DYNAMIC FACTORS FOR CURRENT MONTH ---
    
    // 1. Age factor: Dynamically calculated each month as the athlete ages.
    const currentAge = age + (month / 12);
    let ageFactor;
    if (currentAge < 20) {
      // Growth/puberty phase: factor from 0.8 at age 11 to 1.0 at age 20.
      ageFactor = 0.8 + ((currentAge - 11) / (20 - 11)) * 0.2;
    } else if (currentAge <= 30) {
      // Peak physiological years
      ageFactor = 1.0;
    } else {
      // Gradual decline after 30
      ageFactor = 1.0 - (currentAge - 30) * 0.005;
    }
    ageFactor = Math.max(0.5, ageFactor); // Ensure factor doesn't drop too low

    // 2. Training Stimulus: Models adaptation (diminishing returns over time).
    // The same workout provides less stimulus as the athlete gets fitter.
    const adaptationMultiplier = 1 / (1 + 0.005 * (currentStrengthIndex - strengthIndex) + 0.005 * (currentEnduranceIndex - enduranceIndex));
    const trainingStimulus = baseTrainingStimulus * adaptationMultiplier;

    // 3. Recovery Factor: Models improved physiological efficiency over time.
    // The body gets better at recovering with a consistent regimen.
    const recoveryAdaptationBonus = Math.min(0.15, month * 0.005); // Caps at +15% after 30 months
    const recoveryFactor = Math.min(1.5, baseRecoveryFactor + recoveryAdaptationBonus);

    data.push({
      month: month,
      muscleMass: parseFloat(currentMuscleMass.toFixed(2)),
      vo2Max: parseFloat(currentVo2Max.toFixed(2)),
      bodyFat: parseFloat(currentBodyFatPercentage.toFixed(2)),
      strengthIndex: parseFloat(currentStrengthIndex.toFixed(2)),
      enduranceIndex: parseFloat(currentEnduranceIndex.toFixed(2)),
      trainingStimulus: parseFloat(trainingStimulus.toFixed(3)),
      recoveryFactor: parseFloat(recoveryFactor.toFixed(3)),
      ageFactor: parseFloat(ageFactor.toFixed(3)),
    });

    if (month === durationMonths) break;

    // --- Calculate changes for the next month using refined model ---
    // General formula: GAIN = BASE_POTENTIAL * STIMULUS * RECOVERY * AGE_CONTEXT * OTHER_FACTORS

    const muscleGain_kg = 0.2 * trainingStimulus * recoveryFactor * ageFactor * mobilityFactor;
    // Strength is highly dependent on intensity and mobility
    const strengthGain = 2.0 * trainingStimulus * (intensityFactor * 0.5) * recoveryFactor * ageFactor * mobilityFactor;
    // Endurance is less dependent on mobility but still benefits
    const enduranceGain = 0.9 * trainingStimulus * recoveryFactor * ageFactor * (1 + (mobilityFactor - 1) * 0.5);
    const vo2MaxGain = 0.6 * trainingStimulus * recoveryFactor * ageFactor;
    
    // Fat loss is modeled based on energy expenditure and hormonal state (affected by sleep/diet)
    const fatLossFromTraining = -0.25 * trainingStimulus;
    // A diet quality below 1.0 (i.e., <50% on slider) leads to fat gain
    const fatChangeFromDiet = (1 - dietQuality) * 0.1;
     // Poor sleep quality (<1.0) hinders fat loss
    const fatChangeFromSleep = (1 - sleepQuality) * 0.05;
    const bodyFatMassChange_kg = fatLossFromTraining + fatChangeFromDiet + fatChangeFromSleep;

    // --- Update stats for next iteration ---
    currentMuscleMass += muscleGain_kg;
    currentBodyFatMass += bodyFatMassChange_kg;
    
    // Update total body weight based on muscle and fat changes
    currentBodyWeight += muscleGain_kg + bodyFatMassChange_kg;
    
    // Recalculate body fat percentage
    currentBodyFatPercentage = (currentBodyFatMass / currentBodyWeight) * 100;

    // Apply floors to prevent unrealistic values
    currentBodyFatMass = Math.max(currentBodyWeight * 0.03, currentBodyFatMass);
    currentBodyFatPercentage = Math.max(3, currentBodyFatPercentage);


    currentVo2Max += vo2MaxGain;
    currentStrengthIndex += strengthGain;
    currentEnduranceIndex += enduranceGain;
  }

  return data;
};


export const findOptimalTraining = (initialPhysiology: InitialPhysiology, durationMonths: number): { optimalParams: TrainingParams, simulationResult: SimulationDataPoint[] } => {
  let bestParams: TrainingParams | null = null;
  let bestResult: SimulationDataPoint[] | null = null;
  let bestScore = -Infinity;

  const initialMuscleMass = initialPhysiology.bodyWeight * (initialPhysiology.muscleMassPercentage / 100);
  
  let ageBasedVo2MaxBase;
  if (initialPhysiology.age < 20) {
    ageBasedVo2MaxBase = 38 + ((initialPhysiology.age - 11) / (20 - 11)) * (45 - 38);
  } else if (initialPhysiology.age <= 25) {
    ageBasedVo2MaxBase = 45;
  } else {
    ageBasedVo2MaxBase = 45 - (initialPhysiology.age - 25) * 0.3;
  }
  const initialVo2Max = ageBasedVo2MaxBase + (initialPhysiology.enduranceIndex - 100) * 0.2;

  // Define a smaller, smarter search space for faster optimization
  const trainingHoursOptions = [1.5, 3, 4.5];
  const intensityOptions = [50, 75, 100];
  const dietOptions = [60, 80, 100];
  const sleepHoursOptions = [7, 8, 9];

  for (const trainingHours of trainingHoursOptions) {
    for (const intensity of intensityOptions) {
      for (const diet of dietOptions) {
        for (const sleepHours of sleepHoursOptions) {
          const currentParams: TrainingParams = {
            initialPhysiology,
            trainingHours,
            intensity,
            diet,
            sleepHours,
          };
          
          const simulationData = runSimulation(currentParams, durationMonths);
          const finalStats = simulationData[simulationData.length - 1];
          
          // --- Scoring Function ---
          // Calculates a score based on balanced improvement across all metrics.
          // Higher score is better.
          const score = 
            (finalStats.muscleMass / initialMuscleMass) * 2 + // Emphasize muscle gain
            (finalStats.vo2Max / initialVo2Max) * 1.5 +       // Emphasize VO2 max
            (initialPhysiology.bodyFat / finalStats.bodyFat) * 1 + // Reward fat loss
            (finalStats.strengthIndex / initialPhysiology.strengthIndex) * 1 +
            (finalStats.enduranceIndex / initialPhysiology.enduranceIndex) * 1;

          if (score > bestScore) {
            bestScore = score;
            bestParams = currentParams;
            bestResult = simulationData;
          }
        }
      }
    }
  }

  if (!bestParams || !bestResult) {
    throw new Error("Optimization failed to find a valid training plan.");
  }
  
  return { optimalParams: bestParams, simulationResult: bestResult };
};