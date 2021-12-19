import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Button, Snackbar, Typography } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import bs58 from "bs58";
import * as anchor from "@project-serum/anchor";
import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz";

import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";
import Container from "@mui/material/Container";

import {
  awaitTransactionSignatureConfirmation,
  CandyMachine,
  getCandyMachineState,
  mintOneToken,
  shortenAddress,
} from "./candy-machine";
import axios from "axios";
// import title from "./text2.png";
import Cookies from "js-cookie";
import React from "react";
import { TextField } from "@mui/material";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
// import JsonRpc from "node-jsonrpc-client";
import {
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletExtensionWallet,
  getSolletWallet,
  Wallet,
  WalletName,
} from "@solana/wallet-adapter-wallets";
import { useLocalStorage } from "@solana/wallet-adapter-react/src/useLocalStorage";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { useNavigate } from "react-router-dom";
import { Simulate } from "react-dom/test-utils";
import * as https from "https";

const { JsonRpc } = require("node-jsonrpc-client");
// const bs58 = require('bs58');
// const {http, https} = require('follow-redirects');

axios.defaults.withCredentials = true;
const sleep = (m: any) => new Promise((r) => setTimeout(r, m));
const ConnectButton = styled(WalletDialogButton)``;

const MintContainer = styled(Container)``; // add your styles here

const MintButton = styled(Button)``; // add your styles here

export interface CustomCMProps {
  connection: anchor.web3.Connection;
}
const useStyles = makeStyles({
  root: {
    "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
      borderColor: "#48ff00",
      color: "white",
    },
    "& label.Mui-focused": {
      color: "#ffffff !important",
    },
    "& label": {
      color: "white",
    },
  },
});
const CustomCM = (props: CustomCMProps) => {
  const navigate = useNavigate();
  const classes = useStyles();
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });
  const MINUTE_MS = 300000;
  const recaptchaRef = useRef(null);

  const { publicKey, signMessage } = useWallet();
  const wallet = useAnchorWallet();
  const tokenList = getParsedNftAccountsByOwner({
    publicAddress: publicKey,
    connection: props.connection,
  });
  const [localStorageKey, setLocalStorageKey] = useState("walletName");
  const [logged, setLogged] = useState(true);
  const [captchaDone, setCaptchaDone] = useState(true);
  const [balance, setBalance] = useState<any>(0);

  const [intervalConsole, setIntervalConsole] = useState<any>(null);
  const [isActive, setIsActive] = useState(false); // true when countdown completes
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
  const [validated, setValidated] = useState(false); // true when user got to press MINT

  const [itemsAvailable, setItemsAvailable] = useState(0);
  const [itemsRedeemed, setItemsRedeemed] = useState(0);
  const [itemsRemaining, setItemsRemaining] = useState(0);

  const [reactCandyConfig, setReactCandyConfig] = useState<PublicKey>(
    new PublicKey("4AdL88Je5RbZEFiKDtMTBU1rNAxkcCwY4xcrHiTPSVrJ")
  );
  const [reactCandyConfigText, setReactCandyConfigText] = useState<string>("");

  const [reactCandyId, setReactCandyId] = useState<PublicKey>(
    new PublicKey("6sgSWSwrHembSWk8qrECpfjpQS1aNNxUuf58rCgLdUVG")
  );
  const [reactCandyIdText, setReactCandyIdText] = useState<string>("");

  const [reactTreasury, setReactTreasury] = useState<PublicKey>(
    new PublicKey("6fdwL6q16K2QUKuAg9JViYDGC43xxYWgoNngjnyM9Jbu")
  );
  const [reactTreasuryText, setReactTreasuryText] = useState<string>("");

  const [reactSolanaNetwork, setReactSolanaNetwork] =
    useState<WalletAdapterNetwork>("mainnet-beta" as WalletAdapterNetwork);
  const [reactSolanaNetworkText, setReactSolanaNetworkText] =
    useState<string>("mainnet-beta");

  const [reactSolanaRpc, setReactSolanaRpc] = useState<Connection>(
    new Connection("https://ssc-dao.genesysgo.net")
  );
  const [reactSolanaRpcText, setReactSolanaRpcText] = useState<String>(
    "https://ssc-dao.genesysgo.net"
  );

  const [consoleMsg, setConsoleMsg] = useState("Mint details here");
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();
  const [numberOfMint, setNumberOfMint] = useState<number>(1);

  const wallets = useMemo(
    () => [getPhantomWallet(), getSlopeWallet(), getSolflareWallet()],
    []
  );

  const refreshCandyMachineState = () => {
    (async () => {
      if (!wallet) return;
    })();
  };

  const getValues = async () => {};

  const onMint = async () => {
    //why are you respecting a buttom?
    try {
      setIsMinting(true);
      if (wallet && candyMachine?.program) {
        const mintTxId = await mintOneToken(
          candyMachine,
          reactCandyConfig,
          wallet.publicKey,
          reactTreasury
        );

        const status = await awaitTransactionSignatureConfirmation(
          mintTxId,
          30000,
          props.connection,
          "singleGossip",
          false
        );

        if (!status?.err) {
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
          });
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
      refreshCandyMachineState();
    }
  };

  const renderTitle = () => {
    return (
      <img
        src={
          "https://imgs.michaels.com/MAM/assets/1/726D45CA1C364650A39CD1B336F03305/img/59BE9100770C43F9BBCD0B62287C93F7/10218212_2.jpg?fit=inside|540:540"
        }
        alt={""}
        style={{ height: "100%", width: "100%", marginBottom: "150px" }}
      />
    );
  };

  useEffect(() => {
    if (wallet) {
      props.connection.getBalance(wallet.publicKey).then((value) => {
        console.log(value);
        setBalance(value / LAMPORTS_PER_SOL);
        refreshCandyMachineState();
      });
    }
    console.log(wallet);
  }, [wallet]);

  async function fetchBalance() {
    if (wallet) {
      const balanceLocal = await props.connection.getBalance(wallet.publicKey);
      setBalance(balanceLocal / LAMPORTS_PER_SOL);
      refreshCandyMachineState();
    }
  }
  fetchBalance();

  const requestSignMessage = async () => {
    try {
      let srlTokens: any[] = [];
      await tokenList.then((data) => {
        srlTokens.push(
          ...data.filter(
            (token) =>
              token?.updateAuthority ===
              "34AjXERmYgvtuH7i858XW26Cy7xu7HFjWTgXMMx7Ny6Y"
          )
        );
      });
      console.log(srlTokens);
      // if (srlTokens.length === 0)
      // throw new Error("Not a SRL holder!");
      if (!publicKey) throw new Error("Wallet not connected!");
      if (!signMessage)
        throw new Error("Wallet does not support message signing!");

      const message = new TextEncoder().encode(
        JSON.stringify("MARKER wallet verification")
      );
      const signature = await signMessage(message);
      const user = {
        tokens: srlTokens.map((t) => t.mint),
        wallet: publicKey.toString(),
        signatureMessage: {
          message: bs58.encode(message),
          encodedSignature: bs58.encode(signature),
          publicKey: bs58.encode(publicKey.toBytes()),
        },
      };
      //
      setAlertState({
        open: true,
        message: "Wallet Connected!",
        severity: "success",
      });
      return setLogged(true);
    } catch (error) {
      let message = "Verification " + error;
      setAlertState({
        open: true,
        message,
        severity: "error",
      });
      return setLogged(false);
    }
  };

  useEffect(() => {
    if (Cookies.get("connect.sid") != null) {
      setLogged(true);
    }

    async function fetchBalance() {
      if (wallet) {
        const balanceLocal = await props.connection.getBalance(
          wallet.publicKey
        );
        setBalance(balanceLocal / LAMPORTS_PER_SOL);
        refreshCandyMachineState();
      }
    }
    fetchBalance();
  }, []);

  return (
    <>
      <MintContainer>
        <div
          style={{
            width: "100%",
            margin: "auto 0",
            textAlign: "center",
            alignItems: "center",
          }}
        >
          {logged ? (
            <>
              {wallet && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: 20,
                  }}
                >
                  <div>
                    <h4>Wallet:</h4>{" "}
                    {shortenAddress(wallet.publicKey.toBase58() || "")}
                  </div>
                  <div>
                    <h4>Balance:</h4> {(balance || 0).toLocaleString()} SOL
                  </div>
                  <div>
                    <h4>Redeemed:</h4> {itemsRedeemed}
                  </div>
                  <div>
                    <h4>Remaining:</h4> {itemsRemaining}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginBottom: 20,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {!wallet && (
                  <div style={{ display: "flex" }}>
                    <div></div>
                  </div>
                )}

                <div
                  style={{
                    width: "50%",
                    marginBottom: "20px",
                    marginTop: "20px",
                  }}
                >
                  <TextField
                    sx={{ input: { color: "#48ff00", fontWeight: "600" } }}
                    className={classes.root}
                    value={reactCandyConfigText}
                    onChange={(event) => {
                      if (intervalConsole) {
                        clearInterval(intervalConsole);
                      }
                      setReactCandyConfigText(event.currentTarget.value);
                      try {
                        setReactCandyConfig(
                          new anchor.web3.PublicKey(event.currentTarget.value)
                        );
                      } catch (e) {}
                      setValidated(false);
                    }}
                    label="CANDY MACHINE CONFIG"
                    variant="outlined"
                    fullWidth
                  />
                </div>
                <div style={{ width: "50%", marginBottom: "20px" }}>
                  <TextField
                    sx={{ input: { color: "#48ff00", fontWeight: "600" } }}
                    className={classes.root}
                    value={reactCandyIdText}
                    onChange={(event) => {
                      if (intervalConsole) {
                        clearInterval(intervalConsole);
                      }
                      setReactCandyIdText(event.currentTarget.value);
                      try {
                        setReactCandyId(
                          new anchor.web3.PublicKey(event.currentTarget.value)
                        );
                      } catch (e) {}
                      setValidated(false);
                    }}
                    label="CANDY MACHINE ID"
                    variant="outlined"
                    fullWidth
                  />
                </div>
                <div style={{ width: "50%", marginBottom: "20px" }}>
                  <TextField
                    className={classes.root}
                    sx={{ input: { color: "#48ff00", fontWeight: "600" } }}
                    value={reactTreasuryText}
                    onChange={(event) => {
                      if (intervalConsole) {
                        clearInterval(intervalConsole);
                      }
                      setReactTreasuryText(event.currentTarget.value);
                      try {
                        setReactTreasury(
                          new anchor.web3.PublicKey(event.currentTarget.value)
                        );
                      } catch (e) {}
                      setValidated(false);
                    }}
                    label="TREASURE ADDRESS"
                    variant="outlined"
                    fullWidth
                  />
                </div>
                <div style={{ width: "50%", marginBottom: "20px" }}>
                  <TextField
                    sx={{ input: { color: "#ffffff", fontWeight: "600" } }}
                    className={classes.root}
                    value={reactSolanaNetworkText}
                    onChange={(event) => {
                      if (intervalConsole) {
                        clearInterval(intervalConsole);
                      }
                      setReactSolanaNetworkText(event.currentTarget.value);
                      setValidated(false);
                    }}
                    label="SOLANA NETWORK"
                    variant="outlined"
                    fullWidth
                  />
                </div>
                <div style={{ width: "50%", marginBottom: "20px" }}>
                  <TextField
                    sx={{ input: { color: "#ffffff", fontWeight: "600" } }}
                    className={classes.root}
                    value={reactSolanaRpcText}
                    onChange={(event) => {
                      if (intervalConsole) {
                        clearInterval(intervalConsole);
                      }
                      setReactSolanaRpc(
                        new anchor.web3.Connection(event.currentTarget.value)
                      );
                      setReactSolanaRpcText(event.currentTarget.value);
                    }}
                    label="SOLANA RPC HOST"
                    variant="outlined"
                    fullWidth
                  />
                </div>
              </div>
              {wallet && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-evenly",
                    marginBottom: 20,
                  }}
                >
                  <Button
                    variant={"contained"}
                    onClick={async () => {
                      let error = false;
                      if (intervalConsole) {
                        clearInterval(intervalConsole);
                      }
                      try {
                        setReactCandyConfig(
                          new anchor.web3.PublicKey(reactCandyConfigText)
                        );
                      } catch (e) {
                        setAlertState({
                          open: true,
                          message: "Field Candy config invalid",
                          severity: "error",
                        });
                        error = true;
                      }

                      try {
                        setReactCandyId(
                          new anchor.web3.PublicKey(reactCandyIdText)
                        );
                      } catch (e) {
                        setAlertState({
                          open: true,
                          message: "Field Candy id invalid",
                          severity: "error",
                        });
                        error = true;
                      }

                      try {
                        setReactTreasury(
                          new anchor.web3.PublicKey(reactTreasuryText)
                        );
                      } catch (e) {
                        setAlertState({
                          open: true,
                          message: "Field Treasury invalid",
                          severity: "error",
                        });
                        error = true;
                      }

                      if (error) {
                        return;
                      }

                      try {
                        const {
                          candyMachine,
                          goLiveDate,
                          itemsAvailable,
                          itemsRemaining,
                          itemsRedeemed,
                        } = await getCandyMachineState(
                          wallet as anchor.Wallet,
                          reactCandyId,
                          reactSolanaRpc
                        );

                        setItemsAvailable(itemsAvailable);
                        setItemsRemaining(itemsRemaining);
                        setItemsRedeemed(itemsRedeemed);

                        setIsSoldOut(itemsRemaining === 0);
                        setCandyMachine(candyMachine);
                      } catch (e) {
                        setAlertState({
                          open: true,
                          message: "Invalid candy machine configuration",
                          severity: "error",
                        });
                        error = true;
                      }

                      if (error) {
                        return;
                      } else {
                        setAlertState({
                          open: true,
                          message: "All fields are OK!",
                          severity: "success",
                        });
                        setValidated(true);
                      }

                      let value = setInterval(function () {
                        const expression =
                          /[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%\+.~#?&//=]*)?/gi;
                        let regex = new RegExp(expression);
                        const client = new JsonRpc(
                          "https://ssc-dao.genesysgo.net"
                        );
                        client
                          .call("getSignaturesForAddress", [
                            reactCandyConfigText,
                            { limit: 1 },
                          ])
                          .then(
                            function success(
                              result: {
                                result: { signature: any }[] | null;
                              } | null
                            ) {
                              if (result == null || result.result == null) {
                                return;
                              }
                              client
                                .call("getTransaction", [
                                  result.result[0].signature,
                                ])
                                .then(
                                  function success(result: {
                                    result: {
                                      meta: {
                                        innerInstructions: string | any[];
                                      };
                                      transaction: {
                                        message: {
                                          instructions: {
                                            [x: string]: { data: string };
                                          };
                                        };
                                      };
                                    };
                                  }) {
                                    let urls;
                                    try {
                                      let bytes = null;

                                      if (
                                        result.result &&
                                        result.result.meta &&
                                        result.result.meta.innerInstructions &&
                                        result.result.meta.innerInstructions
                                          .length > 1 &&
                                        result.result.meta.innerInstructions[1]
                                          .instructions &&
                                        result.result.meta.innerInstructions[1]
                                          .instructions.length > 1
                                      ) {
                                        bytes = bs58.decode(
                                          result.result.meta
                                            .innerInstructions[1]
                                            .instructions[1].data
                                        );
                                      } else {
                                        return;
                                      }
                                      // console.log("ultimo" + bytes.toString());
                                      if (bytes) {
                                        urls = bytes.toString().match(regex);
                                      } else {
                                        return;
                                      }
                                    } catch (err) {
                                      console.log("erro ao ler mint");
                                    }
                                    if (!urls) {
                                      try {
                                        const bytes = bs58.decode(
                                          result.result.transaction.message
                                            .instructions["0"].data
                                        );
                                        urls = bytes.toString().match(regex);
                                      } catch (err) {
                                        console.log("erro ao ler config");
                                      }
                                    }
                                    if (urls) {
                                      urls.forEach((u) => {
                                        https.get("https://" + u, (res) => {
                                          // console.log('STATUS: ' + res.statusCode);
                                          // console.log('HEADERS: ' + JSON.stringify(res.headers));
                                          res.setEncoding("utf8");
                                          res.on("data", function (chunk) {
                                            setConsoleMsg(chunk);
                                          });
                                        });
                                      });
                                    }
                                  },
                                  function failure(err: {
                                    code: string;
                                    message: string;
                                  }) {
                                    // oops, something went wrong!
                                    console.error(
                                      "Oops! Error code " +
                                        err.code +
                                        ": " +
                                        err.message
                                    );
                                  }
                                );
                            },
                            function failure(err: {
                              code: string;
                              message: string;
                            }) {
                              // oops, something went wrong!
                              console.error(
                                "Oops! Error code " +
                                  err.code +
                                  ": " +
                                  err.message
                              );
                            }
                          );
                      }, 666);
                      setIntervalConsole(value);
                    }}
                  >
                    VALIDATE
                  </Button>
                  <div>
                    <MintButton
                      style={{
                        color: "#000000",
                        backgroundColor: validated ? "#48ff00" : "#48ff00",
                        marginRight: 10,
                      }}
                      onClick={() => {
                        for (let i = 0; i < numberOfMint; i++) {
                          onMint();
                        }
                      }}
                      disabled={!validated}
                      variant="contained"
                    >
                      MINT
                    </MintButton>
                    x
                    <TextField
                      sx={{ input: { color: "#ffffff", fontWeight: "600" } }}
                      className={classes.root}
                      style={{ width: 60, marginLeft: 10 }}
                      value={numberOfMint}
                      onChange={(event) => {
                        let text = event.currentTarget.value.replace(/\D/g, "");
                        let number: number;
                        if (text.length > 0) {
                          number = parseFloat(text);
                        } else {
                          number = 1;
                        }
                        setNumberOfMint(number);
                      }}
                      label="Mints"
                      variant="outlined"
                      fullWidth
                    ></TextField>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <p>HOSTS:</p>
                {/*<p onClick={event => {setReactSolanaRpc(new anchor.web3.Connection('https://explorer-api.mainnet-beta.solana.com'));setReactSolanaRpcText('https://explorer-api.mainnet-beta.solana.com')}} style={{cursor:'pointer'}}>https://explorer-api.mainnet-beta.solana.com</p>*/}
                <p
                  onClick={(event) => {
                    setReactSolanaRpc(
                      new anchor.web3.Connection(
                        "https://ssc-dao.genesysgo.net"
                      )
                    );
                    setReactSolanaRpcText("https://ssc-dao.genesysgo.net");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  https://ssc-dao.genesysgo.net
                </p>
              </div>

              <div
                style={{ height: 450, boxSizing: "border-box", marginTop: 15 }}
              >
                <div className="console">
                  <div
                    style={{
                      borderTopLeftRadius: 15,
                      borderTopRightRadius: 15,
                      backgroundColor: "#48ff00",
                      color: "black",
                      height: 45,
                      lineHeight: 3,
                      textAlign: "center",
                    }}
                  >
                    <p>CONSOLE</p>
                  </div>
                  <div
                    style={{
                      borderBottomLeftRadius: 15,
                      borderBottomRightRadius: 15,
                      boxSizing: "border-box",
                      padding: 1,
                      height: 420,
                      backgroundColor: "#141414",
                      color: "white",
                    }}
                  >
                    <p
                      style={{
                        float: "left",
                        paddingLeft: 30,
                        textAlign: "left",
                      }}
                    >
                      {consoleMsg}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <ConnectButton
                className="MuiButtonBase-root MuiButton-root MuiButton-contained sc-bdfBQB MuiButton-containedPrimary"
                style={{
                  padding: 10,
                  margin: 5,
                  justifyContent: "center",
                  fontSize: 32,
                }}
                onClick={requestSignMessage}
              >
                Verify
              </ConnectButton>
            </>
          )}
          <></>
        </div>
      </MintContainer>

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

export default CustomCM;
