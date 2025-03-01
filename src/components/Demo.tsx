"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { Input } from "../components/ui/input"
import { signIn, signOut, getCsrfToken } from "next-auth/react";
import sdk, {
    AddFrame,
  FrameNotificationDetails,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
  useSwitchChain,
  useChainId,
  useContractReads,
} from "wagmi";
import { config } from "~/components/providers/WagmiProvider";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, degen, mainnet, optimism } from "wagmi/chains";
import { BaseError, UserRejectedRequestError, encodeFunctionData } from "viem";
import { useSession } from "next-auth/react"
import { createStore } from 'mipd'
import { Label } from "~/components/ui/label";
import { HEALTH_ATTESTATIONS_ABI, HEALTH_ATTESTATIONS_ADDRESS } from "~/lib/contracts/HealthAttestations";
import type { Address } from 'viem';


export default function Demo(
  { title }: { title?: string } = { title: "Frames v2 Demo" }
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Daily goals state
  const [sleepHours, setSleepHours] = useState(8);
  const [calories, setCalories] = useState(200);
  const [steps, setSteps] = useState(10000);
  const [showGoals, setShowGoals] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [connectingDevice, setConnectingDevice] = useState<'fitbit' | 'apple' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmittingGoals, setIsSubmittingGoals] = useState(false);
  const [showGoalsSuccess, setShowGoalsSuccess] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);
  const [userTokens, setUserTokens] = useState<number[]>([]);
  const [attestations, setAttestations] = useState<Array<{
    tokenId: number;
    activityType: number;
    username: string;
    value: number;
    timestamp: number;
    streak: number;
  }>>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

  const {
    signTypedData,
    error: signTypedError,
    isError: isSignTypedError,
    isPending: isSignTypedPending,
  } = useSignTypedData();

  const { connect } = useConnect();

  const {
    switchChain,
    error: switchChainError,
    isError: isSwitchChainError,
    isPending: isSwitchChainPending,
  } = useSwitchChain();

  const nextChain = useMemo(() => {
    if (chainId === base.id) {
      return optimism;
    } else if (chainId === optimism.id) {
      return degen;
    } else if (chainId === degen.id) {
      return mainnet;
    } else {
      return base;
    }
  }, [chainId]);

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: nextChain.id });
  }, [switchChain, chainId]);

  const handleDeviceConnect = useCallback((device: 'fitbit' | 'apple') => {
    setIsConnecting(true);
    setConnectingDevice(device);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
      setShowSuccess(true);
      
      // Show success message for 1.5 seconds before showing syncing
      setTimeout(() => {
        setShowSuccess(false);
        setIsSyncing(true);

        // Show syncing for 15 seconds before showing circles
        setTimeout(() => {
          setIsSyncing(false);
          setDeviceConnected(true);
        }, 15000);
      }, 1500);
    }, 2000);
  }, []);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore()

      // Subscribe to the MIPD Store.
      store.subscribe(providerDetails => {
        console.log("PROVIDER DETAILS", providerDetails)
      })
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  const signTyped = useCallback(() => {
    signTypedData({
      domain: {
        name: "Frames v2 Demo",
        version: "1",
        chainId,
      },
      types: {
        Message: [{ name: "content", type: "string" }],
      },
      message: {
        content: "Hello from Frames v2!",
      },
      primaryType: "Message",
    });
  }, [chainId, signTypedData]);

  // Handler for form submission
  const handleGoalsSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingGoals(true);
    console.log('Goals updated:', { sleepHours, calories, steps });
    
    // Simulate submission delay
    setTimeout(() => {
      setIsSubmittingGoals(false);
      setShowGoalsSuccess(true);
      
      // Show success message for 1.5 seconds before proceeding
      setTimeout(() => {
        setShowGoalsSuccess(false);
        setShowGoals(false);
      }, 1500);
    }, 1000);
  }, [sleepHours, calories, steps]);

  // Contract configuration
  const contractConfig = {
    address: HEALTH_ATTESTATIONS_ADDRESS as Address,
    abi: HEALTH_ATTESTATIONS_ABI,
  } as const;

  const {
    sendTransaction: mint,
    data: mintTxHash,
    error: mintError,
    isError: isMintError,
    isPending: isMintPending,
  } = useSendTransaction();

  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintTxHash,
  });

  const handleMint = useCallback(async () => {
    if (!isConnected) {
      console.log('Wallet not connected');
      return;
    }

    // Check if we're on Base network
    if (chainId !== base.id) {
      console.log('Wrong network, switching to Base');
      try {
        await switchChain({ chainId: base.id });
      } catch (error) {
        console.error('Failed to switch network:', error);
        setIsMinting(false);
        return;
      }
    }

    const randomSteps = Math.floor(Math.random() * (12500 - 7500 + 1) + 7500);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const randomStreak = Math.floor(Math.random() * (10 - 3 + 1) + 3);

    try {
      console.log('Starting mint process...');
      console.log('Contract address:', contractConfig.address);
      console.log('User address:', address);
      console.log('Username:', context?.user?.username);
      console.log('Chain ID:', chainId);
      
      const mintParams = {
        activityType: 0n,
        username: context?.user?.username || '',
        value: BigInt(randomSteps),
        timestamp: BigInt(currentTimestamp),
        streak: BigInt(randomStreak)
      };
      
      console.log('Mint parameters:', {
        ...mintParams,
        activityType: Number(mintParams.activityType),
        value: Number(mintParams.value),
        timestamp: Number(mintParams.timestamp),
        streak: Number(mintParams.streak)
      });
      
      setIsMinting(true);
      
      const data = encodeFunctionData({
        abi: HEALTH_ATTESTATIONS_ABI,
        functionName: 'mint',
        args: [
          Number(mintParams.activityType),
          mintParams.username,
          mintParams.value,
          mintParams.timestamp,
          mintParams.streak,
        ],
      });

      console.log('Encoded function data:', data);

      const tx = await mint({
        to: contractConfig.address,
        data,
        chainId: base.id,
      });

      console.log('Transaction sent:', tx);
    } catch (error: any) {
      console.error('Minting error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        transaction: error.transaction
      });
      setIsMinting(false);
      setMintSuccess(false);
    }
  }, [isConnected, mint, context, contractConfig.address, chainId, switchChain, address]);

  // Get user tokens
  const { data: userTokensData } = useContractReads({
    contracts: [
      {
        ...contractConfig,
        functionName: 'getUserTokens',
        args: [context?.user?.username || ''] as const,
      } as const,
    ],
  });

  // Update tokens when data changes
  useEffect(() => {
    if (!userTokensData?.[0]?.result) return;
    const tokens = (userTokensData[0].result as readonly bigint[]).map(token => Number(token));
    setUserTokens(tokens);
  }, [userTokensData]);

  // Get attestations for each token
  const { data: attestationsData } = useContractReads({
    contracts: userTokens.map(tokenId => ({
      ...contractConfig,
      functionName: 'getAttestation',
      args: [BigInt(tokenId)] as const,
    } as const)),
  });

  // Update attestations when data changes
  useEffect(() => {
    if (!attestationsData) return;
    
    const newAttestations = attestationsData
      .map((result, index) => {
        if (!result?.result) return null;
        const [activityType, username, value, timestamp, streak] = result.result as unknown as readonly [bigint, string, bigint, bigint, bigint];
        return {
          tokenId: userTokens[index],
          activityType: Number(activityType),
          username,
          value: Number(value),
          timestamp: Number(timestamp),
          streak: Number(streak),
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    setAttestations(newAttestations);
  }, [attestationsData, userTokens]);

  // Update the mint success handler
  useEffect(() => {
    if (isMintSuccess) {
      console.log('Mint successful');
      setIsMinting(false);
      setMintSuccess(true);
      setTimeout(() => setMintSuccess(false), 3000);
    }
  }, [isMintSuccess]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      paddingTop: context?.client.safeAreaInsets?.top ?? 0, 
      paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
      paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
      paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      backgroundColor: 'black',
      color: 'white'
    }}>
      <div className="w-[350px] mx-auto py-2 px-2">
        {context?.user?.pfpUrl && (
          <div className="flex justify-center mb-4 pt-8 animate-fade-in">
            <img 
              src={context.user.pfpUrl} 
              alt="Profile Picture" 
              className="w-20 h-20 rounded-full border-2 border-purple-500 transition-transform duration-700 hover:scale-105 animate-fade-scale"
            />
          </div>
        )}
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1 className="text-2xl font-bold">Welcome to Liv More</h1>
          {context?.user?.username && (
            <>
              <h1 className="text-2xl font-bold">{context.user.username}</h1>
            </>
          )}
        </div>
        
        <div className="flex justify-center mb-6">
          <img src="/icon.png" alt="Liv More Icon" className="w-44 h-44" />
        </div>

        <p className="text-center text-gray-300 mb-8">
          An innovate GameFi app designed to incentivize
          healthy living by bridging the world of biohacking 
          fitness and blockchain technology.
        </p>

        {showGoals ? (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-center mb-6">Set your daily goals</h2>
            
            {isSubmittingGoals ? (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                </div>
                <p className="text-gray-300 mb-2">
                  Saving your goals...
                </p>
                <p className="text-xs text-gray-400 mb-16">
                  Please wait while we update your preferences
                </p>
              </div>
            ) : showGoalsSuccess ? (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-300 mb-2">
                  Goals successfully saved!
                </p>
              </div>
            ) : (
              <form onSubmit={handleGoalsSubmit} className="mb-4">
                <div className="grid grid-cols-3 gap-6">
                  <div className="flex flex-col items-center">
                    <Label className="text-gray-300 mb-2 font-medium">Sleep</Label>
                    <select 
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Number(e.target.value))}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 hover:border-purple-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-colors"
                    >
                      {Array.from({length: 5}, (_, i) => i + 6).map(hours => (
                        <option key={hours} value={hours}>{hours} hours</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col items-center">
                    <Label className="text-gray-300 mb-2 font-medium">Calories</Label>
                    <select 
                      value={calories}
                      onChange={(e) => setCalories(Number(e.target.value))}
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 hover:border-purple-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-colors"
                    >
                      {Array.from({length: 16}, (_, i) => i * 10 + 150).map(cals => (
                        <option key={cals} value={cals}>{cals} cal</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col items-center">
                    <Label className="text-gray-300 mb-2 font-medium">Steps</Label>
                    <input 
                      type="number" 
                      value={steps}
                      onChange={(e) => setSteps(Number(e.target.value))}
                      placeholder="Enter steps"
                      className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 hover:border-purple-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-colors"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>
                <div className="flex justify-center mt-6 mb-16">
                  <Button type="submit">
                    Save Goals
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : deviceConnected ? (
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-12 grid grid-cols-3 gap-4">
              {/* First circle - Calories */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center relative">
                  <svg className="w-20 h-20 absolute -rotate-90">
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="38" 
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-gray-700"
                    />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="38" 
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="239.389"
                      strokeDashoffset="53.384"
                      className="text-purple-500 transition-all duration-700"
                    />
                  </svg>
                  {/* Fire icon */}
                  <svg className="w-10 h-10 text-purple-500 z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm font-medium text-white">175 / 225</p>
                  <p className="text-xs text-gray-400">Active Calories</p>
                </div>
              </div>

              {/* Second circle - Sleep */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center relative">
                  <svg className="w-20 h-20 absolute -rotate-90">
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="38" 
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-gray-700"
                    />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="38" 
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="239.389"
                      strokeDashoffset="66.547"
                      className="text-purple-500 transition-all duration-700"
                    />
                  </svg>
                  {/* Moon icon */}
                  <svg className="w-10 h-10 text-purple-500 z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm font-medium text-white">6h 30m / 9h</p>
                  <p className="text-xs text-gray-400">Sleep Hours</p>
                </div>
              </div>

              {/* Third circle - Steps */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center relative">
                  <svg className="w-20 h-20 absolute -rotate-90">
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="38" 
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-gray-700"
                    />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="38" 
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="239.389"
                      strokeDashoffset="0"
                      className="text-green-500 transition-all duration-700"
                    />
                  </svg>
                  {/* Steps icon */}
                  <svg className="w-10 h-10 text-green-500 z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                  </svg>
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm font-medium text-white">12,135 / 10,000</p>
                  <p className="text-xs text-gray-400">Steps</p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleMint}
              disabled={!isConnected || isMintPending || isMintConfirming}
              isLoading={isMintPending || isMintConfirming}
              className="bg-purple-500 hover:bg-purple-600 transition-colors mb-8"
            >
              {isMintPending ? (
                "Waiting for approval..."
              ) : isMintConfirming ? (
                "Confirming transaction..."
              ) : mintSuccess ? (
                "Minted!"
              ) : (
                "Mint Achievement Attestation"
              )}
            </Button>
            
            {isMintError && renderError(mintError)}
            {mintTxHash && (
              <div className="mt-2 text-xs text-gray-300 mb-8">
                <div>Transaction Hash: {truncateAddress(mintTxHash)}</div>
                <div>
                  Status:{" "}
                  {isMintConfirming
                    ? "Confirming..."
                    : isMintSuccess
                    ? "Confirmed!"
                    : "Pending"}
                </div>
              </div>
            )}

            {/* Attestations Display */}
            <div className="w-full max-w-[300px]">
              <h3 className="text-xl font-bold mb-4">Your Attestations</h3>
              {attestations.length > 0 ? (
                <div className="space-y-4">
                  {attestations.map((attestation) => (
                    <div 
                      key={attestation.tokenId}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {context?.user?.pfpUrl && (
                          <img 
                            src={context.user.pfpUrl} 
                            alt="Profile" 
                            className="w-8 h-8 rounded-full border border-purple-500"
                          />
                        )}
                        <div>
                          <div className="text-purple-500 font-medium flex items-center gap-2">
                            Token #{attestation.tokenId}
                          </div>
                          <div className="text-sm text-gray-400">
                            @{attestation.username}
                          </div>
                        </div>
                        <div className="ml-auto text-sm text-gray-400">
                          {new Date(attestation.timestamp * 1000).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-gray-300">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">👟</span>
                          <span>{attestation.value.toLocaleString()} steps</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🔥</span>
                          <span>{attestation.streak} day streak</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-[#0052FF]/10 px-2 py-1 rounded-full">
                              <div className="w-2 h-2 bg-[#0052FF] rounded-full animate-pulse"></div>
                              <span className="text-[#0052FF]">Secured on Base</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded-full">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-purple-400">Farcaster Identity</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-center">
                          <a 
                            href={`https://opensea.io/assets/base/0xee925ab29d84e7351965f186a2c37f2ceb2b86bb/${attestation.tokenId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 90 90" fill="currentColor">
                              <path d="M45 0C20.2 0 0 20.2 0 45s20.2 45 45 45 45-20.2 45-45S69.8 0 45 0zM22.1 46.1l.2-.3 9.3-14.5c.1-.2.5-.2.6 0l9.3 14.5.2.3c.1.1.1.3 0 .4l-.2.3-9.3 14.5c-.1.2-.5.2-.6 0l-9.3-14.5-.2-.3c0-.2 0-.3 0-.4zm45.8 4.3c0 .2-.1.3-.3.3h-6.7c-.2 0-.3-.1-.3-.3V41c0-.2.1-.3.3-.3h6.7c.2 0 .3.1.3.3v9.4z"/>
                            </svg>
                            View on OpenSea
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors">
                  <div className="text-6xl mb-4 animate-bounce">🏃‍♂️</div>
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text font-bold text-xl mb-3">
                    Start Your Health Journey
                  </div>
                  <p className="text-gray-300 font-medium mb-4">
                    No attestations yet - let's change that!
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-[#0052FF] rounded-full animate-pulse"></div>
                      <span>Secured on Base Network</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Connected to Farcaster</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isSyncing ? (
          <div className="mb-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                  </div>
                  <p className="text-gray-300 mb-2">
                    Syncing data from {connectingDevice === 'fitbit' ? 'Fitbit' : 'Apple Health'}...
                  </p>
                  <p className="text-xs text-gray-400 mb-16">
                    Please wait while we fetch your health data
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-center mb-6">Connect your device</h2>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex flex-col items-center gap-4">
                {isConnecting ? (
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                    </div>
                    <p className="text-gray-300 mb-2">
                      Connecting to {connectingDevice === 'fitbit' ? 'Fitbit' : 'Apple Health'}...
                    </p>
                    <p className="text-xs text-gray-400">
                      Please wait while we establish the connection
                    </p>
                  </div>
                ) : showSuccess ? (
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-2">
                      Successfully connected to {connectingDevice === 'fitbit' ? 'Fitbit' : 'Apple Health'}!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-gray-300 mb-4">
                        Connect your fitness device to start tracking your progress
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                      <Button 
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleDeviceConnect('fitbit')}
                      >
                        <img src="/fitbit-icon.svg" alt="Fitbit" className="w-6 h-6" />
                        Fitbit
                      </Button>
                      <Button 
                        className="flex items-center justify-center gap-2 bg-black hover:bg-gray-900"
                        onClick={() => handleDeviceConnect('apple')}
                      >
                        <img src="/apple-health-icon.svg" alt="Apple Health" className="w-6 h-6" />
                        Apple Health
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-4">
                      Your data will be securely synchronized with Liv More
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const renderError = (error: Error | null) => {
  if (!error) return null;
  if (error instanceof BaseError) {
    const isUserRejection = error.walk(
      (e) => e instanceof UserRejectedRequestError
    );

    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>;
    }
  }

  return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
};
