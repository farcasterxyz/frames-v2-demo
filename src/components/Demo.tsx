"use client";

import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  createApproveInstruction,
} from "@solana/spl-token";
import {
  useConnection as useSolanaConnection,
  useWallet as useSolanaWallet,
} from '@solana/wallet-adapter-react';
import { jwtDecode } from "jwt-decode";
import {
  PublicKey as SolanaPublicKey,
  SystemProgram as SolanaSystemProgram,
  Transaction as SolanaTransaction,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import { useEffect, useCallback, useState, useMemo, type ChangeEvent } from "react";
import { Input } from "../components/ui/input";
import sdk, {
  AddMiniApp,
  ComposeCast,
  MiniAppNotificationDetails,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/miniapp-sdk";
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
  useWalletClient,
} from "wagmi";

import { config } from "~/components/providers/WagmiProvider";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, degen, mainnet, monadTestnet, optimism, unichain } from "wagmi/chains";
import { BaseError, parseEther, UserRejectedRequestError, encodeFunctionData, parseAbi } from "viem";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";


// Handles JSON strinify with `BigInt` values
function safeJsonStringify(obj: unknown) {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
}

export default function Demo(
  { title }: { title?: string } = { title: "Frames v2 Demo" }
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext>();
  const [token, setToken] = useState<string | null>(null);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [added, setAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] =
    useState<MiniAppNotificationDetails | null>(null);

  const [lastEvent, setLastEvent] = useState("");

  const [addFrameResult, setAddFrameResult] = useState("");
  const [sendNotificationResult, setSendNotificationResult] = useState("");

  useEffect(() => {
    setNotificationDetails(context?.client.notificationDetails ?? null);
  }, [context]);

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

  const { disconnect } = useDisconnect();
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
    } else if (chainId === mainnet.id) {
      return unichain;
    } else {
      return base;
    }
  }, [chainId]);

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: nextChain.id });
  }, [switchChain, nextChain.id]);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      setAdded(context.client.added);

      sdk.on("miniAppAdded", ({ notificationDetails }) => {
        setLastEvent(
          `miniAppAdded${!!notificationDetails ? ", notifications enabled" : ""}`
        );

        setAdded(true);
        if (notificationDetails) {
          setNotificationDetails(notificationDetails);
        }
      });

      sdk.on("miniAppAddRejected", ({ reason }) => {
        setLastEvent(`miniAppAddRejected, reason ${reason}`);
      });

      sdk.on("miniAppRemoved", () => {
        setLastEvent("miniAppRemoved");
        setAdded(false);
        setNotificationDetails(null);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        setLastEvent("notificationsEnabled");
        setNotificationDetails(notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        setLastEvent("notificationsDisabled");
        setNotificationDetails(null);
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      const ethereumProvider = await sdk.wallet.getEthereumProvider();
      ethereumProvider?.on("chainChanged", (chainId) => {
        console.log("[ethereumProvider] chainChanged", chainId)
      })
      ethereumProvider?.on("connect", (connectInfo) => {
        console.log("[ethereumProvider] connect", connectInfo);
      });

      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  const openUrl = useCallback(() => {
    sdk.actions.openUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  }, []);

  const openWarpcastUrl = useCallback(() => {
    sdk.actions.openUrl("https://warpcast.com/~/compose");
  }, []);

  const close = useCallback(() => {
    sdk.actions.close();
  }, []);

  const addFrame = useCallback(async () => {
    try {
      setNotificationDetails(null);

      const result = await sdk.actions.addFrame();

      if (result.notificationDetails) {
        setNotificationDetails(result.notificationDetails);
      }
      setAddFrameResult(
        result.notificationDetails
          ? `Added, got notificaton token ${result.notificationDetails.token} and url ${result.notificationDetails.url}`
          : "Added, got no notification details"
      );
    } catch (error) {
      if (error instanceof AddMiniApp.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddMiniApp.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  const sendNotification = useCallback(async () => {
    setSendNotificationResult("");
    if (!notificationDetails || !context) {
      return;
    }

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        mode: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: context.user.fid,
          notificationDetails,
        }),
      });

      if (response.status === 200) {
        setSendNotificationResult("Success");
        return;
      } else if (response.status === 429) {
        setSendNotificationResult("Rate limited");
        return;
      }

      const data = await response.text();
      setSendNotificationResult(`Error: ${data}`);
    } catch (error) {
      setSendNotificationResult(`Error: ${error}`);
    }
  }, [context, notificationDetails]);

  const sendTx = useCallback(() => {
    sendTransaction(
      {
        // call yoink() on Yoink contract
        to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
        data: "0x9846cd9efc000023c0",
        chainId: monadTestnet.id,
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
        },
      }
    );
  }, [sendTransaction]);

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

  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev);
  }, []);

  const { publicKey: solanaPublicKey } = useSolanaWallet();
  const solanaAddress = solanaPublicKey?.toBase58();

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

        <div className="mb-4">
          <h2 className="font-2xl font-bold">Context</h2>
          <button
            onClick={toggleContext}
            className="flex items-center gap-2 transition-colors"
          >
            <span
              className={`transform transition-transform ${isContextOpen ? "rotate-90" : ""
                }`}
            >
              ➤
            </span>
            Tap to expand
          </button>

          {isContextOpen && (
            <div className="p-4 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                {safeJsonStringify(context)}
              </pre>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-2xl font-bold">Actions</h2>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.experimental.quickAuth
              </pre>
            </div>
            <QuickAuth setToken={setToken} token={token} />
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.experimental.signManifest
              </pre>
            </div>
            <SignManifest />
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.composeCast
              </pre>
            </div>
            <ComposeCastAction />
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.openUrl
              </pre>
            </div>
            <Button onClick={openUrl}>Open Link</Button>
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.openUrl
              </pre>
            </div>
            <Button onClick={openWarpcastUrl}>Open Warpcast Link</Button>
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.viewProfile
              </pre>
            </div>
            <ViewProfile />
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.openMiniApp
              </pre>
            </div>
            <OpenMiniApp />
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.close
              </pre>
            </div>
            <Button onClick={close}>Close Frame</Button>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="font-2xl font-bold">Last event</h2>

          <div className="p-4 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
              {lastEvent || "none"}
            </pre>
          </div>
        </div>

        <div>
          <h2 className="font-2xl font-bold">Add to client & notifications</h2>

          <div className="mt-2 mb-4 text-sm">
            Client fid {context?.client.clientFid},
            {added ? " frame added to client," : " frame not added to client,"}
            {notificationDetails
              ? " notifications enabled"
              : " notifications disabled"}
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.addFrame
              </pre>
            </div>
            {addFrameResult && (
              <div className="mb-2 text-sm">
                Add frame result: {addFrameResult}
              </div>
            )}
            <Button onClick={addFrame} disabled={added}>
              Add frame to client
            </Button>
          </div>

          {sendNotificationResult && (
            <div className="mb-2 text-sm">
              Send notification result: {sendNotificationResult}
            </div>
          )}
          <div className="mb-4">
            <Button onClick={sendNotification} disabled={!notificationDetails}>
              Send notification
            </Button>
          </div>
        </div>

        <div>
          <h2 className="font-2xl font-bold">Ethereum</h2>

          {address && (
            <div className="my-2 text-xs">
              Address: <pre className="inline">{truncateAddress(address)}</pre>
            </div>
          )}

          {chainId && (
            <div className="my-2 text-xs">
              Chain ID: <pre className="inline">{chainId}</pre>
            </div>
          )}

          <div className="mb-4">
            <Button
              onClick={() =>
                isConnected
                  ? disconnect()
                  : connect({ connector: config.connectors[0] })
              }
            >
              {isConnected ? "Disconnect" : "Connect"}
            </Button>
          </div>

          <div className="mb-4">
            <SignEthMessage />
          </div>

          {isConnected && (
            <>
              <div className="mb-4">
                <SendEth />
              </div>
              <div className="mb-4">
                <Button
                  onClick={sendTx}
                  disabled={!isConnected || isSendTxPending}
                  isLoading={isSendTxPending}
                >
                  Send Transaction (contract)
                </Button>
                {isSendTxError && renderError(sendTxError)}
                {txHash && (
                  <div className="mt-2 text-xs">
                    <div>Hash: {truncateAddress(txHash)}</div>
                    <div>
                      Status:{" "}
                      {isConfirming
                        ? "Confirming..."
                        : isConfirmed
                          ? "Confirmed!"
                          : "Pending"}
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <Button
                  onClick={signTyped}
                  disabled={!isConnected || isSignTypedPending}
                  isLoading={isSignTypedPending}
                >
                  Sign Typed Data
                </Button>
                {isSignTypedError && renderError(signTypedError)}
              </div>
              <div className="mb-4">
                <Button
                  onClick={handleSwitchChain}
                  disabled={isSwitchChainPending}
                  isLoading={isSwitchChainPending}
                >
                  Switch to {nextChain.name}
                </Button>
                {isSwitchChainError && renderError(switchChainError)}
              </div>
              <div className="mb-4">
                <TestBatchOperation />
              </div>
            </>
          )}
        </div>

        {solanaAddress && (
          <div>
            <h2 className="font-2xl font-bold">Solana</h2>
            <div className="my-2 text-xs">
              Address: <pre className="inline">{truncateAddress(solanaAddress)}</pre>
            </div>
            <div className="mb-4">
              <SignSolanaMessage />
            </div>
            <div className="mb-4">
              <SendSolana />
            </div>
            <div className="mb-4">
              <SendTokenSolana />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ComposeCastAction() {
  const channelOptions = useMemo(
    () => [
      { value: "", label: "No channel" },
      { value: "staging", label: "staging" },
      { value: "founders", label: "founders" },
      { value: "bounties", label: "bounties" },
      { value: "gaming", label: "gaming" },
    ],
    [],
  );

  const [result, setResult] = useState<ComposeCast.Result>();
  const [error, setError] = useState<string | null>(null);
  const [channelKey, setChannelKey] = useState<string | undefined>(undefined);

  const handleChannelChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setChannelKey(value ? value : undefined);
  }, []);

  const compose = useCallback(async () => {
    setError(null);
    setResult(undefined);
    try {
      const result = await sdk.actions.composeCast({
        text: "Hello from Demo Mini App",
        embeds: ["https://test.com/foo%20bar"],
        channelKey,
      });
      setResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred while composing cast');
    }
  }, [channelKey]);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Label
          className="text-xs font-semibold text-gray-500 dark:text-gray-300 mb-1"
          htmlFor="compose-channel-select"
        >
          Select channel
        </Label>
        <select
          id="compose-channel-select"
          value={channelKey ?? ""}
          onChange={handleChannelChange}
          className="w-full p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded"
        >
          {channelOptions.map((option) => (
            <option key={option.value || "none"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Button
        onClick={compose}
      >
        Compose Cast
      </Button>
      {error && (
        <div className="mt-2 text-xs text-red-500 dark:text-red-400">
          {error}
        </div>
      )}
      {result && (
        <div className="mt-2 text-xs">
          <div>Cast Hash: {result.cast?.hash}</div>
        </div>
      )}
    </div>
  );
}

function SignEthMessage() {
  const { isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const {
    signMessage,
    data: signature,
    error: signError,
    isError: isSignError,
    isPending: isSignPending,
  } = useSignMessage();

  const handleSignMessage = useCallback(async () => {
    if (!isConnected) {
      await connectAsync({
        chainId: base.id,
        connector: config.connectors[0],
      });
    }

    signMessage({ message: "Hello from Frames v2!" });
  }, [connectAsync, isConnected, signMessage]);

  return (
    <>
      <Button
        onClick={handleSignMessage}
        disabled={isSignPending}
        isLoading={isSignPending}
      >
        Sign Message
      </Button>
      {isSignError && renderError(signError)}
      {signature && (
        <div className="mt-2 text-xs">
          <div>Signature: {signature}</div>
        </div>
      )}
    </>
  );
}

function SendEth() {
  const { isConnected, chainId } = useAccount();
  const {
    sendTransaction,
    data,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: data,
    });

  const toAddr = useMemo(() => {
    // Protocol guild address
    return chainId === base.id
      ? "0x32e3C7fD24e175701A35c224f2238d18439C7dBC"
      : "0xB3d8d7887693a9852734b4D25e9C0Bb35Ba8a830";
  }, [chainId]);

  const handleSend = useCallback(() => {
    sendTransaction({
      to: toAddr,
      value: 1n,
    });
  }, [toAddr, sendTransaction]);

  return (
    <>
      <Button
        onClick={handleSend}
        disabled={!isConnected || isSendTxPending}
        isLoading={isSendTxPending}
      >
        Send Transaction (eth)
      </Button>
      {isSendTxError && renderError(sendTxError)}
      {data && (
        <div className="mt-2 text-xs">
          <div>Hash: {truncateAddress(data)}</div>
          <div>
            Status:{" "}
            {isConfirming
              ? "Confirming..."
              : isConfirmed
                ? "Confirmed!"
                : "Pending"}
          </div>
        </div>
      )}
    </>
  );
}

function SignSolanaMessage() {
  const [signature, setSignature] = useState<string | undefined>();
  const [signError, setSignError] = useState<Error | undefined>();
  const [signPending, setSignPending] = useState(false);

  const { signMessage } = useSolanaWallet();
  const handleSignMessage = useCallback(async () => {
    setSignPending(true);
    try {
      if (!signMessage) {
        throw new Error('no Solana signMessage');
      }
      const input = Buffer.from("Hello from Frames v2!", "utf8");
      const signatureBytes = await signMessage(input);
      const signature = Buffer.from(signatureBytes).toString("base64");
      setSignature(signature);
      setSignError(undefined);
    } catch (e) {
      if (e instanceof Error) {
        setSignError(e);
      }
      throw e;
    } finally {
      setSignPending(false);
    }
  }, [signMessage]);

  return (
    <>
      <Button
        onClick={handleSignMessage}
        disabled={signPending}
        isLoading={signPending}
      >
        Sign Message
      </Button>
      {signError && renderError(signError)}
      {signature && (
        <div className="mt-2 text-xs">
          <div>Signature: {signature}</div>
        </div>
      )}
    </>
  );
}

// I am collecting lamports to buy a boat
const ashoatsPhantomSolanaWallet =
  'Ao3gLNZAsbrmnusWVqQCPMrcqNi6jdYgu8T6NCoXXQu1';

function SendTokenSolana() {
  const [state, setState] = useState<
    | { status: 'none' }
    | { status: 'pending' }
    | { status: 'error'; error: Error }
    | { status: 'success'; signature: string; type: 'send' | 'approve' }
  >({ status: 'none' });

  const [selectedSymbol, setSelectedSymbol] = useState(''); // Initialize with empty string
  const [associatedMapping, setAssociatedMapping] = useState<{ token: string, decimals: number } | undefined>(undefined);

  const { publicKey, sendTransaction } = useSolanaWallet();
  const solanaAddress = publicKey?.toBase58();

  const [destinationAddress, setDestinationAddress] = useState(solanaAddress ?? '');
  const [simulation, setSimulation] = useState('');
  const [useVersionedTransaction, setUseVersionedTransaction] = useState(false);

  const tokenOptions = [
    { label: 'Select a token', value: '', disabled: true }, // Added a disabled default option
    { label: 'USDC', value: 'USDC' },
    { label: 'Tether', value: 'Tether' },
    { label: 'Bonk', value: 'Bonk' },
    { label: 'GOGS', value: 'GOGS' },
  ];

  const handleValueChange = (value: string) => {
    setSelectedSymbol(value);
    setState({ status: 'none' }); // Reset status when token changes
    if (!value) {
      setAssociatedMapping(undefined);
      return;
    }

    let valueToSet = '';
    let decimalsToSet = 0;
    switch (value) {
      case 'USDC':
        valueToSet = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC Mint address
        decimalsToSet = 6;
        break;
      case 'Tether':
        valueToSet = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
        decimalsToSet = 6;
        break;
      case 'Bonk':
        valueToSet = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
        decimalsToSet = 5;
        break;
      case 'GOGS':
        valueToSet = 'HxptKywiNbHobJD4XMMBn1czMUGkdMrUkeUErQLKbonk'
        decimalsToSet = 6;
        break;
      default:
        // It's better to handle this case gracefully, e.g., by clearing the mapping
        // or simply not setting it if the value is unexpected (though the select should prevent this)
        console.error('Invalid symbol selected:', value);
        setAssociatedMapping(undefined);
        return;
    }
    setAssociatedMapping({
      token: valueToSet,
      decimals: decimalsToSet,
    });
  };

  const { connection: solanaConnection } = useSolanaConnection();

  const handleApprove = useCallback(async () => {
    if (!publicKey) {
      throw new Error('no Solana publicKey');
    }

    if (!selectedSymbol || !associatedMapping) {
      setState({ status: 'error', error: new Error('Please select a token to approve.') });
      return;
    }

    if (!destinationAddress) {
      setState({ status: 'error', error: new Error('Please enter a destination address.') });
      return;
    }

    setState({ status: 'pending' });
    try {
      const { blockhash } = await solanaConnection.getLatestBlockhash();
      if (!blockhash) {
        throw new Error('Failed to fetch the latest Solana blockhash.');
      }

      const transaction = new SolanaTransaction();

      const tokenMintPublicKey = new SolanaPublicKey(associatedMapping.token);
      const spenderPublicKey = new SolanaPublicKey(destinationAddress);

      // Calculate the amount to approve: 1000 tokens in smallest units
      const amountToApprove = 1000;
      const amountInSmallestUnit = BigInt(Math.round(amountToApprove * Math.pow(10, associatedMapping.decimals)));

      if (amountInSmallestUnit <= 0) {
        throw new Error("Calculated token amount to approve is zero or less. Check decimals and amount.");
      }

      // Get the owner's ATA for the token
      const ownerAta = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        publicKey,
      );

      // Add the approve instruction
      transaction.add(
        createApproveInstruction(
          ownerAta,             // Token account to approve from
          spenderPublicKey,     // Account authorized to transfer tokens
          publicKey,            // Owner of the token account
          amountInSmallestUnit  // Amount to approve in smallest units
        )
      );

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new SolanaPublicKey(publicKey);

      let finalTransaction: SolanaTransaction | VersionedTransaction = transaction;

      if (useVersionedTransaction) {
        // Create a v0 compatible message
        const messageV0 = new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: blockhash,
          instructions: transaction.instructions,
        }).compileToV0Message();

        // Create a new VersionedTransaction
        finalTransaction = new VersionedTransaction(messageV0);
        console.log('Created versioned transaction for approval');
      }

      console.log('Simulating approval transaction:', finalTransaction);
      const signature = await sendTransaction(
        finalTransaction,
        solanaConnection,
      );
      setState({ status: 'success', signature, type: 'approve' });
      console.log('Approval transaction successful, signature:', signature);

    } catch (e) {
      console.error("Approval transaction failed:", e);
      if (e instanceof Error) {
        setState({ status: 'error', error: e });
      } else {
        setState({ status: 'error', error: new Error(String(e)) });
      }
    }
  }, [
    publicKey,
    sendTransaction,
    selectedSymbol,
    associatedMapping,
    destinationAddress,
    useVersionedTransaction,
    solanaConnection,
  ])

  const handleSend = useCallback(async () => {
    if (!publicKey) {
      throw new Error('no Solana publicKey');
    }

    if (!selectedSymbol || !associatedMapping) {
      setState({ status: 'error', error: new Error('Please select a token to send.') });
      return;
    }

    setState({ status: 'pending' });
    try {
      const { blockhash } = await solanaConnection.getLatestBlockhash();
      if (!blockhash) {
        throw new Error('Failed to fetch the latest Solana blockhash.');
      }

      const transaction = new SolanaTransaction();

      const tokenMintPublicKey = new SolanaPublicKey(associatedMapping.token);
      const recipientPublicKey = new SolanaPublicKey(destinationAddress);

      // Calculate the amount in the smallest unit of the token
      // Sending 0.1 of the token
      const amountToSend = 0.1;
      const amountInSmallestUnit = BigInt(Math.round(amountToSend * Math.pow(10, associatedMapping.decimals)));

      if (amountInSmallestUnit <= 0) {
        throw new Error("Calculated token amount to send is zero or less. Check decimals and amount.");
      }

      // 1. Get the sender's ATA for the token
      const fromAta = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        publicKey,
      );

      // 2. Get the recipient's ATA for the token
      const toAta = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        recipientPublicKey,
      );

      // 3. Check if the recipient's ATA exists. If not, add an instruction to create it.
      const toAtaAccountInfo = await solanaConnection.getAccountInfo(toAta);
      if (!toAtaAccountInfo) {
        console.log(`Recipient's Associated Token Account (${toAta.toBase58()}) for ${selectedSymbol} does not exist. Creating it.`);
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            toAta,
            recipientPublicKey,
            tokenMintPublicKey
            // TOKEN_PROGRAM_ID and ASSOCIATED_TOKEN_PROGRAM_ID are often defaulted by the library
          )
        );
      }

      // 4. Add the token transfer instruction
      transaction.add(
        createTransferCheckedInstruction(
          fromAta,                // Source_associated_token_account
          tokenMintPublicKey,     // Token mint_address
          toAta,                  // Destination_associated_token_account
          publicKey,              // Wallet address of the owner of the source account
          amountInSmallestUnit,   // Amount, in smallest units (e.g., lamports for SOL, or smallest unit for the token)
          associatedMapping.decimals // Decimals of the token (for validation)
          // [],                  // Optional: multiSigners
          // TOKEN_PROGRAM_ID     // Optional: SPL Token program ID, defaults correctly in recent library versions
        )
      );

      // This is a SOL transfer, not a token transfer.
      // To send SPL tokens, you'd use Token.createTransferInstruction from @solana/spl-token
      // and need the sender's token account address and the recipient's token account address.
      // The current code sends 0.000000001 SOL (1 lamport).
      // If you intend to send SPL tokens (USDC, $TRUMP), this part needs to be changed significantly.

      // For now, I'll keep the SOL transfer as in your original code,
      // but highlight that this doesn't use the selected `associatedMapping` for token details.
      // To send the selected token, you would use associatedMapping.token (mint address)
      // and associatedMapping.decimals.
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new SolanaPublicKey(publicKey);

      let finalTransaction: SolanaTransaction | VersionedTransaction = transaction;

      if (useVersionedTransaction) {
        // Create a v0 compatible message
        const messageV0 = new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: blockhash,
          instructions: transaction.instructions,
        }).compileToV0Message();

        // Create a new VersionedTransaction
        finalTransaction = new VersionedTransaction(messageV0);
        console.log('Created versioned transaction');
      }

      console.log('Simulating transaction:', finalTransaction);
      const simulation = await solanaConnection.simulateTransaction(
        finalTransaction as VersionedTransaction
      );
      setSimulation(JSON.stringify(simulation.value));

      const signature = await sendTransaction(
        finalTransaction,
        solanaConnection,
      );
      setState({ status: 'success', signature, type: 'send' });
      console.log('Transaction successful, signature:', signature);

    } catch (e) {
      console.error("Transaction failed:", e);
      if (e instanceof Error) {
        setState({ status: 'error', error: e });
      } else {
        // Handle cases where e is not an Error instance (e.g., string or object)
        setState({ status: 'error', error: new Error(String(e)) });
      }
      // Removed `throw e;` as it might cause unhandled promise rejection if not caught upstream.
      // The state update is usually sufficient for UI feedback.
    }
  }, [
    publicKey,
    sendTransaction,
    selectedSymbol,
    associatedMapping,
    destinationAddress,
    useVersionedTransaction,
    solanaConnection,
  ]);

  return (
    <div className="p-4 max-w-md mx-auto space-y-4"> {/* Added some basic styling for layout */}
      <h2 className="text-xl font-semibold">Send Solana Transaction</h2>

      <div>
        <label htmlFor="destination-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Destination Address
        </label>
        <input
          type="text"
          id="destination-address"
          value={destinationAddress}
          onChange={(e) => setDestinationAddress(e.target.value)}
          className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="use-versioned"
          checked={useVersionedTransaction}
          onChange={(e) => setUseVersionedTransaction(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-white dark:bg-gray-900"
        />
        <label htmlFor="use-versioned" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Use Versioned Transaction
        </label>
      </div>

      <div>
        <label htmlFor="token-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Select Token
        </label>
        <select
          value={selectedSymbol}
          onChange={(e) => handleValueChange(e.target.value)}
          className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          {tokenOptions.map(option => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSend}
          disabled={state.status === 'pending' || !selectedSymbol} // Disable if no token selected or pending
          isLoading={state.status === 'pending'}
          className="flex-1" // Make button share width equally
        >
          Send Token {selectedSymbol ? `(0.1 ${selectedSymbol})` : ''}
        </Button>

        <Button
          onClick={handleApprove}
          disabled={state.status === 'pending' || !selectedSymbol} // Disable if no token selected or pending
          isLoading={state.status === 'pending'}
          className="flex-1" // Make button share width equally
        >
          Approve {selectedSymbol ? `(1000 ${selectedSymbol})` : ''}
        </Button>
      </div>

      {state.status === 'none' && !selectedSymbol && (
        <div className="mt-2 text-xs text-gray-500">Please select a token.</div>
      )}
      {state.status === 'error' && renderError(state.error)}
      {state.status === 'success' && (
        <div className="mt-2 text-xs p-2 bg-green-50 border border-green-200 rounded">
          <div className="font-semibold text-green-700">
            {state.type === 'approve' ? 'Approval' : 'Send'} Transaction Successful!
          </div>
          <div>Signature: <a href={`https://explorer.solana.com/tx/${state.signature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{truncateAddress(state.signature)}</a></div>
        </div>
      )}
      {simulation && (
        <div className="mt-2 text-xs p-2 bg-green-50 border border-green-200 rounded">
          <div className="font-semibold text-green-700">Simulation Result:</div>
          <div>{simulation}</div>
        </div>
      )}
    </div>
  );
}

function TestBatchOperation() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [capabilities, setCapabilities] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forceAtomic, setForceAtomic] = useState(false);
  const [isGettingCapabilities, setIsGettingCapabilities] = useState(false);
  const [isSendingCalls, setIsSendingCalls] = useState(false);
  const { switchChain } = useSwitchChain();

  const [batchCallId, setBatchCallId] = useState<string | null>(null);
  const [batchCallResult, setBatchCallResult] = useState<string | null>(null);

  // State for explicit USDC approve + MockTransfer.mockTransfer test (non-atomic)
  const [isSendingApproveTransfer, setIsSendingApproveTransfer] = useState(false);
  const [approveTransferId, setApproveTransferId] = useState<string | null>(null);
  const [approveTransferResult, setApproveTransferResult] = useState<string | null>(null);
  const [approveTransferError, setApproveTransferError] = useState<string | null>(null);

  const handleGetCapabilities = useCallback(async () => {
    if (!walletClient || !address) {
      setError('No wallet client or address');
      return;
    }
    
    setIsGettingCapabilities(true);
    setError(null);
    
    try {
      const capabilities = await walletClient.getCapabilities({
        account: address,
      });
      if (!capabilities) {
        setError('No capabilities found');
      } else {
        setCapabilities(JSON.stringify(capabilities, null, 2));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsGettingCapabilities(false);
    }
  }, [walletClient, address]);

  const handleSendCalls = useCallback(async () => {
    if (!walletClient || !address) {
      setError('No wallet client or address');
      return;
    }
    switchChain({ chainId: base.id });
    
    setIsSendingCalls(true);
    setError(null);
    setBatchCallId(null);
    setBatchCallResult(null);
    
    try {
      const { id } = await walletClient.sendCalls({ 
        account: address,
        forceAtomic,
        chain: base,
        calls: [
          {
            to: '0x729170d38dd5449604f35f349fdfcc9ad08257cd',
            value: parseEther('0.00002')
          },
          {
            to: '0xf4319842934025823b461db1fa545d144833e84e',
            value: parseEther('0.00002')
          },
          {
            to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            value: parseEther('0'),
            data: '0xa9059cbb000000000000000000000000729170d38dd5449604f35f349fdfcc9ad08257cd0000000000000000000000000000000000000000000000000000000000002710'
          },
        ],
      });
      setBatchCallId(id);
      
      const result = await walletClient.waitForCallsStatus({
        id,
        pollingInterval: 200,
      });
      console.log('result', result);
      setBatchCallResult(safeJsonStringify(result));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsSendingCalls(false);
    }
  }, [walletClient, address, forceAtomic, switchChain]);

  const handleSendCallsApproveAndTransfer = useCallback(async () => {
    if (!walletClient || !address) {
      setApproveTransferError('No wallet client or address');
      return;
    }
    // Ensure we are on Base for this test
    switchChain({ chainId: base.id });

    setIsSendingApproveTransfer(true);
    setApproveTransferError(null);
    setApproveTransferId(null);
    setApproveTransferResult(null);

    try {
      const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      const MOCK_TRANSFER = '0xDC5A772d22558524cbBbfa8Ba6E83b5BebE45783';
      const TEN_CENTS_USDC = 100_000n; // 0.10 USDC with 6 decimals

      const approveData = encodeFunctionData({
        abi: parseAbi(['function approve(address spender, uint256 value) returns (bool)']),
        functionName: 'approve',
        args: [MOCK_TRANSFER, TEN_CENTS_USDC],
      });

      const mockTransferData = encodeFunctionData({
        abi: parseAbi(['function mockTransfer(uint256 amount)']),
        functionName: 'mockTransfer',
        args: [TEN_CENTS_USDC],
      });

      const { id } = await walletClient.sendCalls({
        account: address,
        chain: base,
        // Explicitly non-atomic per request
        forceAtomic: false,
        calls: [
          { to: BASE_USDC, value: 0n, data: approveData },
          { to: MOCK_TRANSFER, value: 0n, data: mockTransferData },
        ],
      });

      setApproveTransferId(id);

      const result = await walletClient.waitForCallsStatus({
        id,
        pollingInterval: 200,
      });
      setApproveTransferResult(safeJsonStringify(result));
    } catch (e) {
      setApproveTransferError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsSendingApproveTransfer(false);
    }
  }, [walletClient, address, switchChain]);

  return (
    <>
      <div className="mb-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
          <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
            wallet.getCapabilities / wallet.sendCalls
          </pre>
        </div>
        
        <div className="mb-4">
          <Button 
            onClick={handleGetCapabilities}
            disabled={!isConnected || isGettingCapabilities}
            isLoading={isGettingCapabilities}
          >
            Get Capabilities
          </Button>
          
          {capabilities && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="font-semibold text-gray-500 dark:text-gray-300 mb-1">Capabilities</div>
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                {capabilities}
              </pre>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="force-atomic"
              checked={forceAtomic}
              onChange={(e) => setForceAtomic(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="force-atomic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Force Atomic
            </label>
          </div>
          
          <Button 
            onClick={handleSendCalls}
            disabled={!isConnected || isSendingCalls}
            isLoading={isSendingCalls}
          >
            Send Batch Calls
          </Button>
        </div>

        <div className="mb-4">
          <Button
            onClick={handleSendCallsApproveAndTransfer}
            disabled={!isConnected || isSendingApproveTransfer}
            isLoading={isSendingApproveTransfer}
          >
            SendCalls: Approve 10c USDC + mockTransfer (This will take 10c in USDC, use at your own discression)
          </Button>
        </div>

        {batchCallId && (
          <div className="mb-2 text-xs">
            Batch Call ID: {batchCallId}
          </div>
        )}

        {batchCallResult && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="font-semibold text-gray-500 dark:text-gray-300 mb-1">Batch Call Result</div>
            <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
              {batchCallResult}
            </pre>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-xs mt-1">{error}</div>
        )}

        {approveTransferId && (
          <div className="mb-2 text-xs">
            Approve + Transfer ID: {approveTransferId}
          </div>
        )}

        {approveTransferResult && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="font-semibold text-gray-500 dark:text-gray-300 mb-1">Approve + Transfer Result</div>
            <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
              {approveTransferResult}
            </pre>
          </div>
        )}

        {approveTransferError && (
          <div className="text-red-500 text-xs mt-1">{approveTransferError}</div>
        )}
      </div>
    </>
  );
}

function SendSolana() {
  const [state, setState] = useState<
    | { status: 'none' }
    | { status: 'pending' }
    | { status: 'error'; error: Error }
    | { status: 'success'; signature: string }
  >({ status: 'none' });

  const { connection: solanaConnection } = useSolanaConnection();
  const { sendTransaction, publicKey } = useSolanaWallet();

  const handleSend = useCallback(async () => {
    setState({ status: 'pending' });
    try {
      if (!publicKey) {
        throw new Error('no Solana publicKey');
      }

      const { blockhash } = await solanaConnection.getLatestBlockhash();
      if (!blockhash) {
        throw new Error('failed to fetch latest Solana blockhash');
      }

      const transaction = new SolanaTransaction();
      transaction.add(
        SolanaSystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new SolanaPublicKey(ashoatsPhantomSolanaWallet),
          lamports: 1n,
        }),
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const simulation =
        await solanaConnection.simulateTransaction(transaction);
      if (simulation.value.err) {
        throw new Error('Simulation failed');
      }

      const signature = await sendTransaction(transaction, solanaConnection);
      setState({ status: 'success', signature });
    } catch (e) {
      if (e instanceof Error) {
        setState({ status: 'error', error: e });
      } else {
        setState({ status: 'none' });
      }
      throw e;
    }
  }, [sendTransaction, publicKey, solanaConnection]);

  return (
    <>
      <Button
        onClick={handleSend}
        disabled={state.status === 'pending'}
        isLoading={state.status === 'pending'}
      >
        Send Transaction
      </Button>
      {state.status === 'error' && renderError(state.error)}
      {state.status === 'success' && (
        <div className="mt-2 text-xs">
          <div>Hash: {truncateAddress(state.signature)}</div>
        </div>
      )}
    </>
  );
}

function QuickAuth({ setToken, token }: { setToken: (token: string | null) => void; token: string | null; }) {
  const [signingIn, setSigningIn] = useState(false);
  const [signInFailure, setSignInFailure] = useState<string>();

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      setSignInFailure(undefined);

      const { token } = await sdk.experimental.quickAuth();

      setToken(token);

      // Demonstrate hitting an authed endpoint
      const response = await fetch('/api/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return;
    } catch (e) {
      if (e instanceof SignInCore.RejectedByUser) {
        setSignInFailure("Rejected by user");
        return;
      }

      setSignInFailure("Unknown error");
    } finally {
      setSigningIn(false);
    }
  }, [setToken]);

  const handleSignOut = useCallback(async () => {
    setToken(null)
  }, [setToken]);

  return (
    <>
      {status !== "authenticated" && (
        <Button onClick={handleSignIn} disabled={signingIn}>
          Sign In
        </Button>
      )}
      {status === "authenticated" && (
        <Button onClick={handleSignOut}>
          Sign out
        </Button>
      )}
      {token && (
        <>
          <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 dark:bg-gray-800 rounded-lg font-mono">
            <div className="font-semibold text-gray-500 dark:text-gray-300 mb-1">Raw JWT</div>
            <div className="whitespace-pre">
              {token}
            </div>
          </div>
          <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 dark:bg-gray-800 rounded-lg font-mono">
            <div className="font-semibold text-gray-500 dark:text-gray-300 mb-1">Decoded JWT</div>
            <div className="whitespace-pre">
              {JSON.stringify(jwtDecode(token), undefined, 2)}
            </div>
          </div>
        </>
      )}
      {signInFailure && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 dark:bg-gray-800 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 dark:text-gray-300 mb-1">SIWF Result</div>
          <div className="whitespace-pre">{signInFailure}</div>
        </div>
      )}
    </>
  );
}

function SignManifest() {
  const [domain, setDomain] = useState('www.microsoft.com')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<unknown>(null)

  const handleSignManifest = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const manifest = await sdk.experimental.signManifest({ domain })
      setResult(manifest)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label
          className="text-xs font-semibold text-gray-500 dark:text-gray-300 mb-1"
          htmlFor="domain-input"
        >
          Domain
        </Label>
        <Input
          id="domain-input"
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full mb-2"
          placeholder="Enter domain (e.g., http://www.microsoft.com)"
        />
      </div>

      <Button
        onClick={handleSignManifest}
        disabled={loading || !domain}
        isLoading={loading}
      >
        {loading ? 'Signing...' : 'Sign Manifest'}
      </Button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 font-medium">Error:</p>
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {result !== null && result !== undefined && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <p className="font-medium mb-2">Signed Manifest:</p>
          <pre className="bg-white p-3 rounded border border-gray-300 overflow-x-auto">
            {safeJsonStringify(result)}
          </pre>
        </div>
      )}
    </div>
  )
}

function ViewProfile() {
  const [fid, setFid] = useState("3");

  return (
    <>
      <div>
        <Label
          className="text-xs font-semibold text-gray-500 dark:text-gray-300 mb-1"
          htmlFor="view-profile-fid"
        >
          Fid
        </Label>
        <Input
          id="view-profile-fid"
          type="number"
          value={fid}
          className="mb-2"
          onChange={(e) => {
            setFid(e.target.value);
          }}
          step="1"
          min="1"
        />
      </div>
      <Button
        onClick={() => {
          sdk.actions.viewProfile({ fid: parseInt(fid) });
        }}
      >
        View Profile
      </Button>
    </>
  );
}

function OpenMiniApp() {
  const [selectedUrl, setSelectedUrl] = useState("");
  const [openResult, setOpenResult] = useState<string>("");
  const [isOpening, setIsOpening] = useState(false);

  const urlOptions = [
    { label: "Select a URL", value: "", disabled: true },
    { 
      label: "Bountycaster (Embed)", 
      value: "https://www.bountycaster.xyz/bounty/0x392626b092e05955c11c41c5df8e2fb8003ece78" 
    },
    { 
      label: "Eggs (Launcher)", 
      value: "https://farcaster.xyz/miniapps/Qqjy9efZ-1Qu/eggs" 
    },
    { 
      label: "Invalid URL", 
      value: "https://swizec.com/" 
    },
  ];

  const handleOpenMiniApp = useCallback(async () => {
    if (!selectedUrl) {
      setOpenResult("Please select a URL");
      return;
    }

    setIsOpening(true);
    setOpenResult("");

    try {
      await sdk.actions.openMiniApp({url: selectedUrl});
      setOpenResult("Mini app opened successfully");
    } catch (error) {
      setOpenResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsOpening(false);
    }
  }, [selectedUrl]);

  return (
    <>
      <div>
        <Label
          className="text-xs font-semibold text-gray-500 dark:text-gray-300 mb-1"
          htmlFor="mini-app-select"
        >
          Select Mini App URL
        </Label>
        <select
          id="mini-app-select"
          value={selectedUrl}
          onChange={(e) => setSelectedUrl(e.target.value)}
          className="w-full mb-2 p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded"
        >
          {urlOptions.map(option => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Button
        onClick={handleOpenMiniApp}
        disabled={!selectedUrl || isOpening}
        isLoading={isOpening}
      >
        Open Mini App
      </Button>
      {openResult && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {openResult}
        </div>
      )}
    </>
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
