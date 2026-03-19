"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Worker,
  ActiveDisruption,
  TriggerType,
  ClaimValidationResult,
  Claim,
  getWorkerByPhone,
  DEMO_PHONE,
  PLAN_TIERS,
  TRIGGER_DEFINITIONS,
  DELIVERY_ZONES,
  createDisruption,
  endDisruption,
  getActiveDisruptionsForZone,
  processClaim,
  clearAllDisruptions,
  activeDisruptions,
} from "@/lib/data";

export default function SimulatePage() {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [disruptions, setDisruptions] = useState<ActiveDisruption[]>([]);
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType | null>(null);
  const [claimDuration, setClaimDuration] = useState(60);
  const [claimResult, setClaimResult] = useState<{
    claim: Claim;
    validation: ClaimValidationResult;
  } | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // GPS simulation
  const [simulatedGPS, setSimulatedGPS] = useState<{ lat: number; lng: number } | null>(null);
  const [isOutsideZone, setIsOutsideZone] = useState(false);

  useEffect(() => {
    const phone = localStorage.getItem("userPhone") || DEMO_PHONE;
    const workerData = getWorkerByPhone(phone);
    if (workerData) {
      setWorker({ ...workerData });
      setSimulatedGPS(workerData.currentLocation);
    }
    setLoading(false);

    // Check for active disruptions
    const interval = setInterval(() => {
      setDisruptions([...activeDisruptions]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const refreshWorker = () => {
    const phone = localStorage.getItem("userPhone") || DEMO_PHONE;
    const workerData = getWorkerByPhone(phone);
    if (workerData) {
      setWorker({ ...workerData });
    }
  };

  const handleCreateDisruption = (type: TriggerType) => {
    if (!worker) return;

    const weatherData: ActiveDisruption["weatherData"] = {};
    switch (type) {
      case "rainfall":
        weatherData.rainfall_mm = 18 + Math.random() * 10;
        break;
      case "extreme_heat":
        weatherData.temperature_c = 43 + Math.random() * 3;
        break;
      case "flood":
        weatherData.rainfall_mm = 30 + Math.random() * 20;
        break;
      case "cold_fog":
        weatherData.visibility_m = 30 + Math.random() * 20;
        weatherData.temperature_c = 3 + Math.random() * 2;
        break;
      case "civil_unrest":
        weatherData.officialNotice = true;
        break;
    }

    createDisruption(type, [worker.assignedZone], weatherData);
    setDisruptions([...activeDisruptions]);
    setSelectedTrigger(type);
  };

  const handleEndDisruption = (id: string) => {
    endDisruption(id);
    setDisruptions([...activeDisruptions]);
  };

  const handleClearAll = () => {
    clearAllDisruptions();
    setDisruptions([]);
    setSelectedTrigger(null);
  };

  const handleFileClaim = async () => {
    if (!worker || !selectedTrigger || !simulatedGPS) return;

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 2000)); // Simulate processing

    const result = processClaim(
      worker.phone,
      selectedTrigger,
      claimDuration,
      simulatedGPS
    );

    setIsProcessing(false);

    if (result) {
      setClaimResult(result);
      setShowClaimModal(true);
      refreshWorker();
    }
  };

  const toggleGPSLocation = () => {
    if (!worker) return;

    if (isOutsideZone) {
      // Move back to zone
      setSimulatedGPS(worker.currentLocation);
      setIsOutsideZone(false);
    } else {
      // Move outside zone (5km away)
      setSimulatedGPS({
        lat: worker.currentLocation.lat + 0.05,
        lng: worker.currentLocation.lng + 0.05,
      });
      setIsOutsideZone(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Please login first
          </h2>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const plan = PLAN_TIERS[worker.insurance.planTier];
  const zone = DELIVERY_ZONES.find((z) => z.id === worker.assignedZone);
  const activeZoneDisruptions = getActiveDisruptionsForZone(worker.assignedZone);
  const remainingCap = plan.weeklyCap - worker.insurance.weeklyClaimTotal;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              Disruption Simulator
            </h1>
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Testing Environment
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Worker Status */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-4 ${
                  worker.platform === "blinkit" ? "bg-yellow-400 text-zinc-900" : "bg-purple-600"
                }`}
              >
                {worker.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">{worker.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {zone?.name}, {zone?.city} • {plan.name} Plan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Weekly Remaining</p>
                <p className="font-semibold text-zinc-900 dark:text-white">
                  ₹{remainingCap} / ₹{plan.weeklyCap}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${worker.isOnline ? "bg-emerald-500" : "bg-zinc-400"}`}></div>
            </div>
          </div>
        </div>

        {/* GPS Simulation */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">GPS Location Simulation</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Current: {simulatedGPS?.lat.toFixed(4)}, {simulatedGPS?.lng.toFixed(4)}
                {isOutsideZone && <span className="text-red-500 ml-2">(Outside Zone!)</span>}
              </p>
            </div>
            <button
              onClick={toggleGPSLocation}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                isOutsideZone
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {isOutsideZone ? "Move Back to Zone" : "Simulate Outside Zone"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Trigger Disruptions */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Trigger Disruption</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Simulate weather events in your zone
              </p>
            </div>
            <div className="p-4 space-y-3">
              {(Object.keys(TRIGGER_DEFINITIONS) as TriggerType[]).map((type) => {
                const trigger = TRIGGER_DEFINITIONS[type];
                const isCovered = plan.triggers.includes(type);
                const isActive = activeZoneDisruptions.some((d) => d.type === type);

                return (
                  <div
                    key={type}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isActive
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : isCovered
                        ? "border-zinc-200 dark:border-zinc-700 hover:border-blue-400"
                        : "border-zinc-200 dark:border-zinc-700 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{trigger.icon}</span>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {trigger.name}
                            {!isCovered && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">
                                Not in {plan.name}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {trigger.threshold} • ₹{trigger.hourlyRate}/hr
                          </p>
                        </div>
                      </div>
                      {isActive ? (
                        <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCreateDisruption(type)}
                          disabled={!isCovered}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Trigger
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Disruptions & File Claim */}
          <div className="space-y-6">
            {/* Active Disruptions */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-white">Active Disruptions</h3>
                {disruptions.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="p-4">
                {activeZoneDisruptions.length === 0 ? (
                  <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                    No active disruptions in your zone
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeZoneDisruptions.map((d) => {
                      const trigger = TRIGGER_DEFINITIONS[d.type];
                      const startTime = new Date(d.startTime);
                      const durationMins = Math.round((Date.now() - startTime.getTime()) / 60000);

                      return (
                        <div
                          key={d.id}
                          className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center">
                                <span className="text-xl mr-2">{trigger.icon}</span>
                                <span className="font-medium text-zinc-900 dark:text-white">
                                  {trigger.name}
                                </span>
                                <span className="ml-2 px-2 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 rounded text-xs">
                                  {d.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                Duration: {durationMins} mins
                                {d.weatherData.rainfall_mm && ` • ${d.weatherData.rainfall_mm.toFixed(1)}mm/hr`}
                                {d.weatherData.temperature_c && ` • ${d.weatherData.temperature_c.toFixed(1)}°C`}
                                {d.weatherData.visibility_m && ` • ${d.weatherData.visibility_m.toFixed(0)}m visibility`}
                              </p>
                            </div>
                            <button
                              onClick={() => handleEndDisruption(d.id)}
                              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                            >
                              End
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* File Claim */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-white">File Insurance Claim</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Submit claim for active disruption
                </p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Select Trigger Type
                  </label>
                  <select
                    value={selectedTrigger || ""}
                    onChange={(e) => setSelectedTrigger(e.target.value as TriggerType)}
                    className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  >
                    <option value="">Select trigger...</option>
                    {(Object.keys(TRIGGER_DEFINITIONS) as TriggerType[]).map((type) => (
                      <option key={type} value={type}>
                        {TRIGGER_DEFINITIONS[type].icon} {TRIGGER_DEFINITIONS[type].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Disruption Duration (minutes)
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="480"
                    step="15"
                    value={claimDuration}
                    onChange={(e) => setClaimDuration(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    <span>15 min</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {claimDuration} minutes ({(claimDuration / 60).toFixed(1)} hrs)
                    </span>
                    <span>8 hrs</span>
                  </div>
                </div>

                {selectedTrigger && (
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Estimated payout:{" "}
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        ₹
                        {Math.min(
                          Math.round(
                            (claimDuration / 60) * TRIGGER_DEFINITIONS[selectedTrigger].hourlyRate
                          ),
                          remainingCap
                        )}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Rate: ₹{TRIGGER_DEFINITIONS[selectedTrigger].hourlyRate}/hr •
                      Min wait: {plan.waitingPeriod} mins •
                      Cap remaining: ₹{remainingCap}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleFileClaim}
                  disabled={!selectedTrigger || isProcessing}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing Claim...
                    </>
                  ) : (
                    "Submit Claim"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fraud Detection Info */}
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
            Fraud Detection Checks (4 Layers)
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">1. GPS Validation</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Must be within 500m of assigned zone</p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">2. Platform Session</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Active session on Blinkit/Zepto</p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">3. Cooling Period</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">48hr wait between claims</p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">4. ML Anomaly Score</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">AI pattern detection</p>
            </div>
          </div>
        </div>
      </main>

      {/* Claim Result Modal */}
      {showClaimModal && claimResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              {claimResult.validation.isValid ? (
                <>
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Claim Approved!</h3>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">₹{claimResult.validation.payoutAmount}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Credited to {worker.upiId}</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Claim Rejected</h3>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    {claimResult.claim.rejectionReason}
                  </p>
                </>
              )}
            </div>

            {/* Verification Details */}
            <div className="space-y-2 mb-6">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Verification Results</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-lg text-sm ${claimResult.validation.gpsValid ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}>
                  {claimResult.validation.gpsValid ? "✓" : "✗"} GPS Zone
                </div>
                <div className={`p-2 rounded-lg text-sm ${claimResult.validation.platformSessionValid ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}>
                  {claimResult.validation.platformSessionValid ? "✓" : "✗"} Platform Session
                </div>
                <div className={`p-2 rounded-lg text-sm ${claimResult.validation.coolingPeriodClear ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}>
                  {claimResult.validation.coolingPeriodClear ? "✓" : "✗"} Cooling Period
                </div>
                <div className={`p-2 rounded-lg text-sm ${claimResult.validation.weatherDataMatch ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}>
                  {claimResult.validation.weatherDataMatch ? "✓" : "✗"} Weather Match
                </div>
              </div>
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">ML Anomaly Score</span>
                  <span className={`text-sm font-medium ${claimResult.validation.mlAnomalyScore > 70 ? "text-red-600" : claimResult.validation.mlAnomalyScore > 40 ? "text-yellow-600" : "text-emerald-600"}`}>
                    {claimResult.validation.mlAnomalyScore}/100
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full ${claimResult.validation.mlAnomalyScore > 70 ? "bg-red-500" : claimResult.validation.mlAnomalyScore > 40 ? "bg-yellow-500" : "bg-emerald-500"}`}
                    style={{ width: `${claimResult.validation.mlAnomalyScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClaimModal(false)}
                className="flex-1 py-3 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Close
              </button>
              <Link
                href="/dashboard"
                className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 text-center"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
