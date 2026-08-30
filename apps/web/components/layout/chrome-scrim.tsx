import {
  chromeScrim,
  chromeScrimBlur,
  chromeScrimBlurDark,
  chromeScrimDark,
} from "@/lib/chrome-styles";

interface ChromeScrimProps {
  variant?: "light" | "dark";
}

export function ChromeScrim({ variant = "light" }: ChromeScrimProps) {
  if (variant === "dark") {
    return (
      <>
        <div className={chromeScrimDark} aria-hidden />
        <div className={chromeScrimBlurDark} aria-hidden />
      </>
    );
  }

  return (
    <>
      <div className={chromeScrim} aria-hidden />
      <div className={chromeScrimBlur} aria-hidden />
    </>
  );
}
