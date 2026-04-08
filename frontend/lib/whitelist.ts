const SUPERADMINS: string[] = [
  "0x79Ac5C4bA1c60E106eCD6031dA5c16D11f09A014",
];

export function isSuperAdmin(address: string): boolean {
  return SUPERADMINS.some((a) => a.toLowerCase() === address.toLowerCase());
}
