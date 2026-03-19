// SwiftShield Insurance Policy Types

export type PlanTier = "starter" | "shield" | "pro";
export type TriggerType = "rainfall" | "extreme_heat" | "flood" | "cold_fog" | "civil_unrest";
export type ClaimStatus = "pending" | "approved" | "rejected" | "paid";
export type Platform = "blinkit" | "zepto";

// Plan tier configurations based on SwiftShield policy
export const PLAN_TIERS = {
  starter: {
    name: "Starter",
    weeklyPremium: 29,
    weeklyCap: 500,
    hourlyPayout: 70,
    maxHoursPerDay: 4,
    waitingPeriod: 120, // 2 hours in minutes
    triggers: ["rainfall", "flood"] as TriggerType[],
    color: "blue",
  },
  shield: {
    name: "Shield",
    weeklyPremium: 59,
    weeklyCap: 1200,
    hourlyPayout: 85,
    maxHoursPerDay: 6,
    waitingPeriod: 60, // 1 hour in minutes
    triggers: ["rainfall", "extreme_heat", "flood", "cold_fog", "civil_unrest"] as TriggerType[],
    color: "emerald",
  },
  pro: {
    name: "Pro",
    weeklyPremium: 99,
    weeklyCap: 2000,
    hourlyPayout: 100,
    maxHoursPerDay: 8,
    waitingPeriod: 30, // 30 minutes
    triggers: ["rainfall", "extreme_heat", "flood", "cold_fog", "civil_unrest"] as TriggerType[],
    color: "purple",
  },
} as const;

// Trigger definitions based on SwiftShield policy
export const TRIGGER_DEFINITIONS = {
  rainfall: {
    id: "T1",
    name: "Heavy Rainfall",
    description: "Rainfall >15mm/hour",
    threshold: ">15mm/hr",
    hourlyRate: 85,
    icon: "🌧️",
    severity: "high",
  },
  extreme_heat: {
    id: "T2",
    name: "Extreme Heat",
    description: "Temperature >42°C for 3+ hours",
    threshold: ">42°C",
    hourlyRate: 70,
    icon: "🔥",
    severity: "medium",
  },
  flood: {
    id: "T3",
    name: "Flash Flood / Waterlogging",
    description: "Waterlogging blocking delivery routes",
    threshold: "Route blocked",
    hourlyRate: 100,
    icon: "🌊",
    severity: "critical",
  },
  cold_fog: {
    id: "T4",
    name: "Severe Cold / Dense Fog",
    description: "Visibility <50m or Temperature <5°C",
    threshold: "<50m visibility or <5°C",
    hourlyRate: 70,
    icon: "🌫️",
    severity: "medium",
  },
  civil_unrest: {
    id: "T5",
    name: "Curfew / Civil Strike",
    description: "Official curfews or civil disturbances",
    threshold: "Official notice",
    hourlyRate: 100,
    icon: "⚠️",
    severity: "critical",
  },
} as const;

// GPS Zone for fraud detection (simulated zones for demo)
export interface GPSZone {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radiusKm: number;
  city: string;
}

export const DELIVERY_ZONES: GPSZone[] = [
  { id: "zone_del_1", name: "Connaught Place", center: { lat: 28.6315, lng: 77.2167 }, radiusKm: 5, city: "Delhi" },
  { id: "zone_del_2", name: "Saket", center: { lat: 28.5245, lng: 77.2066 }, radiusKm: 4, city: "Delhi" },
  { id: "zone_mum_1", name: "Andheri", center: { lat: 19.1136, lng: 72.8697 }, radiusKm: 5, city: "Mumbai" },
  { id: "zone_blr_1", name: "Koramangala", center: { lat: 12.9352, lng: 77.6245 }, radiusKm: 4, city: "Bangalore" },
];

// Worker interface
export interface Worker {
  id: string;
  name: string;
  phone: string;
  platform: Platform;
  profileImage?: string;
  joinedDate: string;
  city: string;

  // Current GPS (simulated)
  currentLocation: { lat: number; lng: number };
  assignedZone: string;

  // Work stats (weekly)
  weeklyDeliveries: number;
  weeklyEarnings: number;
  avgRating: number;
  weeklyActiveHours: number;
  isOnline: boolean;
  lastActiveTime: string;

  // Insurance details
  insurance: {
    planTier: PlanTier;
    status: "active" | "expired" | "pending";
    weeklyPremium: number;
    weeklyCap: number;
    validFrom: string;
    validUntil: string;
    autoRenewal: boolean;
    weeklyClaimTotal: number; // Track weekly usage
    weekStartDate: string;
  };

  // Claims history
  claims: Claim[];

  // Payouts
  payouts: Payout[];

  // Vehicle info
  vehicle: {
    type: "bike" | "scooter" | "bicycle";
    registrationNumber?: string;
  };

  // Bank/UPI details (masked)
  upiId: string;

  // Fraud detection metrics
  fraudScore: number; // 0-100, higher = more suspicious
  coolingPeriodUntil?: string; // 48hr cooling period after claim
}

// Claim interface
export interface Claim {
  id: string;
  triggerType: TriggerType;
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  amount: number;
  status: ClaimStatus;
  description: string;

  // Verification data
  verification: {
    gpsValid: boolean;
    platformSessionValid: boolean;
    coolingPeriodClear: boolean;
    mlAnomalyScore: number; // 0-100
    weatherDataMatch: boolean;
    overallValid: boolean;
  };

  // Location at time of claim
  location: { lat: number; lng: number };
  zoneId: string;

  rejectionReason?: string;
}

// Payout interface
export interface Payout {
  id: string;
  date: string;
  amount: number;
  type: "claim" | "bonus" | "refund";
  description: string;
  status: "completed" | "processing" | "failed";
  claimId?: string;
}

// Active disruption (simulated weather/event)
export interface ActiveDisruption {
  id: string;
  type: TriggerType;
  startTime: string;
  endTime?: string;
  severity: "low" | "medium" | "high" | "critical";
  affectedZones: string[];
  description: string;
  weatherData: {
    rainfall_mm?: number;
    temperature_c?: number;
    visibility_m?: number;
    officialNotice?: boolean;
  };
  isActive: boolean;
}

// Dummy workers data
export const workers: Record<string, Worker> = {
  "9876543210": {
    id: "WRK001",
    name: "Rajesh Kumar",
    phone: "9876543210",
    platform: "blinkit",
    joinedDate: "2024-06-15",
    city: "Delhi",

    currentLocation: { lat: 28.6315, lng: 77.2167 },
    assignedZone: "zone_del_1",

    weeklyDeliveries: 127,
    weeklyEarnings: 4850,
    avgRating: 4.8,
    weeklyActiveHours: 42,
    isOnline: true,
    lastActiveTime: new Date().toISOString(),

    insurance: {
      planTier: "shield",
      status: "active",
      weeklyPremium: 59,
      weeklyCap: 1200,
      validFrom: "2026-01-01",
      validUntil: "2026-12-31",
      autoRenewal: true,
      weeklyClaimTotal: 255,
      weekStartDate: "2026-03-17",
    },

    claims: [
      {
        id: "CLM001",
        triggerType: "rainfall",
        date: "2026-03-18",
        startTime: "14:30",
        endTime: "17:30",
        durationMinutes: 180,
        amount: 255,
        status: "paid",
        description: "Heavy rainfall - 22mm/hr recorded",
        verification: {
          gpsValid: true,
          platformSessionValid: true,
          coolingPeriodClear: true,
          mlAnomalyScore: 12,
          weatherDataMatch: true,
          overallValid: true,
        },
        location: { lat: 28.6315, lng: 77.2167 },
        zoneId: "zone_del_1",
      },
      {
        id: "CLM002",
        triggerType: "flood",
        date: "2026-02-20",
        startTime: "10:00",
        endTime: "14:00",
        durationMinutes: 240,
        amount: 400,
        status: "paid",
        description: "Flash flood at Connaught Place area",
        verification: {
          gpsValid: true,
          platformSessionValid: true,
          coolingPeriodClear: true,
          mlAnomalyScore: 8,
          weatherDataMatch: true,
          overallValid: true,
        },
        location: { lat: 28.6320, lng: 77.2180 },
        zoneId: "zone_del_1",
      },
    ],

    payouts: [
      {
        id: "PAY001",
        date: "2026-03-18",
        amount: 255,
        type: "claim",
        description: "Heavy rainfall compensation",
        status: "completed",
        claimId: "CLM001",
      },
      {
        id: "PAY002",
        date: "2026-02-20",
        amount: 400,
        type: "claim",
        description: "Flash flood compensation",
        status: "completed",
        claimId: "CLM002",
      },
    ],

    vehicle: {
      type: "bike",
      registrationNumber: "DL 01 AB 1234",
    },

    upiId: "rajesh****@paytm",
    fraudScore: 8,
  },

  "9988776655": {
    id: "WRK002",
    name: "Priya Sharma",
    phone: "9988776655",
    platform: "zepto",
    joinedDate: "2024-09-20",
    city: "Mumbai",

    currentLocation: { lat: 19.1136, lng: 72.8697 },
    assignedZone: "zone_mum_1",

    weeklyDeliveries: 98,
    weeklyEarnings: 3920,
    avgRating: 4.9,
    weeklyActiveHours: 36,
    isOnline: true,
    lastActiveTime: new Date().toISOString(),

    insurance: {
      planTier: "pro",
      status: "active",
      weeklyPremium: 99,
      weeklyCap: 2000,
      validFrom: "2026-02-01",
      validUntil: "2027-01-31",
      autoRenewal: true,
      weeklyClaimTotal: 300,
      weekStartDate: "2026-03-17",
    },

    claims: [
      {
        id: "CLM003",
        triggerType: "extreme_heat",
        date: "2026-03-15",
        startTime: "12:00",
        endTime: "15:00",
        durationMinutes: 180,
        amount: 300,
        status: "paid",
        description: "Extreme heat wave - 44°C recorded",
        verification: {
          gpsValid: true,
          platformSessionValid: true,
          coolingPeriodClear: true,
          mlAnomalyScore: 5,
          weatherDataMatch: true,
          overallValid: true,
        },
        location: { lat: 19.1140, lng: 72.8700 },
        zoneId: "zone_mum_1",
      },
    ],

    payouts: [
      {
        id: "PAY003",
        date: "2026-03-15",
        amount: 300,
        type: "claim",
        description: "Extreme heat compensation",
        status: "completed",
        claimId: "CLM003",
      },
    ],

    vehicle: {
      type: "scooter",
      registrationNumber: "MH 02 CD 5678",
    },

    upiId: "priya****@gpay",
    fraudScore: 5,
  },

  // TEST CASE: Starter plan - only rainfall & flood covered
  // Extreme heat, cold/fog, civil unrest claims will be REJECTED
  "9111222333": {
    id: "WRK003",
    name: "Amit Verma",
    phone: "9111222333",
    platform: "blinkit",
    joinedDate: "2025-01-10",
    city: "Delhi",

    currentLocation: { lat: 28.5245, lng: 77.2066 },
    assignedZone: "zone_del_2",

    weeklyDeliveries: 85,
    weeklyEarnings: 3200,
    avgRating: 4.5,
    weeklyActiveHours: 32,
    isOnline: true,
    lastActiveTime: new Date().toISOString(),

    insurance: {
      planTier: "starter",
      status: "active",
      weeklyPremium: 29,
      weeklyCap: 500,
      validFrom: "2026-03-01",
      validUntil: "2026-08-31",
      autoRenewal: false,
      weeklyClaimTotal: 0,
      weekStartDate: "2026-03-17",
    },

    claims: [],
    payouts: [],

    vehicle: {
      type: "bicycle",
      registrationNumber: undefined,
    },

    upiId: "amit****@paytm",
    fraudScore: 15,
  },

  // TEST CASE: Worker in 48hr cooling period
  // Any new claim will be REJECTED due to cooling period
  "9444555666": {
    id: "WRK004",
    name: "Neha Gupta",
    phone: "9444555666",
    platform: "zepto",
    joinedDate: "2024-11-05",
    city: "Mumbai",

    currentLocation: { lat: 19.1136, lng: 72.8697 },
    assignedZone: "zone_mum_1",

    weeklyDeliveries: 110,
    weeklyEarnings: 4400,
    avgRating: 4.7,
    weeklyActiveHours: 38,
    isOnline: true,
    lastActiveTime: new Date().toISOString(),

    insurance: {
      planTier: "shield",
      status: "active",
      weeklyPremium: 59,
      weeklyCap: 1200,
      validFrom: "2026-01-01",
      validUntil: "2026-12-31",
      autoRenewal: true,
      weeklyClaimTotal: 340,
      weekStartDate: "2026-03-17",
    },

    claims: [
      {
        id: "CLM010",
        triggerType: "rainfall",
        date: new Date().toISOString().split("T")[0],
        startTime: "10:00",
        endTime: "14:00",
        durationMinutes: 240,
        amount: 340,
        status: "paid",
        description: "Heavy rainfall - claimed today (in cooling period)",
        verification: {
          gpsValid: true,
          platformSessionValid: true,
          coolingPeriodClear: true,
          mlAnomalyScore: 18,
          weatherDataMatch: true,
          overallValid: true,
        },
        location: { lat: 19.1136, lng: 72.8697 },
        zoneId: "zone_mum_1",
      },
    ],

    payouts: [
      {
        id: "PAY010",
        date: new Date().toISOString().split("T")[0],
        amount: 340,
        type: "claim",
        description: "Heavy rainfall compensation",
        status: "completed",
        claimId: "CLM010",
      },
    ],

    vehicle: {
      type: "scooter",
      registrationNumber: "MH 04 EF 9012",
    },

    upiId: "neha****@gpay",
    fraudScore: 20,
    // 48hr cooling period - set to 2 days from now
    coolingPeriodUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  },

  // TEST CASE: Worker at weekly cap limit
  // Claims will be REJECTED due to cap exhausted
  "9777888999": {
    id: "WRK005",
    name: "Vikram Singh",
    phone: "9777888999",
    platform: "blinkit",
    joinedDate: "2024-08-20",
    city: "Bangalore",

    currentLocation: { lat: 12.9352, lng: 77.6245 },
    assignedZone: "zone_blr_1",

    weeklyDeliveries: 142,
    weeklyEarnings: 5680,
    avgRating: 4.6,
    weeklyActiveHours: 48,
    isOnline: true,
    lastActiveTime: new Date().toISOString(),

    insurance: {
      planTier: "starter",
      status: "active",
      weeklyPremium: 29,
      weeklyCap: 500,
      validFrom: "2026-02-01",
      validUntil: "2026-07-31",
      autoRenewal: true,
      weeklyClaimTotal: 500, // Already at cap!
      weekStartDate: "2026-03-17",
    },

    claims: [
      {
        id: "CLM020",
        triggerType: "rainfall",
        date: "2026-03-17",
        startTime: "08:00",
        endTime: "12:00",
        durationMinutes: 240,
        amount: 280,
        status: "paid",
        description: "Heavy rainfall compensation",
        verification: {
          gpsValid: true,
          platformSessionValid: true,
          coolingPeriodClear: true,
          mlAnomalyScore: 10,
          weatherDataMatch: true,
          overallValid: true,
        },
        location: { lat: 12.9352, lng: 77.6245 },
        zoneId: "zone_blr_1",
      },
      {
        id: "CLM021",
        triggerType: "flood",
        date: "2026-03-18",
        startTime: "14:00",
        endTime: "17:00",
        durationMinutes: 180,
        amount: 220,
        status: "paid",
        description: "Flash flood compensation",
        verification: {
          gpsValid: true,
          platformSessionValid: true,
          coolingPeriodClear: true,
          mlAnomalyScore: 15,
          weatherDataMatch: true,
          overallValid: true,
        },
        location: { lat: 12.9355, lng: 77.6250 },
        zoneId: "zone_blr_1",
      },
    ],

    payouts: [
      {
        id: "PAY020",
        date: "2026-03-17",
        amount: 280,
        type: "claim",
        description: "Rainfall compensation",
        status: "completed",
        claimId: "CLM020",
      },
      {
        id: "PAY021",
        date: "2026-03-18",
        amount: 220,
        type: "claim",
        description: "Flood compensation",
        status: "completed",
        claimId: "CLM021",
      },
    ],

    vehicle: {
      type: "bike",
      registrationNumber: "KA 01 GH 3456",
    },

    upiId: "vikram****@phonepe",
    fraudScore: 25,
  },
};

// Active disruptions (simulated)
export let activeDisruptions: ActiveDisruption[] = [];

// Helper function to get worker by phone
export function getWorkerByPhone(phone: string): Worker | null {
  return workers[phone] || null;
}

// Default demo phone for quick login
export const DEMO_PHONE = "9876543210";

// Fraud Detection Functions

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isInDeliveryZone(
  location: { lat: number; lng: number },
  zoneId: string
): boolean {
  const zone = DELIVERY_ZONES.find((z) => z.id === zoneId);
  if (!zone) return false;

  const distance = calculateDistance(
    location.lat,
    location.lng,
    zone.center.lat,
    zone.center.lng
  );

  // 500m buffer as per policy
  return distance <= zone.radiusKm + 0.5;
}

export function checkCoolingPeriod(worker: Worker): boolean {
  if (!worker.coolingPeriodUntil) return true;
  return new Date() > new Date(worker.coolingPeriodUntil);
}

export function calculateMLAnomalyScore(
  worker: Worker,
  claimAmount: number,
  triggerType: TriggerType
): number {
  let score = 0;

  // Factor 1: Claim frequency (more claims = higher score)
  const recentClaims = worker.claims.filter((c) => {
    const claimDate = new Date(c.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return claimDate > weekAgo;
  });
  score += Math.min(recentClaims.length * 10, 30);

  // Factor 2: Claim amount relative to average
  const avgClaim =
    worker.claims.length > 0
      ? worker.claims.reduce((sum, c) => sum + c.amount, 0) / worker.claims.length
      : 200;
  if (claimAmount > avgClaim * 1.5) score += 15;

  // Factor 3: Time of claim (unusual hours)
  const hour = new Date().getHours();
  if (hour < 6 || hour > 23) score += 10;

  // Factor 4: Previous fraud score
  score += worker.fraudScore * 0.5;

  // Factor 5: Random small variation for realism
  score += Math.random() * 5;

  return Math.min(Math.round(score), 100);
}

export interface ClaimValidationResult {
  isValid: boolean;
  gpsValid: boolean;
  platformSessionValid: boolean;
  coolingPeriodClear: boolean;
  mlAnomalyScore: number;
  weatherDataMatch: boolean;
  rejectionReasons: string[];
  payoutAmount: number;
}

export function validateClaim(
  worker: Worker,
  triggerType: TriggerType,
  disruption: ActiveDisruption | null,
  durationMinutes: number,
  location: { lat: number; lng: number }
): ClaimValidationResult {
  const rejectionReasons: string[] = [];
  const plan = PLAN_TIERS[worker.insurance.planTier];
  const trigger = TRIGGER_DEFINITIONS[triggerType];

  // Check 1: GPS Zone validation
  const gpsValid = isInDeliveryZone(location, worker.assignedZone);
  if (!gpsValid) {
    rejectionReasons.push("Location outside assigned delivery zone (>500m)");
  }

  // Check 2: Platform session validation (simulated - check if worker is online)
  const platformSessionValid = worker.isOnline;
  if (!platformSessionValid) {
    rejectionReasons.push("No active platform session detected");
  }

  // Check 3: Cooling period
  const coolingPeriodClear = checkCoolingPeriod(worker);
  if (!coolingPeriodClear) {
    rejectionReasons.push("48-hour cooling period not elapsed from last claim");
  }

  // Check 4: Weather data match
  const weatherDataMatch = disruption !== null && disruption.isActive;
  if (!weatherDataMatch) {
    rejectionReasons.push("No matching weather event detected in your area");
  }

  // Check 5: Trigger covered by plan
  const triggerCovered = plan.triggers.includes(triggerType);
  if (!triggerCovered) {
    rejectionReasons.push(`${trigger.name} is not covered under ${plan.name} plan`);
  }

  // Check 6: Waiting period
  if (disruption && durationMinutes < plan.waitingPeriod) {
    rejectionReasons.push(
      `Minimum waiting period of ${plan.waitingPeriod} minutes not met`
    );
  }

  // Check 7: Weekly cap
  const remainingCap = plan.weeklyCap - worker.insurance.weeklyClaimTotal;
  if (remainingCap <= 0) {
    rejectionReasons.push("Weekly claim cap reached");
  }

  // Calculate ML anomaly score
  const estimatedAmount = Math.min(
    (durationMinutes / 60) * trigger.hourlyRate,
    remainingCap
  );
  const mlAnomalyScore = calculateMLAnomalyScore(worker, estimatedAmount, triggerType);

  // High anomaly score triggers rejection
  if (mlAnomalyScore > 70) {
    rejectionReasons.push("Unusual claim pattern detected by AI");
  }

  // Calculate payout
  const hours = Math.min(durationMinutes / 60, plan.maxHoursPerDay);
  let payoutAmount = Math.round(hours * trigger.hourlyRate);
  payoutAmount = Math.min(payoutAmount, remainingCap);

  const isValid = rejectionReasons.length === 0;

  return {
    isValid,
    gpsValid,
    platformSessionValid,
    coolingPeriodClear,
    mlAnomalyScore,
    weatherDataMatch,
    rejectionReasons,
    payoutAmount: isValid ? payoutAmount : 0,
  };
}

// Simulation functions
export function createDisruption(
  type: TriggerType,
  zoneIds: string[],
  weatherData: ActiveDisruption["weatherData"]
): ActiveDisruption {
  const trigger = TRIGGER_DEFINITIONS[type];
  const id = `DIS_${Date.now()}`;

  const disruption: ActiveDisruption = {
    id,
    type,
    startTime: new Date().toISOString(),
    severity: trigger.severity as "low" | "medium" | "high" | "critical",
    affectedZones: zoneIds,
    description: `${trigger.name} detected - ${trigger.description}`,
    weatherData,
    isActive: true,
  };

  activeDisruptions.push(disruption);
  return disruption;
}

export function endDisruption(disruptionId: string): void {
  const disruption = activeDisruptions.find((d) => d.id === disruptionId);
  if (disruption) {
    disruption.isActive = false;
    disruption.endTime = new Date().toISOString();
  }
}

export function getActiveDisruptionsForZone(zoneId: string): ActiveDisruption[] {
  return activeDisruptions.filter(
    (d) => d.isActive && d.affectedZones.includes(zoneId)
  );
}

export function clearAllDisruptions(): void {
  activeDisruptions = [];
}

// Process a claim
export function processClaim(
  workerPhone: string,
  triggerType: TriggerType,
  durationMinutes: number,
  location: { lat: number; lng: number }
): { claim: Claim; validation: ClaimValidationResult } | null {
  const worker = workers[workerPhone];
  if (!worker) return null;

  // Find active disruption for this trigger type in worker's zone
  const disruption = activeDisruptions.find(
    (d) =>
      d.isActive &&
      d.type === triggerType &&
      d.affectedZones.includes(worker.assignedZone)
  );

  // Validate the claim
  const validation = validateClaim(
    worker,
    triggerType,
    disruption || null,
    durationMinutes,
    location
  );

  // Create claim record
  const claim: Claim = {
    id: `CLM_${Date.now()}`,
    triggerType,
    date: new Date().toISOString().split("T")[0],
    startTime: new Date(Date.now() - durationMinutes * 60000)
      .toTimeString()
      .slice(0, 5),
    endTime: new Date().toTimeString().slice(0, 5),
    durationMinutes,
    amount: validation.payoutAmount,
    status: validation.isValid ? "approved" : "rejected",
    description: disruption?.description || `${TRIGGER_DEFINITIONS[triggerType].name} claim`,
    verification: {
      gpsValid: validation.gpsValid,
      platformSessionValid: validation.platformSessionValid,
      coolingPeriodClear: validation.coolingPeriodClear,
      mlAnomalyScore: validation.mlAnomalyScore,
      weatherDataMatch: validation.weatherDataMatch,
      overallValid: validation.isValid,
    },
    location,
    zoneId: worker.assignedZone,
    rejectionReason: validation.rejectionReasons.join("; "),
  };

  // Add claim to worker's history
  worker.claims.unshift(claim);

  // If approved, create payout and update weekly total
  if (validation.isValid) {
    const payout: Payout = {
      id: `PAY_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      amount: validation.payoutAmount,
      type: "claim",
      description: `${TRIGGER_DEFINITIONS[triggerType].name} compensation`,
      status: "completed",
      claimId: claim.id,
    };
    worker.payouts.unshift(payout);
    worker.insurance.weeklyClaimTotal += validation.payoutAmount;

    // Set 48hr cooling period
    const coolingEnd = new Date();
    coolingEnd.setHours(coolingEnd.getHours() + 48);
    worker.coolingPeriodUntil = coolingEnd.toISOString();

    // Mark claim as paid
    claim.status = "paid";
  }

  return { claim, validation };
}
