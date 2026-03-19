"use client";

import { useState } from "react";
import { getWorkerByPhone, DEMO_PHONE } from "@/lib/data";

type Platform = "blinkit" | "zepto" | null;
type Step = "platform" | "phone" | "otp";

export default function LoginPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
  const [step, setStep] = useState<Step>("platform");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    setStep("phone");
    setError("");
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    // Check if worker exists in our data
    const worker = getWorkerByPhone(phoneNumber);
    if (!worker) {
      setError("No account found. Try demo: " + DEMO_PHONE);
      return;
    }

    // Check if platform matches
    if (worker.platform !== selectedPlatform) {
      setError(`This number is registered with ${worker.platform === "blinkit" ? "Blinkit" : "Zepto"}`);
      return;
    }

    setIsLoading(true);
    setError("");
    // Simulate OTP send
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setStep("otp");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete OTP");
      return;
    }
    setIsLoading(true);
    setError("");
    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Store phone number for dashboard
    localStorage.setItem("userPhone", phoneNumber);
    localStorage.setItem("userPlatform", selectedPlatform || "");

    setIsLoading(false);
    // Redirect to dashboard on success
    window.location.href = "/dashboard";
  };

  const goBack = () => {
    if (step === "otp") {
      setStep("phone");
      setOtp(["", "", "", "", "", ""]);
    } else if (step === "phone") {
      setStep("platform");
      setPhoneNumber("");
    }
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            SwiftShield
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            AI-Powered Parametric Insurance
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6">
          {/* Back Button */}
          {step !== "platform" && (
            <button
              onClick={goBack}
              className="flex items-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
          )}

          {/* Platform Selection Step */}
          {step === "platform" && (
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                Welcome, Delivery Partner
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Login with your delivery platform account
              </p>

              <div className="space-y-3">
                {/* Blinkit Button */}
                <button
                  onClick={() => handlePlatformSelect("blinkit")}
                  className="w-full flex items-center justify-between p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-xl font-bold text-zinc-900">B</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        Blinkit
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Continue with Blinkit account
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-zinc-400 group-hover:text-yellow-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Zepto Button */}
                <button
                  onClick={() => handlePlatformSelect("zepto")}
                  className="w-full flex items-center justify-between p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-xl font-bold text-white">Z</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        Zepto
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Continue with Zepto account
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-zinc-400 group-hover:text-purple-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Phone Number Step */}
          {step === "phone" && (
            <div>
              <div className="flex items-center mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                    selectedPlatform === "blinkit"
                      ? "bg-yellow-400"
                      : "bg-purple-600"
                  }`}
                >
                  <span
                    className={`text-lg font-bold ${
                      selectedPlatform === "blinkit"
                        ? "text-zinc-900"
                        : "text-white"
                    }`}
                  >
                    {selectedPlatform === "blinkit" ? "B" : "Z"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {selectedPlatform === "blinkit" ? "Blinkit" : "Zepto"}{" "}
                    Account
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                Enter your phone number
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                We&apos;ll send an OTP to verify your account
              </p>

              {/* Demo hint */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                  Demo Accounts:
                </p>
                {selectedPlatform === "blinkit" ? (
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <li><strong>9876543210</strong> - Shield Plan (normal)</li>
                    <li><strong>9111222333</strong> - Starter Plan (limited triggers)</li>
                    <li><strong>9777888999</strong> - Weekly cap exhausted</li>
                  </ul>
                ) : (
                  <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                    <li><strong>9988776655</strong> - Pro Plan (normal)</li>
                    <li><strong>9444555666</strong> - In 48hr cooling period</li>
                  </ul>
                )}
              </div>

              <form onSubmit={handlePhoneSubmit}>
                <div className="mb-4">
                  <div className="flex">
                    <span className="inline-flex items-center px-4 text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-r-0 border-zinc-300 dark:border-zinc-700 rounded-l-xl">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 10) setPhoneNumber(value);
                      }}
                      placeholder="Enter 10-digit number"
                      className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-r-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phoneNumber.length !== 10}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending OTP...
                    </span>
                  ) : (
                    "Get OTP"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* OTP Verification Step */}
          {step === "otp" && (
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                Verify OTP
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Enter the 6-digit code sent to{" "}
                <span className="font-medium text-zinc-900 dark:text-white">
                  +91 {phoneNumber}
                </span>
              </p>

              <form onSubmit={handleOtpSubmit}>
                <div className="flex justify-between gap-2 mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-semibold border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {error && (
                  <p className="mb-4 text-sm text-red-500 text-center">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otp.join("").length !== 6}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    "Verify & Login"
                  )}
                </button>

                <button
                  type="button"
                  className="w-full mt-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  Didn&apos;t receive OTP? Resend
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center items-center gap-6 mt-6">
          <div className="flex items-center text-zinc-400">
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-xs">Secure</span>
          </div>
          <div className="flex items-center text-zinc-400">
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="text-xs">IRDAI Registered</span>
          </div>
        </div>
      </div>
    </div>
  );
}
