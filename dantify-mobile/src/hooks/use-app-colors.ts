import { useMemo } from "react";
import { getColors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";

export const useAppColors = () => {
  const { resolvedMode } = useTheme();

  const colors = useMemo(() => {
    return getColors(resolvedMode);
  }, [resolvedMode]);

  return colors;
};
