const app = require("./app");
const cloudinary = require("cloudinary");
const fetch = require("node-fetch");
const PORT = process.env.PORT || 3099;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ETH_RPC_URL =
  process.env.ETH_RPC_URL || "https://ethereum-rpc.publicnode.com";
const ERC20_ADDRESS =
  process.env.ERC20_ADDRESS || "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const decodeUint = (hex) => BigInt(hex).toString();

const decodeString = (hex) => {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length === 0) {
    return "";
  }
  const buffer = Buffer.from(clean, "hex");
  const offset = Number(
    BigInt(`0x${buffer.slice(0, 32).toString("hex") || "0"}`)
  );
  if (Number.isNaN(offset) || offset + 32 > buffer.length) {
    return "";
  }
  const length = Number(
    BigInt(`0x${buffer.slice(offset, offset + 32).toString("hex") || "0"}`)
  );
  const start = offset + 32;
  const end = start + length;
  if (end > buffer.length) {
    return "";
  }
  return buffer.slice(start, end).toString("utf8");
};

const callEthRpc = async (method, params) => {
  const response = await fetch(ETH_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
  });
  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message || "RPC error");
  }
  return payload.result;
};

const callErc20 = (data) =>
  callEthRpc("eth_call", [{ to: ERC20_ADDRESS, data }, "latest"]);

app.get("/Lydia_Test", async (req, res) => {
  try {
    const [nameHex, symbolHex, decimalsHex, totalSupplyHex] = await Promise.all(
      [
        callErc20("0x06fdde03"),
        callErc20("0x95d89b41"),
        callErc20("0x313ce567"),
        callErc20("0x18160ddd"),
      ]
    );

    const result = {
      rpcUrl: ETH_RPC_URL,
      contractAddress: ERC20_ADDRESS,
      name: decodeString(nameHex),
      symbol: decodeString(symbolHex),
      decimals: decodeUint(decimalsHex),
      totalSupply: decodeUint(totalSupplyHex),
    };

    console.log("Lydia_Test", result);
    res.status(200).json(result);
  } catch (error) {
    console.error("Lydia_Test failed", error.message);
    res.status(500).json({ error: "Lydia_Test failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running`);
});
