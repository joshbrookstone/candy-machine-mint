import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Button, Snackbar, Typography } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import bs58 from "bs58";
import * as anchor from "@project-serum/anchor";
import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz";

import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";
import Container from "@mui/material/Container";

import { shortenAddress } from "./candy-machine";
import axios from "axios";
import title from "./text2.png";
import Cookies from "js-cookie";
import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Title from "./Components/Title";

axios.defaults.withCredentials = true;

const ConnectButton = styled(WalletDialogButton)``; // add your styles here

const MintContainer = styled(Container)``; // add your styles here

const MintButton = styled(Button)``; // add your styles here
const NormalButton = styled(Button)``; // add your styles here
export interface HomeProps {
  connection: anchor.web3.Connection;
}

const Home = (props: HomeProps) => {
  const navigate = useNavigate();
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const recaptchaRef = useRef(null);

  const { publicKey, signMessage } = useWallet();
  const wallet = useAnchorWallet();
  const tokenList = getParsedNftAccountsByOwner({
    publicAddress: publicKey,
    connection: props.connection,
  });

  const [logged, setLogged] = useState(false);
  const [captchaDone, setCaptchaDone] = useState(false);

  useEffect(() => {
    if (Cookies.get("connect.sid") != null) {
      setLogged(true);
    }
  }, []);

  const requestSignMessage = async () => {
    try {
      let neonToken: any[] = [];
      neonToken.push(...(await tokenList));
      if (
        neonToken.filter(
          (token) =>
            token?.updateAuthority ===
            "34AjXERmYgvtuH7i858XW26Cy7xu7HFjWTgXMMx7Ny6Y"
        ).length == 0
      )
        throw new Error("Not a Marker holder!");
      if (!publicKey) throw new Error("Wallet not connected!");
      if (!signMessage)
        throw new Error("Wallet does not support message signing!");

      const message = new TextEncoder().encode(
        JSON.stringify("Marker wallet verification")
      );
      const signature = await signMessage(message);
      const user = {
        tokens: neonToken
          .filter(
            (token) =>
              token?.updateAuthority ===
              "34AjXERmYgvtuH7i858XW26Cy7xu7HFjWTgXMMx7Ny6Y"
          )
          .map((t) => t.mint),
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
      setLogged(true);
    } catch (error) {
      let message = "Verification " + error;
      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    }
  };

  const renderTitle = () => {
    return <Title />;
  };

  return (
    <>
      <MintContainer>
        {renderTitle()}
        <div
          style={{
            width: "100%",
            margin: "auto 0",
            textAlign: "center",
            height: "15em",
          }}
        >
          {logged ? (
            <>
              {!wallet ? (
                <ConnectButton>Connect Wallet</ConnectButton>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    alignContent: "space-between",
                    padding: 20,
                    height: 100,
                  }}
                >
                  <NormalButton
                    style={{
                      width: 350,
                      padding: 10,
                      margin: 5,
                      justifyContent: "center",
                    }}
                    className="MuiButtonBase-root MuiButton-root MuiButton-contained sc-bdfBQB MuiButton-containedPrimary"
                    onClick={() => {
                      navigate("/customcm");
                    }}
                  >
                    CANDY MINTER
                  </NormalButton>
                  <NormalButton
                    style={{
                      width: 350,
                      padding: 10,
                      margin: 5,
                      justifyContent: "center",
                    }}
                    disabled={false}
                    className="MuiButtonBase-root MuiButton-root MuiButton-contained sc-bdfBQB MuiButton-containedPrimary"
                    onClick={() => {
                      navigate("/");
                    }}
                  >
                    HOME
                  </NormalButton>
                  <MintButton
                    className="MuiButtonBase-root MuiButton-root MuiButton-contained sc-bdfBQB MuiButton-containedPrimary"
                    style={{
                      width: 350,
                      padding: 10,
                      margin: 5,

                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                    onClick={requestSignMessage}
                    disabled={false} //do you really want your button to be disabled?
                  >
                    VERIFY
                  </MintButton>
                </div>
              )}
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
                disabled={false} //do you really want your button to be disabled?
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

export default Home;
