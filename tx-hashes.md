# PSL Fan Clash -- Transaction Hashes

## Network: WireFluid Testnet (Chain ID: 92533)
- RPC: https://evm.wirefluid.com
- Explorer: https://wirefluidscan.com
- Deployer: `0xcf5E4c050e55b92b52E47EF651Cb7d73D06B1740`
- Deployment Date: 2026-03-22

---

## Contract Deployments

| Contract | Address | Tx Hash | Gas Used | Date |
|----------|---------|---------|----------|------|
| SeasonLeaderboard | `0x4E00eB85EfB17D77B25433B2BCA361F314B04790` | `0xfc758575abeab2eb1ea70e21e10abe2832117d8398d6abfdce3e82e61b01fc62` | 1,028,728 | 2026-03-22 |
| CharityDAO | `0x6975E69Af5B1849B96b8674993e549E3337cD085` | `0xae7f1a33fcb3ae57c806557307e1acd1c3c01f06e78d8cfe20fac83460939f3e` | 1,116,937 | 2026-03-22 |
| MatchFactory | `0xCa9B17553032b03D968C20477520287A82Be14A7` | `0xf55c476456c55633a9501bd571d1fe73b82148c477522a360a7b575b7cb36fdf` | 2,111,467 | 2026-03-22 |
| FanID (Soulbound ERC-721) | `0x1b1e3c95F1ba7ec79dAF74e34AAb2f08DdCCC90F` | `0x70d7e342b7d9cf5f626d3d008c42d4ea3e2aac2025282f0a41307afcf47e77de` | 1,345,253 | 2026-04-14 |
| PulseToken (ERC-20) | `0x6baFF48B91a340caa3BAC2bCF13706b60464B2EE` | `0x3414afa2a4e169e5490f3224d1e363097a5e2d8c96e9aae5d144fb231a228c53` | 858,314 | 2026-04-14 |

## Contract Wiring Transactions

| Action | Tx Hash | Gas Used |
|--------|---------|----------|
| MatchFactory.setCharityDAO | `0xe304f64d24b4e54b54242ebacea2b817753f9fd3aa41e55c6930b9845e6f991f` | 47,295 |
| MatchFactory.setLeaderboard | `0xe9e26b1fd10a8f45fbb6544d645f4ed7e6df43d3d1f63d755fa3c15271d5ea6c` | 47,498 |
| CharityDAO.setMatchFactory | `0x8363ddb47061792e020295a7339686926f05bbfa026838c40215212645863a0e` | 47,218 |
| CharityDAO.setLeaderboard | `0x52973d815da330dab344ff58f5fe906f4883fa63363166273dcc51a208bef3b6` | 47,514 |
| SeasonLeaderboard.setMatchFactory | `0xf095d48d26b7deb7406cd681116f68e95448d2c203c208b5e64f5528a11b75c2` | 46,086 |
| SeasonLeaderboard.setCharityDAO | `0x67235716a828628712d3354ccab7e2e1fd7a17a1f6c03dd2681035a91bd9898d` | 46,240 |

## Charity Registrations

| Charity | Tx Hash | Gas Used |
|---------|---------|----------|
| Edhi Foundation | `0x280bc8712031516371941ebd6d75e669efab984ba057df07d5d3e82874c96c2a` | 137,814 |
| Shaukat Khanum | `0xdd569d4f5f06d757b9e8dd816c93775637ca5667728076d72c8b78e81627f1a4` | 120,618 |
| The Citizens Foundation | `0x6f1e59c85895d5f7d8c400d18631699292d3e9db7b547e3914dc93a1bb9a2061` | 120,834 |

## Demo Match Vaults

| Match | Teams | Vault Address | Tx Hash | Gas Used |
|-------|-------|---------------|---------|----------|
| 1 | LHR vs HYD | `0x868F48Eb49165fC533f8D9e1f37D322CB12bBc56` | `0x68367557839d82fd7b2d8e2643354f84a35fbb9d831d8db4d5c57d587dc16a72` | 1,134,345 |
| 2 | ISL vs KAR | `0xC6E35A526Ab373af49Ec6470151DEe345BAF997B` | `0x4cc23f2b0098d87bb3caee290c5b3c7a203db6bf0ae1a250d1a90b2647c4b84c` | 1,117,233 |
| 3 | PSH vs MUL | `0xf6d7345bA5E5d094c17aF0F1954E8a01113eAB74` | `0x19048ff109c28f19399d106a9c080813adc2579210a9e7d553f07eb092db2586` | 1,117,245 |

## Demo Transactions (Match 1 Full Flow)

| Action | Tx Hash | Gas Used |
|--------|---------|----------|
| Stake 0.5 WIRE for LHR | `0xc5f90bed7b2b0bcb28d681b2a0dbb3b0123820cc7231cb08d08b85fb97ff6fe1` | 107,608 |
| Stake additional 0.3 WIRE for LHR | `0x916c8780ee33d054305e2742a43e1ca237f6ec0b6c2ca942e6b3642ed544557e` | 56,280 |
| Lock Match 1 | `0xe88ee7b02958e6ae65e406a67820266a7f69fc5920a1f7f85b0ffd16e28197bb` | 58,812 |
| Resolve Match 1 (LHR wins) | `0xef5c243ea4ea72751914407246e82272a820be507f6ace5b2793546fc513157b` | 159,270 |
| Claim reward | `0xed96477640a81b01561937b4fde3577720c8ad4dd5f7faa2bc98b6152f4cbb01` | 56,302 |

## Total Gas Summary

| Category | Total Gas |
|----------|-----------|
| Contract Deployments | 4,257,132 |
| Wiring Transactions | 281,851 |
| Charity Registrations | 379,266 |
| Demo Match Creation | 3,368,823 |
| Demo Transactions | 438,272 |
| **Grand Total** | **8,725,344** |

## WIRE Usage Summary

| Phase | WIRE Spent |
|-------|-----------|
| Contract Deployment + Wiring | ~0.051 WIRE |
| Setup (Charities + Matches) | ~0.042 WIRE |
| Demo Transactions (0.8 WIRE staked, 0.656 returned) | ~0.125 WIRE |
| **Total WIRE Consumed** | **~0.218 WIRE** |

## Explorer Links

All transactions can be verified at https://wirefluidscan.com:

- [SeasonLeaderboard](https://wirefluidscan.com/address/0x4E00eB85EfB17D77B25433B2BCA361F314B04790)
- [CharityDAO](https://wirefluidscan.com/address/0x6975E69Af5B1849B96b8674993e549E3337cD085)
- [MatchFactory](https://wirefluidscan.com/address/0xCa9B17553032b03D968C20477520287A82Be14A7)
- [Match 1 Vault (LHR vs HYD)](https://wirefluidscan.com/address/0x868F48Eb49165fC533f8D9e1f37D322CB12bBc56)
- [Match 2 Vault (ISL vs KAR)](https://wirefluidscan.com/address/0xC6E35A526Ab373af49Ec6470151DEe345BAF997B)
- [Match 3 Vault (PSH vs MUL)](https://wirefluidscan.com/address/0xf6d7345bA5E5d094c17aF0F1954E8a01113eAB74)
