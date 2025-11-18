import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    onResize();

    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    media.addEventListener("change", onResize);
    window.addEventListener("resize", onResize);

    return () => {
      media.removeEventListener("change", onResize);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return isMobile;
}
