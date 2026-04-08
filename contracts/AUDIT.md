# BeanScopeAccess Contract Audit

**Date**: 2026-04-08
**Auditor**: GPT-4o (automated)
**Contract**: `contracts/src/BeanScopeAccess.sol`
**Deployed**: `0x7e58620fa1a7211f63adce098b25f2ce7a3d744d` (Base mainnet)

## Score: 9/10

## Findings

### No Critical/High Issues

1. **Reentrancy**: Not vulnerable. No external calls before state updates. Only external call is in `withdraw()`, protected by `onlyOwner`.

2. **Access Control**: Correctly uses `onlyOwner` modifier for `setPrices`, `withdraw`, `transferOwnership`.

3. **Integer Overflow/Underflow**: Solidity 0.8.20 has built-in checks. No risk.

4. **Zero Address Check**: `transferOwnership` correctly rejects zero address.

### Minor / Gas Optimization

5. **Redundant Storage Reads**: `_extend` reads `accessExpiry[user]` multiple times. Could use local variable for gas savings. (Low impact)

6. **No receive/fallback**: Contract cannot accept direct ETH transfers without calling a buy function. This is acceptable behavior.

7. **Event Data**: `_extend` uses `msg.value` in emit — this works since `_extend` is only called from `payable` functions.

## Conclusion

Contract is secure for production use. No critical or high-severity issues found.
