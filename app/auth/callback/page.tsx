"use client";

import Link from "next/link";

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#07073a] via-[#121244] to-black p-4">
      <div className="bg-white/10 p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4 text-[#56ffbc]">
          Congratulations! Email Confirmed!
        </h1>
        <p className="mb-6 text-white/80">
          Your email has been successfully confirmed. You can now log in to
          your account.
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-6 py-2 bg-[#56ffbc] text-[#07073a] rounded-lg font-semibold hover:bg-[#11998e] transition"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}