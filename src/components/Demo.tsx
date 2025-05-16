"use client";

import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction } from "@solana/spl-token";
import {
  Connection as SolanaConnection,
  PublicKey as SolanaPublicKey,
  SystemProgram as SolanaSystemProgram,
  Transaction as SolanaTransaction,
} from "@solana/web3.js";
import { useEffect, useCallback, useState, useMemo } from "react";
import { Input } from "../components/ui/input";
import { signIn, signOut, getCsrfToken } from "next-auth/react";
import sdk, {
  AddMiniApp,
  ComposeCast,
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
} from "wagmi";

import { config } from "~/components/providers/WagmiProvider";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, degen, mainnet, optimism, unichain } from "wagmi/chains";
import { BaseError, UserRejectedRequestError } from "viem";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";

export default function Demo(
  { title }: { title?: string } = { title: "Frames v2 Demo" }
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [added, setAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] =
    useState<FrameNotificationDetails | null>(null);

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

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setLastEvent(
          `frameAdded${!!notificationDetails ? ", notifications enabled" : ""}`
        );

        setAdded(true);
        if (notificationDetails) {
          setNotificationDetails(notificationDetails);
        }
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        setLastEvent(`frameAddRejected, reason ${reason}`);
      });

      sdk.on("frameRemoved", () => {
        setLastEvent("frameRemoved");
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

  const { getSolanaProvider } = sdk.experimental;
  const [solanaAddress, setSolanaAddress] = useState("");
  useEffect(() => {
    (async () => {
      const solanaProvider = await getSolanaProvider();
      if (!solanaProvider) {
        return;
      }
      const result = await solanaProvider.request({
        method: 'connect',
      });
      setSolanaAddress(result?.publicKey.toString());
    })();
  }, [getSolanaProvider]);

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
              className={`transform transition-transform ${
                isContextOpen ? "rotate-90" : ""
              }`}
            >
              ➤
            </span>
            Tap to expand
          </button>

          {isContextOpen && (
            <div className="p-4 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                {JSON.stringify(context, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-2xl font-bold">Actions</h2>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.signIn
              </pre>
            </div>
            <SignIn />
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
  const [result, setResult] = useState<ComposeCast.Result>();
  const compose = useCallback(async () => {
    setResult(await sdk.actions.composeCast({
      text: 'Hello from Demo Mini App',
      embeds: ["https://test.com/foo%20bar"],
    }))
  }, []);

  return (
    <>
      <Button
        onClick={compose}
      >
        Compose Cast
      </Button>
      {result && (
        <div className="mt-2 text-xs">
          <div>Cast Hash: {result.cast.hash}</div>
        </div>
      )}
    </>
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

  const { getSolanaProvider } = sdk.experimental;
  const handleSignMessage = useCallback(async () => {
    setSignPending(true);
    try {
      const solanaProvider = await getSolanaProvider();
      if (!solanaProvider) {
        throw new Error('no Solana provider');
      }
      const result = await solanaProvider.signMessage("Hello from Frames v2!");
      setSignature(result.signature);
      setSignError(undefined);
    } catch (e) {
      if (e instanceof Error) {
        setSignError(e);
      }
      throw e;
    } finally {
      setSignPending(false);
    }
  }, []);

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

const solanaConnection = new SolanaConnection(
  // This is a free RPC without credit card linked, steal at your own will
  'https://mainnet.helius-rpc.com/?api-key=63185c9d-1a75-492a-ba9c-2dbac8e9434d',
  'confirmed',
);

function SendTokenSolana() {
  const [state, setState] = useState<
    | { status: 'none' }
    | { status: 'pending' }
    | { status: 'error'; error: Error }
    | { status: 'success'; signature: string }
  >({ status: 'none' });

  const [selectedSymbol, setSelectedSymbol] = useState(''); // Initialize with empty string
  const [associatedMapping, setAssociatedMapping] = useState<{token: string, decimals: number} | undefined>(undefined);

  const [destinationAddress, setDestinationAddress] = useState('');
  const [simulation, setSimulation] = useState('');

  const setCurrentAddress = useCallback(async () => {
    const solanaProvider = await getSolanaProvider();
    if (!solanaProvider) {
      throw new Error('No Solana provider found. Make sure your wallet is connected and configured.');
    }

    // The connect method is often called when the app loads or when the user explicitly connects their wallet.
      // It might not be needed right before every transaction if the wallet is already connected.
      // However, calling it here ensures we have the public key.
      const connectResult = await solanaProvider.request({
        method: 'connect',
        // params: [{ onlyIfTrusted: true }] // Optional: attempt to connect without a popup if already trusted
      });
      setDestinationAddress(connectResult?.publicKey);
  }, [])

  useEffect(() => {
    setCurrentAddress();
  }, [setCurrentAddress])

  const tokenOptions = [
    { label: 'Select a token', value: '', disabled: true }, // Added a disabled default option
    { label: 'USDC', value: 'USDC' },
    { label: '$TRUMP', value: '$TRUMP' },
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
      case '$TRUMP':
        valueToSet = '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'; // $TRUMP Mint address (example)
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


  const { getSolanaProvider } = sdk.experimental;

  const handleSend = useCallback(async () => {
    if (!selectedSymbol || !associatedMapping) {
      setState({ status: 'error', error: new Error('Please select a token to send.') });
      return;
    }

    setState({ status: 'pending' });
    try {
      const solanaProvider = await getSolanaProvider();
      if (!solanaProvider) {
        throw new Error('No Solana provider found. Make sure your wallet is connected and configured.');
      }

      // The connect method is often called when the app loads or when the user explicitly connects their wallet.
      // It might not be needed right before every transaction if the wallet is already connected.
      // However, calling it here ensures we have the public key.
      const connectResult = await solanaProvider.request({
        method: 'connect',
        // params: [{ onlyIfTrusted: true }] // Optional: attempt to connect without a popup if already trusted
      });

      const warpletPublicKey = new SolanaPublicKey(connectResult?.publicKey);
      // Type guard to ensure connectResult is not null and has a publicKey
      if (!connectResult || typeof connectResult !== 'object' || !('publicKey' in connectResult) || !connectResult.publicKey) {
        throw new Error('Failed to connect to Solana wallet or fetch public key.');
      }
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
        warpletPublicKey
      );

      // 2. Get the recipient's ATA for the token
      const toAta = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        recipientPublicKey
      );

      // 3. Check if the recipient's ATA exists. If not, add an instruction to create it.
      const toAtaAccountInfo = await solanaConnection.getAccountInfo(toAta);
      if (!toAtaAccountInfo) {
        console.log(`Recipient's Associated Token Account (${toAta.toBase58()}) for ${selectedSymbol} does not exist. Creating it.`);
        transaction.add(
          createAssociatedTokenAccountInstruction(
            warpletPublicKey,
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
          warpletPublicKey,     // Wallet address of the owner of the source account
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
      transaction.feePayer = new SolanaPublicKey(warpletPublicKey);

      console.log('Simulating transaction:', transaction);
      const simulation = await solanaConnection.simulateTransaction(transaction);
      // if (simulation.value.err) {
      //   console.error('Simulation error details:', simulation.value.logs);
      //   throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
      // }
      setSimulation(JSON.stringify(simulation.value));

      // The provider's signAndSendTransaction method might take the transaction directly
      // or might require it to be serialized. Check your provider's documentation.
      // For Phantom, typically you pass the Transaction object.
      const { signature } = await solanaProvider.signAndSendTransaction({
        transaction, // Pass the SolanaTransaction object
        // requestPayer: ourSolanaAddress, // some providers might need this
        // network: 'devnet', // some providers might need this
      });
      setState({ status: 'success', signature });
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
  }, [getSolanaProvider, selectedSymbol, associatedMapping, solanaConnection, destinationAddress]); // Added solanaConnection

  return (
    <div className="p-4 max-w-md mx-auto space-y-4"> {/* Added some basic styling for layout */}
      <h2 className="text-xl font-semibold">Send Solana Transaction</h2>

      <div>
        <label htmlFor="destination-address" className="block text-sm font-medium text-gray-700 mb-1">
          Destination Address
        </label>
        <input
          type="text"
          id="destination-address"
          value={destinationAddress}
          onChange={(e) => setDestinationAddress(e.target.value)}
          className="w-full" // Ensure input takes full width of its container
        />
      </div>

      <div>
        <label htmlFor="token-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Token
        </label>
        <select
          value={selectedSymbol}
          onChange={(e) => handleValueChange(e.target.value)}
          className="w-full" // Ensure select takes full width of its container
        >
          {tokenOptions.map(option => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={handleSend}
        disabled={state.status === 'pending' || !selectedSymbol} // Disable if no token selected or pending
        isLoading={state.status === 'pending'}
        className="w-full" // Make button full width
      >
        Send Token {selectedSymbol ? `(0.1 ${selectedSymbol})` : ''}
      </Button>

      {state.status === 'none' && !selectedSymbol && (
        <div className="mt-2 text-xs text-gray-500">Please select a token.</div>
      )}
      {state.status === 'error' && renderError(state.error)}
      {state.status === 'success' && (
        <div className="mt-2 text-xs p-2 bg-green-50 border border-green-200 rounded">
          <div className="font-semibold text-green-700">Transaction Successful!</div>
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

function SendSolana() {
  const [state, setState] = useState<
    | { status: 'none' }
    | { status: 'pending' }
    | { status: 'error'; error: Error }
    | { status: 'success'; signature: string }
  >({ status: 'none' });

  const { getSolanaProvider } = sdk.experimental;
  const handleSend = useCallback(async () => {
    setState({ status: 'pending' });
    try {
      const solanaProvider = await getSolanaProvider();
      if (!solanaProvider) {
        throw new Error('no Solana provider');
      }

      const result = await solanaProvider.request({
        method: 'connect',
      });
      const ourSolanaAddress = result?.publicKey.toString();
      if (!ourSolanaAddress) {
        throw new Error('failed to fetch Solana address');
      }

      const { blockhash } = await solanaConnection.getLatestBlockhash();
      if (!blockhash) {
        throw new Error('failed to fetch latest Solana blockhash');
      }

      const transaction = new SolanaTransaction();
      transaction.add(
        SolanaSystemProgram.transfer({
          fromPubkey: new SolanaPublicKey(ourSolanaAddress),
          toPubkey: new SolanaPublicKey(ashoatsPhantomSolanaWallet),
          lamports: 1n,
        }),
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new SolanaPublicKey(ourSolanaAddress);

      const simulation =
        await solanaConnection.simulateTransaction(transaction);
      if (simulation.value.err) {
        throw new Error('Simulation failed');
      }

      const { signature } = await solanaProvider.signAndSendTransaction({
        transaction,
      });
      setState({ status: 'success', signature });
    } catch (e) {
      if (e instanceof Error) {
        setState({ status: 'error', error: e });
      } else {
        setState({ status: 'none' });
      }
      throw e;
    }
  }, [getSolanaProvider]);

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

function SignIn() {
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signInResult, setSignInResult] = useState<SignInCore.SignInResult>();
  const [signInFailure, setSignInFailure] = useState<string>();
  const { data: session, status } = useSession();

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      setSignInFailure(undefined);
      const nonce = await getNonce();
      const result = await sdk.actions.signIn({ nonce });
      setSignInResult(result);

      await signIn("credentials", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });
    } catch (e) {
      if (e instanceof SignInCore.RejectedByUser) {
        setSignInFailure("Rejected by user");
        return;
      }

      setSignInFailure("Unknown error");
    } finally {
      setSigningIn(false);
    }
  }, [getNonce]);

  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true);
      await signOut({ redirect: false });
      setSignInResult(undefined);
    } finally {
      setSigningOut(false);
    }
  }, []);

  return (
    <>
      {status !== "authenticated" && (
        <Button onClick={handleSignIn} disabled={signingIn}>
          Sign In with Farcaster
        </Button>
      )}
      {status === "authenticated" && (
        <Button onClick={handleSignOut} disabled={signingOut}>
          Sign out
        </Button>
      )}
      {session && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">Session</div>
          <div className="whitespace-pre">
            {JSON.stringify(session, null, 2)}
          </div>
        </div>
      )}
      {signInFailure && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">{signInFailure}</div>
        </div>
      )}
      {signInResult && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">
            {JSON.stringify(signInResult, null, 2)}
          </div>
        </div>
      )}
    </>
  );
}

function ViewProfile() {
  const [fid, setFid] = useState("3");

  return (
    <>
      <div>
        <Label
          className="text-xs font-semibold text-gray-500 mb-1"
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
