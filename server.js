const express = require("express");
const ping = require("ping");
const path = require("path");
const { Netmask } = require("netmask");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/ping", async (req, res) => {
  const { network, subnet } = req.body;

  // 入力検証
  if (!network || !subnet) {
    return res
      .status(400)
      .json({ error: "Network address and subnet mask are required" });
  }

  const networkPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const subnetPattern = /^\/\d{1,2}$/;

  if (!networkPattern.test(network) || !subnetPattern.test(subnet)) {
    return res
      .status(400)
      .json({ error: "Invalid network address or subnet mask format" });
  }

  try {
    const block = new Netmask(`${network}${subnet}`);
    const ipAddresses = [];

    block.forEach((ip) => {
      ipAddresses.push(ip);
    });

    const pingPromises = ipAddresses.map((ip) =>
      ping.promise.probe(ip, { timeout: 1 })
    );

    const results = await Promise.all(pingPromises);

    const formattedResults = results.map((result) => ({
      ip: result.host,
      status: result.alive ? "Online" : "Offline",
      time: new Date(),
    }));

    res.json(formattedResults);
  } catch (error) {
    res.status(400).json({ error: "Invalid network address or subnet mask" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
