import fs from 'fs';

export const moneyLost = (infectionsByRequestedTime, percentageIncome, avgIncome, days) => {
  const estimatedLoss = infectionsByRequestedTime * percentageIncome * avgIncome * days;
  return parseFloat(estimatedLoss.toFixed(2));
};

export const calcluateDays = (periodType, value) => {
  switch (periodType) {
    case 'months':
      return value * 30;

    case 'weeks':
      return value * 7;

    default:
      return value;
  }
};

export const availableBeds = (totalHospitalBeds, severeCasesByRequestedTime) => {
  const occupied = 0.65 * totalHospitalBeds;
  const available = totalHospitalBeds - occupied;
  return Math.trunc(available - severeCasesByRequestedTime);
};
/* eslint-disable-next-line */
const infectionProjections = (currentlyInfected, days) => currentlyInfected * (2 ** Math.trunc(days / 3));

const impactCalculator = ({
  reportedCases,
  totalHospitalBeds,
  periodType,
  timeToElapse,
  region
}, reportedCasesMultiplyer) => {
  const numberOfDays = calcluateDays(periodType, timeToElapse);
  const currentlyInfected = reportedCases * reportedCasesMultiplyer;
  const infectionsByRequestedTime = infectionProjections(currentlyInfected, numberOfDays);
  const severeCasesByRequestedTime = 0.15 * infectionsByRequestedTime;

  return {
    currentlyInfected,
    infectionsByRequestedTime,
    severeCasesByRequestedTime,
    hospitalBedsByRequestedTime: availableBeds(totalHospitalBeds, severeCasesByRequestedTime),
    casesForICUByRequestedTime: Math.trunc(0.05 * infectionsByRequestedTime),
    casesForVentilatorsByRequestedTime: Math.trunc(0.02 * infectionsByRequestedTime),
    dollarsInFlight: moneyLost(
      infectionsByRequestedTime,
      region.avgDailyIncomePopulation,
      region.avgDailyIncomeInUSD,
      numberOfDays
    )
  };
};

// eslint-disable-next-line no-unused-vars
export const getTimeInMilliseconds = (startTime) => {
  const NS_PER_SEC = 1e9; // time in nano seconds
  const NS_TO_MS = 1e6; // time in milli seconds
  const timeDifference = process.hrtime(startTime);
  return (timeDifference[0] * NS_PER_SEC + timeDifference[1]) / NS_TO_MS;
};
// eslint-disable-next-line no-unused-vars
export const saveToFile = (data, filename) => {
  fs.appendFile(filename, `${data}\n`, (err) => {
    if (err) {
      throw new Error('The data could not be saved');
    }
  });
};

const covid19ImpactEstimator = (data) => ({
  data,
  impact: impactCalculator({ ...data }, 10),
  severeImpact: impactCalculator({ ...data }, 50)
});
export const formatAPIResponse = (estimateValues) => covid19ImpactEstimator(estimateValues);
// eslint-disable-next-line no-unused-vars
export const jsonResponse = (request, response) => {
  const result = request.body;
  response.status(200).send(formatAPIResponse(result));
};
export default covid19ImpactEstimator;
