import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { UserAccount } from "./src/types";

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";

// Read Firebase Config file generated dynamically during provision
const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
if (!fs.existsSync(CONFIG_PATH)) {
  throw new Error("Unable to locate Firebase applet configuration.");
}

const firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
const usersCol = collection(db, "users");

// Default seed users (Admin Indra and Member Joko)
const DEFAULT_USERS: UserAccount[] = [
  {
    id: "UID-10001",
    username: "admin",
    email: "admin@idrminer.com",
    passwordHex: "admin123",
    isAdmin: true,
    joinedAt: "25/5/2026",
    miningConfig: {
      balancePenampungan: 0,
      balanceEWallet: 0,
      totalMined: 0,
      baseHashRate: 15.0,
      boostMultiplier: 1.0,
      isMiningActive: false,
      referralCode: "IDR-ADMN",
      referredBy: null,
      referrals: [],
      autoWithdrawActive: false,
      targetEWallet: "DANA",
      walletNumber: "081211112222",
      payoutThreshold: 10000,
      payoutProgress: 0,
      payoutHistory: [],
      depositHistory: [],
      privateKey: "",
      publicKey: "",
      machineActiveDays: 3,
      rentedRigs: []
    }
  },
  {
    id: "UID-10002",
    username: "jokowow",
    email: "joko@gmail.com",
    passwordHex: "user123",
    isAdmin: false,
    joinedAt: "25/5/2026",
    miningConfig: {
      balancePenampungan: 18450,
      balanceEWallet: 54000,
      totalMined: 72450,
      baseHashRate: 4.8,
      boostMultiplier: 1.0,
      isMiningActive: true,
      referralCode: "IDR-F7X8",
      referredBy: null,
      referrals: [],
      autoWithdrawActive: true,
      targetEWallet: "DANA",
      walletNumber: "081298765432",
      payoutThreshold: 50000,
      payoutProgress: 36,
      payoutHistory: [
        {
          id: "TXN-842911",
          userId: "UID-10002",
          username: "jokowow",
          timestamp: "25/5/2026, 14:12:00",
          amount: 35000,
          walletType: "DANA",
          walletNumber: "081298765432",
          txHash: "0x3a8b417fcd9e02c59de104a8b7ddf2bb89a19c636f014e3da8f7c9e0cba002ae",
          status: "Completed"
        }
      ],
      depositHistory: [
        {
          id: "QRS-41829",
          userId: "UID-10002",
          username: "jokowow",
          timestamp: "25/5/2026, 11:05:00",
          amount: 25000,
          paymentMethod: "QRIS",
          status: "Completed",
          referenceNumber: "REF-XZ901248KLPB"
        }
      ],
      privateKey: "",
      publicKey: "",
      machineActiveDays: 3,
      rentedRigs: []
    }
  }
];

// Helper to simulate background cloud mining when users are offline or browser is closed
function updateBackgroundMining(users: UserAccount[]): boolean {
  let modified = false;
  const now = Date.now();

  for (const user of users) {
    const config = user.miningConfig;
    if (config && config.isMiningActive && config.miningSessionExpiry) {
      const expiry = config.miningSessionExpiry;
      const startSession = expiry - 24 * 60 * 60 * 1000;
      let lastMined = config.lastMinedAt ?? startSession;

      if (lastMined < startSession) {
        lastMined = startSession;
      }

      const endPoint = Math.min(now, expiry);

      if (endPoint > lastMined) {
        const elapsedMs = endPoint - lastMined;
        const baseRate = config.baseHashRate || 4.8;
        const mult = config.boostMultiplier || 1.0;

        const intervalMs = Math.max(1000, 4000 - (baseRate * mult * 150));
        const rewardBase = 12;
        const actualReward = Math.round(rewardBase * (1 + (baseRate / 20)) * mult);
        const rewardPerMs = actualReward / intervalMs;
        const earned = elapsedMs * rewardPerMs;

        if (earned >= 1) {
          const earnedInt = Math.floor(earned);
          config.balancePenampungan += earnedInt;
          config.totalMined += earnedInt;

          // Advance lastMinedAt precisely by the time used for the integer reward
          const consumedMs = Math.floor(earnedInt / rewardPerMs);
          config.lastMinedAt = lastMined + consumedMs;
          modified = true;
        }
      }

      // If session expired, terminate mining active state and lock lastMinedAt to expiry
      if (now >= expiry) {
        config.isMiningActive = false;
        config.lastMinedAt = expiry;
        modified = true;
      }
    }
  }

  return modified;
}

// Helper to load or initialize DB async from Firestore
async function readDb(): Promise<UserAccount[]> {
  try {
    const querySnapshot = await getDocs(usersCol);
    const list: UserAccount[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as UserAccount);
    });

    if (list.length === 0) {
      console.log("No user records found in Firestore. Seeding default demo accounts...");
      await writeDb(DEFAULT_USERS);
      return DEFAULT_USERS;
    }

    let modified = updateBackgroundMining(list);

    // Auto upgrade schema to ensure everyone has machine fields recorded
    let upgradedFlag = false;
    const upgraded = list.map(u => {
      if (u.miningConfig.machineActiveDays === undefined || u.miningConfig.rentedRigs === undefined) {
        upgradedFlag = true;
        return {
          ...u,
          miningConfig: {
            ...u.miningConfig,
            machineActiveDays: u.miningConfig.machineActiveDays ?? 3,
            rentedRigs: u.miningConfig.rentedRigs ?? []
          }
        };
      }
      return u;
    });

    if (modified || upgradedFlag) {
      await writeDb(upgraded);
    }
    return upgraded;
  } catch (err) {
    console.error("Failed to read from Firestore database", err);
    return DEFAULT_USERS;
  }
}

// Helper to write database async to Firestore
async function writeDb(users: UserAccount[]): Promise<void> {
  try {
    for (const user of users) {
      const userDocRef = doc(db, "users", user.id);
      await setDoc(userDocRef, user);
    }
  } catch (err) {
    console.error("Failed to write to Firestore database", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser for APIs
  app.use(express.json());

  // Ensure DB gets initialized at startup
  await readDb();

  // API 1: Fetch all users
  app.get("/api/users", async (req, res) => {
    const list = await readDb();
    res.json(list);
  });

  // API 2: Create / Update a single user (Registers or Updates configs/deposits)
  app.post("/api/users/update", async (req, res) => {
    const incoming: UserAccount = req.body;
    if (!incoming || !incoming.id) {
      return res.status(400).json({ error: "Invalid user cargo" });
    }

    const list = await readDb();
    const existingIndex = list.findIndex(u => u.id === incoming.id);

    if (existingIndex > -1) {
      list[existingIndex] = incoming;
    } else {
      list.push(incoming);
    }

    await writeDb(list);
    res.json({ success: true, user: incoming });
  });

  // API 3b: Handles logging session cleanup without resetting balances or mining state
  app.post("/api/users/logout-reset", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "UserId is required" });
    }

    const list = await readDb();
    const existingIndex = list.findIndex(u => u.id === userId);

    if (existingIndex > -1) {
      // Intentionally do NOT reset isMiningActive, balancePenampungan, or miningSessionExpiry
      return res.json({ success: true, user: list[existingIndex] });
    }

    res.status(404).json({ error: "User not found" });
  });

  // API 3: Batch Update users (for bulk modifications, or fast synchronizers)
  app.post("/api/users/save-all", async (req, res) => {
    const list = req.body;
    if (Array.isArray(list)) {
      await writeDb(list);
      return res.json({ success: true, count: list.length });
    }
    res.status(400).json({ error: "Payload must be a UserAccount array" });
  });

  // API 4: Create pending deposit invoice
  app.post("/api/deposit/create", async (req, res) => {
    const { userId, amount } = req.body;
    if (!userId || !amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: "UserId and valid amount are required" });
    }

    const list = await readDb();
    const userIndex = list.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    const qrisId = 'QRS-' + Math.floor(Math.random() * 89999 + 10000);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let refNum = 'REF-';
    for (let i = 0; i < 12; i++) {
      refNum += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newInvoice = {
      id: qrisId,
      userId: userId,
      username: list[userIndex].username,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      amount: Number(amount),
      paymentMethod: 'QRIS' as const,
      status: 'Pending' as const,
      referenceNumber: refNum
    };

    // Append to user's depositHistory
    list[userIndex].miningConfig.depositHistory = [
      newInvoice,
      ...list[userIndex].miningConfig.depositHistory
    ];

    await writeDb(list);
    res.json({ success: true, invoice: newInvoice });
  });

  // API 5: Webhook receiver representing simulated payment gateway callback
  app.post("/api/webhook", async (req, res) => {
    const { order_id, status, amount } = req.body;
    if (!order_id || !status || amount === undefined) {
      return res.status(400).json({ error: "Missing webhook parameters (order_id, status, amount)" });
    }

    if (status !== "PAID") {
      return res.status(200).json({ message: "Ignored status", success: false });
    }

    const list = await readDb();
    let found = false;
    let targetUserIndex = -1;
    let targetTxIndex = -1;

    for (let uIdx = 0; uIdx < list.length; uIdx++) {
      const user = list[uIdx];
      if (user.miningConfig && Array.isArray(user.miningConfig.depositHistory)) {
        const txIdx = user.miningConfig.depositHistory.findIndex(tx => tx.id === order_id);
        if (txIdx > -1) {
          targetUserIndex = uIdx;
          targetTxIndex = txIdx;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      return res.status(404).json({ error: "No matching pending transaction found for order_id: " + order_id });
    }

    const user = list[targetUserIndex];
    const tx = user.miningConfig.depositHistory[targetTxIndex];

    if (tx.status === "Completed") {
      return res.status(200).json({ message: "Transaction already paid", success: true });
    }

    // Update transaction status to Completed
    tx.status = "Completed";
    
    // Add amount to user's balance
    user.miningConfig.balanceEWallet += Number(amount);

    await writeDb(list);
    res.json({
      success: true,
      message: `Transaction ${order_id} successfully processed! ${amount} added to user ${user.username}`,
      updatedBalance: user.miningConfig.balanceEWallet
    });
  });

  // API 6: Direct /webhook endpoint layout requested by the user
  app.post("/webhook", async (req, res) => {
    const data = req.body;
    if (!data || !data.order_id || !data.status || data.amount === undefined) {
      return res.status(400).send("Bad Request: Missing parameters");
    }

    if (data.status === "PAID") {
      const list = await readDb();
      let found = false;
      let targetUserIndex = -1;
      let targetTxIndex = -1;

      for (let uIdx = 0; uIdx < list.length; uIdx++) {
        const user = list[uIdx];
        if (user.miningConfig && Array.isArray(user.miningConfig.depositHistory)) {
          const txIdx = user.miningConfig.depositHistory.findIndex(tx => tx.id === data.order_id);
          if (txIdx > -1) {
            targetUserIndex = uIdx;
            targetTxIndex = txIdx;
            found = true;
            break;
          }
        }
      }

      if (found) {
        const user = list[targetUserIndex];
        const tx = user.miningConfig.depositHistory[targetTxIndex];
        
        if (tx.status === "Pending") {
          tx.status = "Completed";
          user.miningConfig.balanceEWallet += Number(data.amount);
          await writeDb(list);
        }
      }
    }

    res.send("OK");
  });

  // Vite Middleware configuration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
