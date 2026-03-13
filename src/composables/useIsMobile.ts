import { breakpointsTailwind } from "@vueuse/core";

export function useIsMobile() {
  const { smaller } = useBreakpoints(breakpointsTailwind);
  return smaller("md");
}
