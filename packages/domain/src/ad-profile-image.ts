import type { ProfessionalAd } from "@sigillus/contracts";

export function resolveAdProfileImage(ad: Pick<ProfessionalAd, "images" | "profileImage">) {
  return ad.profileImage || ad.images[1] || ad.images[0] || "";
}

export function isLocalImageSrc(src: string) {
  return src.startsWith("data:") || src.startsWith("blob:");
}
