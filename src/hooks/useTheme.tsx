import { useEffect } from "react";

export const useTheme = () => {
  useEffect(() => {
    // Always use dark mode for NOC dashboard
    document.documentElement.classList.add("dark");
  }, []);
};
