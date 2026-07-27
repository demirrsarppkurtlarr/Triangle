import { ADMIN_USERNAME } from "@/utils/constants";

export type AdminGateProfile = {
  username: string;
  is_admin: boolean;
  is_frozen: boolean;
};

/**
 * Pure admin gate used by server auth and unit tests.
 * Admin = username demirsarpk AND is_admin AND not frozen.
 */
export function canAccessAdmin(
  profile: AdminGateProfile | null | undefined,
): boolean {
  return Boolean(
    profile &&
      profile.username === ADMIN_USERNAME &&
      profile.is_admin &&
      !profile.is_frozen,
  );
}
