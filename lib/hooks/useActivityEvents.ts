'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPublicClient, http, formatEther, type Log, type Address } from 'viem';
import { wirefluid } from '@/lib/chains';
import { MATCH_VAULTS } from '@/lib/contracts';
import { MATCHVAULT_ABI } from '@/src/abi/MatchVault.abi';

/**
 * A single staking activity event parsed from on-chain Staked logs.
 */
export interface ActivityEvent {
  /** Staker address */
  user: string;
  /** Team ID (uint8) the user staked for */
  teamId: number;
  /** Stake amount in wei */
  amount: bigint;
  /** Match ID derived from the vault mapping */
  matchId: number;
  /** Team abbreviation (e.g. "LHR", "KAR") */
  teamName: string;
  /** Transaction hash */
  txHash: string;
  /** Block number */
  blockNumber: bigint;
  /** Unix timestamp in seconds (estimated if block data unavailable) */
  timestamp: number;
}

/**
 * Staked event signature from MatchVault ABI:
 *   event Staked(address indexed user, uint8 indexed teamId, uint256 amount, uint256 newTeamTotal)
 */
const STAKED_EVENT_ABI = {
  anonymous: false,
  inputs: [
    { indexed: true, internalType: 'address', name: 'user', type: 'address' },
    { indexed: true, internalType: 'uint8', name: 'teamId', type: 'uint8' },
    { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    { indexed: false, internalType: 'uint256', name: 'newTeamTotal', type: 'uint256' },
  ],
  name: 'Staked',
  type: 'event',
} as const;

/** Build a reverse lookup: vault address (lowercased) -> { matchId, teamA, teamB } */
function buildVaultLookup() {
  const lookup: Record<string, { matchId: number; teamA: string; teamB: string }> = {};
  for (const [id, vault] of Object.entries(MATCH_VAULTS)) {
    lookup[vault.address.toLowerCase()] = {
      matchId: parseInt(id, 10),
      teamA: vault.teamA,
      teamB: vault.teamB,
    };
  }
  return lookup;
}

const VAULT_LOOKUP = buildVaultLookup();

/** Get all vault addresses from MATCH_VAULTS */
function getAllVaultAddresses(): Address[] {
  return Object.values(MATCH_VAULTS).map((v) => v.address as Address);
}

/** Resolve team name from teamId + vault info */
function resolveTeamName(
  teamId: number,
  vaultAddr: string
): string {
  const info = VAULT_LOOKUP[vaultAddr.toLowerCase()];
  if (!info) return `Team ${teamId}`;
  // The MatchVault constructor takes teamAId and teamBId; from the MATCH_VAULTS mapping
  // we only know short names. We need to figure out which team is A vs B.
  // Since we don't know the on-chain teamAId/teamBId, we use the PSL_TEAMS list for a
  // best-effort match. The teamId in the event corresponds to the PSL_TEAMS id.
  // Import is avoided here; we do a simpler approach: look up from the teams data.
  const PSL_SHORT: Record<number, string> = {
    0: 'ISL', 1: 'KAR', 2: 'LHR', 3: 'MUL',
    4: 'PSH', 5: 'QUE', 6: 'HYD', 7: 'RWP',
  };
  return PSL_SHORT[teamId] ?? info.teamA;
}

/** Shared public client — avoids re-creating on every render */
const publicClient = createPublicClient({
  chain: wirefluid,
  transport: http('https://evm.wirefluid.com'),
});

/**
 * Hook: useActivityEvents
 *
 * Fetches historical Staked events and watches for new ones in real-time.
 *
 * @param vaultAddress - Optional specific vault address. If omitted, watches ALL vaults.
 * @param maxItems - Maximum number of events to return (default 10).
 */
export function useActivityEvents(
  vaultAddress?: Address,
  maxItems: number = 10
) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventsRef = useRef<ActivityEvent[]>([]);
  const mountedRef = useRef(true);

  /** Deduplicate by txHash + logIndex (we use txHash since logIndex isn't tracked) */
  const mergeEvents = useCallback(
    (existing: ActivityEvent[], incoming: ActivityEvent[]): ActivityEvent[] => {
      const seen = new Set(existing.map((e) => `${e.txHash}-${e.user}-${e.teamId}`));
      const newOnes = incoming.filter(
        (e) => !seen.has(`${e.txHash}-${e.user}-${e.teamId}`)
      );
      const merged = [...newOnes, ...existing]
        .sort((a, b) => Number(b.blockNumber - a.blockNumber))
        .slice(0, maxItems * 2); // Keep a buffer
      return merged;
    },
    [maxItems]
  );

  /** Parse a raw log into an ActivityEvent */
  const parseLog = useCallback(
    async (log: Log): Promise<ActivityEvent | null> => {
      try {
        const vaultAddr = log.address;
        const vaultInfo = VAULT_LOOKUP[vaultAddr.toLowerCase()];
        if (!vaultInfo) return null;

        // Decode topics: topic[0] is event sig, topic[1] is user (address), topic[2] is teamId (uint8)
        const userTopic = log.topics[1];
        const teamIdTopic = log.topics[2];
        if (!userTopic || !teamIdTopic) return null;

        const user = `0x${userTopic.slice(26)}` as Address;
        const teamId = parseInt(teamIdTopic, 16);

        // Decode data: amount (uint256) + newTeamTotal (uint256) = 64 bytes each
        const data = log.data;
        const amount = BigInt(`0x${data.slice(2, 66)}`);

        // Try to get block timestamp
        let timestamp = Math.floor(Date.now() / 1000);
        if (log.blockNumber) {
          try {
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber,
            });
            timestamp = Number(block.timestamp);
          } catch {
            // Estimate: assume ~2 second block time on WireFluid
            const currentBlock = await publicClient.getBlockNumber().catch(() => log.blockNumber!);
            const blockDiff = Number(currentBlock - log.blockNumber);
            timestamp = Math.floor(Date.now() / 1000) - blockDiff * 2;
          }
        }

        return {
          user,
          teamId,
          amount,
          matchId: vaultInfo.matchId,
          teamName: resolveTeamName(teamId, vaultAddr),
          txHash: log.transactionHash ?? '0x',
          blockNumber: log.blockNumber ?? BigInt(0),
          timestamp,
        };
      } catch {
        return null;
      }
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;
    let unwatchFns: (() => void)[] = [];

    const addresses = vaultAddress ? [vaultAddress] : getAllVaultAddresses();

    async function fetchHistorical() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch the last ~5000 blocks of events (approx 3 hours at 2s blocks)
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(5000) ? currentBlock - BigInt(5000) : BigInt(0);

        const logs = await publicClient.getLogs({
          address: addresses.length === 1 ? addresses[0] : undefined,
          event: STAKED_EVENT_ABI,
          fromBlock,
          toBlock: 'latest',
        });

        // If watching all vaults, filter to only our vault addresses
        const filteredLogs =
          addresses.length === 1
            ? logs
            : logs.filter((l) =>
                addresses.some(
                  (a) => a.toLowerCase() === l.address.toLowerCase()
                )
              );

        // Parse all logs (limit concurrency by batching)
        const parsed: ActivityEvent[] = [];
        for (const log of filteredLogs.slice(-maxItems * 3)) {
          const evt = await parseLog(log);
          if (evt) parsed.push(evt);
        }

        if (mountedRef.current) {
          const sorted = parsed
            .sort((a, b) => Number(b.blockNumber - a.blockNumber))
            .slice(0, maxItems);
          eventsRef.current = sorted;
          setEvents(sorted);
          setIsLoading(false);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError('Failed to load activity events');
          setIsLoading(false);
        }
      }
    }

    function watchNew() {
      // Watch each vault individually for new Staked events
      for (const addr of addresses) {
        try {
          const unwatch = publicClient.watchContractEvent({
            address: addr,
            abi: [STAKED_EVENT_ABI],
            eventName: 'Staked',
            onLogs: async (logs) => {
              const newEvents: ActivityEvent[] = [];
              for (const log of logs) {
                const evt = await parseLog(log as unknown as Log);
                if (evt) newEvents.push(evt);
              }
              if (newEvents.length > 0 && mountedRef.current) {
                const merged = mergeEvents(eventsRef.current, newEvents);
                const trimmed = merged.slice(0, maxItems);
                eventsRef.current = trimmed;
                setEvents(trimmed);
              }
            },
            pollingInterval: 4_000, // Poll every 4 seconds — balance between freshness and RPC usage
          });
          unwatchFns.push(unwatch);
        } catch {
          // Silently fail for individual watches — historical data still works
        }
      }
    }

    fetchHistorical().then(() => {
      if (mountedRef.current) {
        watchNew();
      }
    });

    return () => {
      mountedRef.current = false;
      for (const unwatch of unwatchFns) {
        try {
          unwatch();
        } catch {
          // cleanup silently
        }
      }
    };
  }, [vaultAddress, maxItems, parseLog, mergeEvents]);

  return { events, isLoading, error };
}
