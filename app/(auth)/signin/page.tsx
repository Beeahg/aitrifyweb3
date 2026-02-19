"use client";

import { useEffect } from "react";

export default function SignInRedirect() {
  useEffect(() => {
    window.location.replace("/login");
  }, []);

  return null;
}
