export { verificationRouter } from "./router";
export {
  createLoggingVerificationNotifier,
  createVerificationService,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_MAX_ATTEMPTS,
  type VerificationNotifier,
  type VerificationService,
  type VerificationServiceDeps,
  type VerificationUser,
} from "./service";
