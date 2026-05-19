import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, TrendingDown, Shield, Activity, CheckCircle2, AlertCircle, XCircle, 
  Plus, Search, Award, HelpCircle, Settings as SettingsIcon, DollarSign, Wallet, 
  Bell, User, History, Library, ArrowUpRight, ChevronRight, CreditCard, Send, 
  Bot, Terminal, PieChart, Info, RefreshCw, Star, ArrowDownRight, Check
} from "lucide-react";

// Asset Definitions with typical parameters
interface AssetConfig {
  symbol: string;
  name: string;
  price: number;
  multiplier: number; // point value multiplier
  spread: number;
}

const ASSETS: Record<string, AssetConfig> = {
  NAS100: { symbol: "NAS100", name: "Nasdaq 100 Index", price: 18244.50, multiplier: 10, spread: 1.5 },
  XAUUSD: { symbol: "XAUUSD", name: "Gold Spot vs US Dollar", price: 2350.005, multiplier: 100, spread: 0.15 },
  EURUSD: { symbol: "EURUSD", name: "Euro vs US Dollar", price: 1.08542, multiplier: 100000, spread: 0.00008 },
  BTCUSD: { symbol: "BTCUSD", name: "Bitcoin vs US Dollar", price: 66205.00, multiplier: 1, spread: 12.0 },
};

interface Account {
  id: string;
  tierName: string;
  initialBalance: number;
  balance: number;
  type: "Funded" | "Evaluation Phase 1" | "Evaluation Phase 2";
  status: "COMPLIANT" | "FAILED";
  allowedMaxDailyLoss: number; // percentage
  allowedMaxOverallDrawdown: number; // percentage
}

interface Position {
  id: string;
  asset: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  currentPrice: number;
  size: number; // Lots
  multiplier: number;
  timestamp: string;
}

interface ClosedTrade {
  id: string;
  asset: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  closePrice: number;
  size: number;
  profit: number;
  timestamp: string;
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  
  // Interactive Live Metrics Tick Simulated State
  const [liveTraders, setLiveTraders] = useState<number>(12402);
  const [livePayouts, setLivePayouts] = useState<number>(420000.00);

  // Accounts List - Traders can switch or buy more!
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: "#4029",
      tierName: "Pro Funded",
      initialBalance: 100000,
      balance: 100000,
      type: "Funded",
      status: "COMPLIANT",
      allowedMaxDailyLoss: 5,
      allowedMaxOverallDrawdown: 10
    },
    {
      id: "#1209",
      tierName: "Starter Evaluation",
      initialBalance: 25000,
      balance: 24800,
      type: "Evaluation Phase 1",
      status: "COMPLIANT",
      allowedMaxDailyLoss: 5,
      allowedMaxOverallDrawdown: 10
    }
  ]);
  const [activeAccountIdx, setActiveAccountIdx] = useState<number>(0);
  const activeAccount = accounts[activeAccountIdx];

  // Active Positions - Initial values precisely calibrated to yield mockup's floating P&L of +$4,240.50
  const [positions, setPositions] = useState<Position[]>([
    {
      id: "pos_1",
      asset: "NAS100",
      type: "BUY",
      entryPrice: 18210.00,
      currentPrice: 18244.50,
      size: 10.00,
      multiplier: 10,
      timestamp: "14:23:05"
    },
    {
      id: "pos_2",
      asset: "XAUUSD",
      type: "BUY",
      entryPrice: 2342.10,
      currentPrice: 2350.005,
      size: 10.00,
      multiplier: 10, // Gives $790.50 profit at currentPrice 2350.005
      timestamp: "15:45:12"
    }
  ]);

  // Closed Trades Log (Initial values match mockup executions precisely)
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([
    {
      id: "closed_1",
      asset: "NAS100",
      type: "BUY",
      entryPrice: 18120.00,
      closePrice: 18240.40,
      size: 10.00,
      profit: 1204.00,
      timestamp: "10:14:22"
    },
    {
      id: "closed_2",
      asset: "XAUUSD",
      type: "SELL",
      entryPrice: 2355.20,
      closePrice: 2359.40,
      size: 5.50,
      profit: -420.50,
      timestamp: "11:32:01"
    },
    {
      id: "closed_3",
      asset: "EURUSD",
      type: "BUY",
      entryPrice: 1.08182,
      closePrice: 1.08538,
      size: 25.00,
      profit: 890.00,
      timestamp: "13:05:44"
    }
  ]);

  // Equity Log for Chart rendering
  const [equityLog, setEquityLog] = useState<number[]>([
    100000, 100450, 100120, 100980, 101240, 102140, 102450, 103100, 104240.50
  ]);
  const [timeframe, setTimeframe] = useState<string>("1D");

  // Trading Executive Terminal Form state
  const [tradeAsset, setTradeAsset] = useState<string>("NAS100");
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [tradeSize, setTradeSize] = useState<number>(10.0);
  const [executingOrder, setExecutingOrder] = useState<boolean>(false);
  const [orderFeedback, setOrderFeedback] = useState<string | null>(null);

  // Challenges Purchase Flow State
  const [selectedTier, setSelectedTier] = useState<string>("elite");
  const [challengeBought, setChallengeBought] = useState<boolean>(false);
  const [promoCode, setPromoCode] = useState<string>("");
  const [promoApplied, setPromoApplied] = useState<boolean>(false);

  // Payout State
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutAddress, setPayoutAddress] = useState<string>("");
  const [payoutRequestStatus, setPayoutRequestStatus] = useState<"idle" | "submitting" | "success" | "invalid">("idle");
  const [payoutLogs, setPayoutLogs] = useState<any[]>([
    { date: "2026-04-15", amount: 12500, type: "Crypto (USDT)", status: "Completed" },
    { date: "2026-03-01", amount: 8400, type: "Bank Wire", status: "Completed" },
  ]);

  // Leaderboard state
  const [leaderboardSearch, setLeaderboardSearch] = useState<string>("");
  const [selectedLeader, setSelectedLeader] = useState<any>(null);

  // AI Chat Assistant State
  const [aiInput, setAiInput] = useState<string>("");
  const [aiChats, setAiChats] = useState<any[]>([
    {
      role: "model",
      text: "Greetings, Commander. I am AlphaAI. I have scanned your active NAS100 & XAUUSD positions. How can I optimize your quantitative risk or coding scripts today?"
    }
  ]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Settings customizable state
  const [avatarInitials, setAvatarInitials] = useState<string>("PT");
  const [traderName, setTraderName] = useState<string>("Pro Trader");
  const [leverageCap, setLeverageCap] = useState<string>("1:100");
  const [neonIntensity, setNeonIntensity] = useState<number>(75);

  // Help & Support Tickets State
  const [ticketSubject, setTicketSubject] = useState<string>("");
  const [ticketDesc, setTicketDesc] = useState<string>("");
  const [ticketStatus, setTicketStatus] = useState<string>("");

  // Rules Quiz State
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizSelections, setQuizSelections] = useState<Record<number, number>>({});

  // Calculations for Equity, Drawdowns & Rule compliance
  // Calculate raw profit for a position
  const getPosProfit = (pos: Position) => {
    const diff = pos.type === "BUY" ? pos.currentPrice - pos.entryPrice : pos.entryPrice - pos.currentPrice;
    const value = diff * pos.multiplier * pos.size;
    return Number(value.toFixed(2));
  };

  const floatingProfit = Number(positions.reduce((acc, pos) => acc + getPosProfit(pos), 0).toFixed(2));
  const activeEquity = Number((activeAccount.balance + floatingProfit).toFixed(2));

  // Daily Loss Calculations
  const todaySClosedProfit = closedTrades.reduce((acc, t) => acc + t.profit, 0);
  const todaySTotalPnL = todaySClosedProfit + floatingProfit;
  
  // Daily drawdown bounds
  const startingDayBalance = activeAccount.initialBalance; // simplified start value
  const dailyLossLimitValue = startingDayBalance * (activeAccount.allowedMaxDailyLoss / 100);
  const currentDailyLoss = Math.max(0, startingDayBalance - activeEquity);
  const dailyLossPercentUsed = Math.min(100, Math.max(0, (currentDailyLoss / dailyLossLimitValue) * 100));
  const dailyLossRemainingPct = 100 - dailyLossPercentUsed;

  // Max Overall Drawdown
  const overallMaxDrawdownValue = activeAccount.initialBalance * (activeAccount.allowedMaxOverallDrawdown / 100);
  const currentCumulativeDrawdown = Math.max(0, activeAccount.initialBalance - activeEquity);
  const overallDrawdownPercentUsed = Math.min(100, Math.max(0, (currentCumulativeDrawdown / overallMaxDrawdownValue) * 100));

  // Determine Overall Status
  const isDailyViolated = currentDailyLoss >= dailyLossLimitValue;
  const isOverallViolated = currentCumulativeDrawdown >= overallMaxDrawdownValue;
  const isAccountViolated = isDailyViolated || isOverallViolated || activeAccount.status === "FAILED";

  // Simulation Loop: updates rates and ticks positions slightly to simulate real-time live trading
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Modulate live active counters
      setLiveTraders(prev => prev + (Math.floor(Math.random() * 5) - 2));
      setLivePayouts(prev => prev + (Math.random() > 0.85 ? Number((Math.random() * 24).toFixed(2)) : 0));

      // 2. Multi-direction tick simulation of existing open positions
      setPositions(prevPositions => {
        if (prevPositions.length === 0) return prevPositions;
        return prevPositions.map(pos => {
          let priceTick = 0;
          if (pos.asset === "NAS100") {
            priceTick = Number(((Math.random() - 0.495) * 5.0).toFixed(2)); // slight buy posture
          } else if (pos.asset === "XAUUSD") {
            priceTick = Number(((Math.random() - 0.490) * 0.15).toFixed(3));
          } else if (pos.asset === "EURUSD") {
            priceTick = Number(((Math.random() - 0.500) * 0.00008).toFixed(5));
          } else if (pos.asset === "BTCUSD") {
            priceTick = Number(((Math.random() - 0.495) * 12.00).toFixed(2));
          }
          return {
            ...pos,
            currentPrice: Number((pos.currentPrice + priceTick).toFixed(pos.asset === "EURUSD" ? 5 : pos.asset === "XAUUSD" ? 3 : 2))
          };
        });
      });
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Update Equity History periodically
  useEffect(() => {
    const timer = setInterval(() => {
      // Append current equity to the historical chart data
      setEquityLog(prev => {
        const sliced = prev.length > 25 ? prev.slice(1) : prev;
        return [...sliced, activeEquity];
      });
    }, 12000);
    return () => clearInterval(timer);
  }, [activeEquity]);

  // Scroll Chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiChats, aiLoading]);

  // Handle placing a dynamic mock trade
  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAccountViolated) {
      alert("This account is currently in VIOLATED state. Order execution is locked.");
      return;
    }
    setExecutingOrder(true);
    setOrderFeedback("Sending order to prime liquidity pool...");

    setTimeout(() => {
      const config = ASSETS[tradeAsset];
      // Generate some slippage/spread added entries
      const entryOffset = tradeType === "BUY" ? (config.spread / 2) : -(config.spread / 2);
      const entryPrice = Number((config.price + entryOffset).toFixed(tradeAsset === "EURUSD" ? 5 : 2));

      const newPosition: Position = {
        id: "pos_" + Math.random().toString(36).substring(4, 8),
        asset: tradeAsset,
        type: tradeType,
        entryPrice: entryPrice,
        currentPrice: entryPrice,
        size: Number(tradeSize),
        multiplier: config.multiplier,
        timestamp: new Date().toLocaleTimeString()
      };

      setPositions(prev => [newPosition, ...prev]);
      setExecutingOrder(false);
      setOrderFeedback(null);
      
      // Flash notifications or temporary modal feedback
      alert(`EX_COMPLETED: ${tradeType} ${tradeSize} Lots of ${tradeAsset} filled at aggregate price ${entryPrice}`);
    }, 900);
  };

  // Close an individual floating position
  const handleClosePosition = (id: string) => {
    const index = positions.findIndex(p => p.id === id);
    if (index === -1) return;
    const pos = positions[index];
    const profitVal = getPosProfit(pos);

    // Filter out closed position
    setPositions(prev => prev.filter(p => p.id !== id));

    // Calculate closed values
    const newClosed: ClosedTrade = {
      id: "closed_" + Math.random().toString(36).substring(4, 8),
      asset: pos.asset,
      type: pos.type,
      entryPrice: pos.entryPrice,
      closePrice: pos.currentPrice,
      size: pos.size,
      profit: profitVal,
      timestamp: new Date().toLocaleTimeString()
    };

    setClosedTrades(prev => [newClosed, ...prev]);

    // Update active Account Balance
    setAccounts(prev => prev.map((acc, aIdx) => {
      if (aIdx === activeAccountIdx) {
        return {
          ...acc,
          balance: Number((acc.balance + profitVal).toFixed(2))
        };
      }
      return acc;
    }));
  };

  // Handle reset/re-creation of trading simulator
  const handleResetChallenge = () => {
    if (window.confirm("Are you sure you want to reset this trading account state to initial funded limits? This clears open positions.")) {
      setPositions([]);
      setEquityLog([100000, 100450, 100120, 100980]);
      setAccounts(prev => prev.map((acc, idx) => {
        if (idx === activeAccountIdx) {
          return {
            ...acc,
            balance: acc.initialBalance,
            status: "COMPLIANT"
          };
        }
        return acc;
      }));
      setClosedTrades([
        {
          id: "closed_new",
          asset: "NAS100",
          type: "BUY",
          entryPrice: 18210.0,
          closePrice: 18230.0,
          size: 5.0,
          profit: 1000.0,
          timestamp: "Fresh Session"
        }
      ]);
    }
  };

  // Purchase new challenge tier
  const handlePurchaseChallenge = (tier: string) => {
    let balance = 100000;
    let cost = 495;
    let name = "Enterprise Elite";
    
    if (tier === "starter") {
      balance = 25000;
      cost = 150;
      name = "Starter Pro";
    } else if (tier === "executive") {
      balance = 50000;
      cost = 280;
      name = "Executive Model";
    } else if (tier === "pro_tier") {
      balance = 100000;
      cost = 495;
      name = "Quantitative Elite";
    } else if (tier === "alpha") {
      balance = 200000;
      cost = 950;
      name = "Alpha Pro Model";
    }

    if (promoApplied) cost = Math.round(cost * 0.9);

    const confirmation = window.confirm(
      `Confirm purchase of ${name} trading challenge? Simulated cost: $${cost} Mock Credits. Initial starting equity: $${balance.toLocaleString()}`
    );

    if (confirmation) {
      const newAccountID = "#Challenge_" + Math.floor(1000 + Math.random() * 9000);
      const newAccount: Account = {
        id: newAccountID,
        tierName: name,
        initialBalance: balance,
        balance: balance,
        type: "Evaluation Phase 1",
        status: "COMPLIANT",
        allowedMaxDailyLoss: 5,
        allowedMaxOverallDrawdown: 10
      };

      setAccounts(prev => [...prev, newAccount]);
      setActiveAccountIdx(accounts.length); // switch to newly purchased account
      setChallengeBought(true);
      setActiveTab("dashboard");
      // Clear positions since new account is clean
      setPositions([]);
      setEquityLog([balance]);
      alert(`Success! Account ${newAccountID} has been successfully provisioned. Starting balance is $${balance.toLocaleString()}. Ready for execution.`);
    }
  };

  // Payout submission request
  const handlePayoutRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const requestVal = parseFloat(payoutAmount);
    
    const profitGains = activeEquity - activeAccount.initialBalance;
    if (profitGains <= 0) {
      alert("Eligibility mismatch: Payouts are only permitted on net quantitative profits. Current gains are sub-zero.");
      setPayoutRequestStatus("invalid");
      return;
    }

    if (isNaN(requestVal) || requestVal <= 0) {
      alert("Invalid Amount specified. Please retry.");
      return;
    }

    if (requestVal > profitGains) {
      alert(`Limit exceeded. You can only request up to total accrued profits ($${profitGains.toFixed(2)})`);
      return;
    }

    setPayoutRequestStatus("submitting");
    setTimeout(() => {
      // Deduct from Balance
      setAccounts(prev => prev.map((acc, idx) => {
        if (idx === activeAccountIdx) {
          return {
            ...acc,
            balance: Number((acc.balance - requestVal).toFixed(2))
          };
        }
        return acc;
      }));

      const newLog = {
        date: new Date().toISOString().substring(0, 10),
        amount: requestVal,
        type: payoutAddress ? "Crypto (TRC20)" : "Simulated Payout Bank",
        status: "Processing"
      };

      setPayoutLogs(prev => [newLog, ...prev]);
      setPayoutRequestStatus("success");
      setPayoutAmount("");
      setPositions([]); // flat positions
    }, 12000);
  };

  // AI Assistant ChatGPT request wrapper
  const handleSendAiMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = { role: "user", text: aiInput };
    setAiChats(prev => [...prev, userMsg]);
    setAiLoading(true);
    const query = aiInput;
    setAiInput("");

    try {
      // Make a secure full stack API request to our Express endpoint
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          chatHistory: aiChats.slice(-6) // serve some local context
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setAiChats(prev => [...prev, { role: "model", text: data.text }]);
      } else {
        // Safe, premium local fallback if Gemini is not set up
        throw new Error(data.error || "Backend connection failed");
      }
    } catch (err: any) {
      console.warn("Express Gemini API call fell back. Presenting detailed local expert content.", err);
      
      // Synthesize brilliant local matching response based on typical user phrases
      let reply = "I detected that the server key is missing, so let me provide my specialized local Quant intelligence: \n\n";
      const q = query.toLowerCase();

      if (q.includes("pinescript") || q.includes("pine script") || q.includes("indicator")) {
        reply += `Here is a **High-Performance EMA Crossover Strategy** in **PineScript v5** for your NAS100 execution desk:

\`\`\`pinescript
//@version=5
strategy("AlphaFlow High-Gain Crossover", overlay=true, initial_capital=100000)

// Parameters
fastLength = input.int(12, "Fast EMA")
slowLength = input.int(26, "Slow EMA")
stopLossPct = input.float(1.5, "Max Trade Risk SL %")

// Calculations
fastEMA = ta.ema(close, fastLength)
slowEMA = ta.ema(close, slowLength)

// Conditions
buySignal = ta.crossover(fastEMA, slowEMA)
sellSignal = ta.crossunder(fastEMA, slowEMA)

if (buySignal)
    strategy.entry("Quant Long", strategy.long)
    
if (sellSignal)
    strategy.close("Quant Long")
\`\`\``;
      } else if (q.includes("drawdown") || q.includes("loss") || q.includes("rule")) {
        reply += `**Prop Firm Drawdown Demystified:**
1. **Daily Loss Limit (5%)**: This specifies that your equity cannot breach 5% below previous day's settling balance. On a **$100,000** model, your daily cushion is **$5,000**. If your net floating equity dips below **$95,000**, you trigger a rule breach.
2. **Max Drawdown Limit (10%)**: This is absolute limits relative to initial deposit. On a **$100,000** model, crossing below **$90,000** equity at any point triggers a total failure. 
*Recommendation*: Always risk maximum **1%** of balance per position to survive long-term drawdown runs!`;
      } else if (q.includes("sharpe") || q.includes("kelly") || q.includes("formula")) {
        reply += `**Kelly Criterion Calculation Formula (Position Sizing):**
The equation determines maximum mathematical lot sizing relative to risk/reward ratio:
$$\\text{Kelly } f^* = p - \\frac{q}{b} = p - \\frac{1-p}{R}$$

Where:
* $p$ = Historical win rate of strategy.
* $q$ = Historical failure rate ($1-p$).
* $R$ = Risk-to-Reward ratio (Average win / Average loss).
* $f^*$ = Fractional size of bankroll to deploy. 
*Rule of thumb*: Use fractional/half Kelly ($f^* / 2$) to account for variance!`;
      } else {
        reply += `**Quantitative Trading Rule of Five (Risk Management):**
*   **A - Asset Matching**: Pair commodities with indices (eg. NAS100 + XAUUSD) to diversify leverage correlation.
*   **B - Leverage Cap**: Keep active leverage under **1:20** relative to capital weight to protect from rapid slippage.
*   **C - Compounding**: Re-invest trading profits to compound the balance margin while keeping stop-losses strict.
*   **D - News Isolation**: Do not place high-lot market orders 5 minutes before or after high-impact FOMC / NFP releases.
*   **E - Drawdown Ceiling**: Cut open trades manually if your daily loss reaches 3.5% to preserve compliance buffer.

Let me know if you would like me to generate a quantitative math model or PineScript strategy for these rules!`;
      }

      setTimeout(() => {
        setAiChats(prev => [...prev, { role: "model", text: reply }]);
      }, 700);
    } finally {
      setAiLoading(false);
    }
  };

  // Quick Chat Suggestion Trigger
  const handleQuickChatPreset = (preset: string) => {
    setAiInput(preset);
  };

  // Support Ticket Submission Handler
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;
    setTicketStatus("Ticket successfully created! Our engineering team will review within 2 hours.");
    setTicketSubject("");
    setTicketDesc("");
    setTimeout(() => {
      setTicketStatus("");
    }, 8000);
  };

  // Checklist compliance evaluator
  const passedDailyLoss = !isDailyViolated;
  const passedMaxOverall = !isOverallViolated;
  const passedProfitTarget = activeEquity >= (activeAccount.initialBalance * 1.08);

  // Leaderboard static detailed items
  const LEADERBOARD_LIST = [
    { rank: 1, name: "CryptoRaven", funded: "$1.2M", gain: "+24.5%", winRate: "72.4%", favor: "XAUUSD", country: "United States", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvJmJwS_EPETzM4VJ61iWbn1Ek8ZlzvVvhSSqMosUGhhnavle12Wn8VZPUvLom-OaZ7wAew3eDAqvh_81pnon5QjcWAkQqtA3y9Ib3dwUkhbwRXA_Y_Rj7JgSZgm4_CnPTVEmVLPzcoGt2rQnlG1VolHNP7ew8gB2sRw7BripPXypHT9iovT5X-figgfWguEutOaIQGoS7K8qrOIA-O_8hMvMMbbmdE9zP65jSUrpfYwrHa2OeNNKWssDyEusL7i_pKLo5PkDBTTQn" },
    { rank: 2, name: "AlphaWolf_99", funded: "$500k", gain: "+18.2%", winRate: "66.8%", favor: "NAS100", country: "Germany", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfuY50Lw2_vccLBygJMTBRV-XCk598xa5A1GoCe94keLs7PnaAag_lMVjNCanPYU6RrGDSI9YwxVGXWpE2_6B_syG533qvz9xUtRAQb1olNrZkW6qRSo4vBPlOztYVV70lsZdrjBsMucHgWTcMOxltXhjb-_GDuxuUZZqPx0oUGkVeL8JcY2Y-SOAIQ4lnXcjzO2OdXBIaa0YuXAKzXjKaUdynjQfQW7I96o2o-XWiRzIzEDKqJJS4lVFd0jaP9DrfnDk7O_VzBrgh" },
    { rank: 3, name: "QuantFT", funded: "$200k", gain: "+14.9%", winRate: "68.2%", favor: "EURUSD", country: "United Kingdom", avatar: "" },
    { rank: 4, name: "NeuralScalper", funded: "$100k", gain: "+11.7%", winRate: "61.3%", favor: "BTCUSD", country: "Singapore", avatar: "" },
    { rank: 5, name: "ApexAlpha", funded: "$200k", gain: "+9.4%", winRate: "59.5%", favor: "NAS100", country: "Canada", avatar: "" },
    { rank: 6, name: "DeltaHedge", funded: "$100k", gain: "+8.1%", winRate: "64.0%", favor: "XAUUSD", country: "Switzerland", avatar: "" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      
      {/* 1. TOP NAVIGATION BAR */}
      <nav id="top-navbar" className="fixed top-0 w-full z-50 bg-[#0c0c0c]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center h-16 px-6 md:px-8">
        <div id="nav-brand" className="flex items-center gap-2">
          <span className="p-1 pb-1.5 bg-[#D1FF26] text-black font-black uppercase tracking-widest text-[9px] italic flex items-center justify-center">
            LIVE™
          </span>
          <span className="font-sans text-lg md:text-xl font-black tracking-[0.15em] uppercase text-white hover:text-[#D1FF26] cursor-pointer duration-150">
            ALPHAFLOW<span className="text-[#D1FF26]">_PRO</span>
          </span>
        </div>

        {/* Global tab buttons - visible on medium screens+ */}
        <div id="nav-links" className="hidden md:flex items-center gap-8">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "challenges", label: "Challenges" },
            { id: "payouts", label: "Payouts" },
            { id: "rules", label: "Rules" },
            { id: "leaderboard", label: "Leaderboard" },
            { id: "alpha-ai", label: "AlphaAI Desk" }
          ].map(tab => (
            <button
              id={`tab-btn-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-200 pb-1 relative ${
                activeTab === tab.id 
                  ? "text-[#D1FF26] font-black border-b border-[#D1FF26]" 
                  : "text-white/60 hover:text-[#D1FF26]"
              }`}
            >
              {tab.label}
              {tab.id === "alpha-ai" && (
                <span className="absolute -top-3.5 -right-5 bg-[#D1FF26] text-[8px] text-black px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest scale-85 animate-pulse">
                  AI
                </span>
              )}
            </button>
          ))}
        </div>

        {/* User Stats and controls */}
        <div id="nav-actions" className="flex items-center gap-4">
          {/* Simulated balance/account credits widget */}
          <div id="account-wallet" className="hidden lg:flex items-center gap-2 bg-[#111111] border border-white/10 rounded px-3 py-1.5 text-xs font-mono">
            <Wallet className="w-3.5 h-3.5 text-[#D1FF26]" />
            <span className="text-white/40 uppercase font-bold text-[9px] tracking-wider">Portal Wallet:</span>
            <span className="text-[#D1FF26] font-extrabold">$1,450.00 MOCK</span>
          </div>

          <button id="noti-bell-btn" className="p-2 text-white/65 hover:text-[#D1FF26] active:scale-95 duration-100 relative rounded bg-[#111111] border border-white/10">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D1FF26] animate-pulse"></span>
          </button>

          <button 
            id="profile-toggle"
            onClick={() => setActiveTab("settings")}
            className="flex items-center gap-2 focus:outline-none p-1 rounded hover:bg-white/5"
          >
            <div className="w-8 h-8 rounded bg-[#D1FF26] text-black flex items-center justify-center font-black text-xs border border-white/10">
              {avatarInitials}
            </div>
            <span className="hidden sm:inline text-xs text-white font-bold font-mono uppercase tracking-wider">{traderName}</span>
          </button>
        </div>
      </nav>

      {/* 2. MAIN LAYOUT AND SIDEBAR */}
      <div className="pt-16 pb-20 md:pb-6 flex min-h-screen">
        
        {/* Left Sidebar - hidden on mobile, pinned on desktop */}
        <aside id="sidebar-panel" className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-64px)] w-64 z-40 bg-[#0d0d0d] border-r border-white/10 flex-col py-6 px-4 justify-between">
          <div className="flex flex-col gap-6">
            
            {/* Active Account Frame selector */}
            <div id="account-[selector]" className="flex flex-col gap-2 p-3 rounded bg-[#111111] border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D1FF26]/5 rounded-full filter blur-xl"></div>
              
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] tracking-[0.15em] font-mono font-bold uppercase text-white/50">Active Trading Account</span>
                <span className={`w-2 h-2 rounded-full ${isAccountViolated ? "bg-[#e61b56]" : "bg-[#D1FF26]"} animate-pulse`}></span>
              </div>
              
              <select
                id="active-account-select"
                value={activeAccountIdx}
                onChange={(e) => {
                  setActiveAccountIdx(parseInt(e.target.value));
                  setPositions([]); // Clear positions relative to other mock accounts
                }}
                className="w-full bg-[#1b1b1b] cursor-pointer text-sm font-mono text-[#D1FF26] font-bold border border-white/10 rounded px-2.5 py-1 focus:ring-1 focus:ring-[#D1FF26] outline-none"
              >
                {accounts.map((acc, idx) => (
                  <option key={acc.id} value={idx}>
                    {acc.id} - {acc.tierName}
                  </option>
                ))}
              </select>

              <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-1.5 text-[10px] font-mono text-white/60">
                <span className="uppercase tracking-wider">Tgt: 8%</span>
                <span className="text-white font-bold">${(activeAccount.initialBalance * 1.08).toLocaleString()}</span>
              </div>
            </div>

            {/* Navigation vertical list */}
            <nav id="nav-vertical-menu" className="flex flex-col gap-1.5">
              {[
                { id: "dashboard", label: "Dashboard", icon: Activity },
                { id: "challenges", label: "Challenges", icon: Award },
                { id: "payouts", label: "Payouts & Gains", icon: DollarSign },
                { id: "rules", label: "Trading Rules", icon: Shield },
                { id: "leaderboard", label: "Leaderboard", icon: Star },
                { id: "alpha-ai", label: "AlphaAI Advisor", icon: Bot },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    id={`sidebar-link-${item.id}`}
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded text-[10px] font-mono font-black uppercase tracking-[0.16em] transition-all duration-200 cursor-pointer ${
                      activeTab === item.id 
                        ? "text-[#D1FF26] bg-[#D1FF26]/10 border-r-2 border-[#D1FF26]" 
                        : "text-white/60 hover:bg-[#111111] hover:text-[#D1FF26]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <button 
              id="new-challenge-btn-sidebar"
              onClick={() => setActiveTab("challenges")}
              className="w-full bg-[#D1FF26] hover:bg-white text-black font-mono font-black italic text-xs tracking-[0.2em] py-3.5 px-4 rounded flex items-center justify-center gap-2 duration-150 active:scale-95 uppercase neon-glow-blue border border-[#D1FF26] hover:border-white transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-black" />
              New Challenge
            </button>
          </div>

          <div id="footer-actions-panel" className="flex flex-col gap-1.5 border-t border-white/10 pt-4">
            <button 
              id="support-btn-sidebar"
              onClick={() => setActiveTab("support")}
              className={`flex items-center gap-3 px-3.5 py-2 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-[#c2c6d7] hover:bg-[#111111] hover:text-[#D1FF26] transition-all cursor-pointer ${activeTab === "support" ? "text-[#D1FF26] bg-white/5" : ""}`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Developer Support</span>
            </button>
            <button 
              id="settings-btn-sidebar"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-3 px-3.5 py-2 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-[#c2c6d7] hover:bg-[#111111] hover:text-[#D1FF26] transition-all cursor-pointer ${activeTab === "settings" ? "text-[#D1FF26] bg-white/5" : ""}`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Trader Settings</span>
            </button>
          </div>
        </aside>

        {/* 3. MAIN DASHBOARD CONTENT SCROLL CONTAINER */}
        <main id="main-content-canvas" className="flex-1 pt-4 md:pl-72 px-4 md:pr-8 overflow-y-auto pb-24 md:pb-12">
          
          {/* HEADER CHRON_STRIP: Instant trust indicator matching mockup */}
          <section id="instant-trust-strip" className="w-full bg-[#0c0c0c] border border-white/10 rounded px-4 md:px-6 py-3.5 mb-6 flex flex-wrap justify-between items-center gap-4 relative overflow-hidden glass-stroke">
            <div className="absolute inset-0 bg-gradient-to-r from-[#D1FF26]/5 to-transparent pointer-events-none"></div>
            
            <div id="strip-metrics" className="flex gap-8 items-center z-10">
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-white/55 uppercase tracking-[0.2em] font-black">Live Payouts</span>
                <span className="font-mono text-base md:text-xl font-black text-[#D1FF26] italic">
                  ${livePayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-[10px] text-white/40 ml-1.5 font-sans normal-case not-italic font-medium">processed today</span>
                </span>
              </div>
              
              <div className="w-px h-8 bg-white/10"></div>
              
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-white/55 uppercase tracking-[0.2em] font-black">Active Pro Traders</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base md:text-xl font-black text-white italic">{liveTraders.toLocaleString()}</span>
                  <span className="flex h-2.5 w-2.5 rounded bg-[#D1FF26] animate-pulse"></span>
                </div>
              </div>
            </div>

            <div id="strip-activity" className="hidden lg:flex items-center gap-4 z-10">
              <div className="flex -space-x-2.5">
                <div className="w-7 h-7 rounded border border-white/20 bg-[#151515] flex items-center justify-center text-[10px] font-black">CR</div>
                <div className="w-7 h-7 rounded border border-white/20 bg-white text-black flex items-center justify-center text-[10px] font-black">AW</div>
                <div className="w-7 h-7 rounded border border-[#D1FF26]/40 bg-[#D1FF26]/20 flex items-center justify-center text-[10px] text-[#D1FF26] font-black">PT</div>
              </div>
              <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest font-bold">Global Community Activity: <span className="text-[#D1FF26] font-black italic">MAX ADVANCE</span></span>
            </div>
          </section>

          {/* DYNAMIC SCREEN SWITCHER */}
          {activeTab === "dashboard" && (
            <div id="screen-dashboard-grid" className="grid grid-cols-12 gap-6">
              
              {/* MAIN METRIC ANALYSIS AREA (LEFT: 8 COLS) */}
              <div id="col-dash-main" className="col-span-12 xl:col-span-8 flex flex-col gap-6">
                
                {/* EQUITY CHART CARD */}
                <div id="equity-chart-card" className="glass-card rounded p-5 md:p-6 flex flex-col min-h-[460px] relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-[#D1FF26]"></div>
                  
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6 relative z-10">
                    <div>
                      <h2 className="font-sans text-3xl font-black tracking-tighter uppercase text-white">Equity Performance</h2>
                      <p className="text-[10px] text-white/50 font-mono uppercase tracking-[0.15em] mt-1">Real-time portfolio growth and strict compliance drawdowns</p>
                    </div>
                    <div className="flex gap-1.5 bg-[#151515] p-1 border border-white/10 rounded">
                      {["1D", "1W", "1M", "ALL"].map(tf => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`font-mono text-[10px] px-3 py-1 rounded transition-colors uppercase tracking-wider cursor-pointer ${
                            timeframe === tf 
                              ? "bg-[#D1FF26] text-black font-black" 
                              : "text-white/60 hover:text-[#D1FF26]"
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SVG Responsive Line chart wrapper matching mockup */}
                  <div className="flex-1 w-full flex items-end relative min-h-[220px] mb-4">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                      <TrendingUp className="w-48 h-48 text-[#D1FF26]" />
                    </div>
                    
                    {/* SVG Curve rendering */}
                    <div className="w-full h-full">
                      <svg className="w-full h-full" viewBox="0 0 720 220" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradientSpec" x1="0%" x2="0%" y1="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: "#D1FF26", stopOpacity: 0.25 }}></stop>
                            <stop offset="100%" style={{ stopColor: "#D1FF26", stopOpacity: 0 }}></stop>
                          </linearGradient>
                        </defs>
                        {/* Shaded Area under path */}
                        <path 
                          d={`M0,180 
                              Q90,160 180,175 
                              T360,135 
                              T540,90 
                              T720,40
                              L720,220 L0,220 Z`} 
                          fill="url(#chartGradientSpec)"
                        ></path>
                        {/* Main Glowing Path */}
                        <path 
                          className="neon-glow-blue" 
                          d={`M0,180 
                              Q90,160 180,175 
                              T360,135 
                              T540,90 
                              T720,40`} 
                          fill="none" 
                          stroke="#D1FF26" 
                          strokeWidth="3.5"
                        ></path>
                      </svg>
                    </div>

                    {/* Interactive hover trace circle */}
                    <span className="absolute top-[40px] right-3.5 w-3.5 h-3.5 rounded-full bg-[#D1FF26] border-2 border-black shadow-[0_0_10px_#D1FF26] animate-ping"></span>
                    <span className="absolute top-[40px] right-3.5 w-3.5 h-3.5 rounded-full bg-[#D1FF26] border-2 border-white shadow-[0_0_10px_#D1FF26]"></span>
                  </div>

                  {/* Summary Metric Ribbon below chart */}
                  <div className="mt-auto pt-4 border-t border-white/10 flex flex-wrap justify-between items-center gap-4 z-10">
                    <div>
                      <p className="font-mono text-[9px] text-white/50 uppercase tracking-widest font-bold">Current Equity</p>
                      <p className="font-mono text-xl text-[#D1FF26] font-black italic">
                        ${activeEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-white/50 uppercase tracking-widest font-bold">Locked Balance</p>
                      <p className="font-mono text-lg text-white font-bold">
                        ${activeAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-white/50 uppercase tracking-widest font-bold">Floating Profit</p>
                      <p className={`font-mono text-lg font-black flex items-center gap-1 ${floatingProfit >= 0 ? "text-[#D1FF26]" : "text-[#e61b56]"}`}>
                        {floatingProfit >= 0 ? "+" : ""}
                        ${floatingProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* COMBINED EXECUTION PANEL & LIVE POSITIONS SECTION */}
                <div id="execution-and-positions-block" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* LIVE OPEN POSITIONS (ACTIVE EXECUTION) */}
                  <div id="live-positions-card" className="glass-card rounded overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-[#0c0c0c]">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded bg-[#D1FF26] animate-pulse"></span>
                        <h3 className="font-sans text-xs uppercase tracking-widest font-black text-white">Open Positions ({positions.length})</h3>
                      </div>
                      <span className="font-mono text-[9px] text-[#D1FF26] bg-[#D1FF26]/10 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Live Feeds
                      </span>
                    </div>

                    <div className="flex-1 p-4 flex flex-col gap-3 min-h-[220px]">
                      {positions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white/60">
                          <Info className="w-8 h-8 text-white/20 mb-2" />
                          <p className="text-xs font-mono font-bold uppercase tracking-wider">No active positions</p>
                          <p className="text-[10px] opacity-70 mt-1 max-w-[200px]">Use the Quantitative Order Desk to deploy mock trade capital.</p>
                        </div>
                      ) : (
                        positions.map(pos => {
                          const profit = getPosProfit(pos);
                          return (
                            <div key={pos.id} className="p-3 bg-[#111111] border border-white/10 rounded flex justify-between items-center relative overflow-hidden group">
                              <div className="absolute left-0 top-0 h-full w-[3px] bg-[#D1FF26]"></div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-bold text-white">{pos.asset}</span>
                                  <span className={`font-mono text-[9px] px-1.5 rounded font-black ${pos.type === "BUY" ? "bg-[#D1FF26]/15 text-[#D1FF26]" : "bg-[#e61b56]/20 text-[#e61b56]"}`}>
                                    {pos.type}
                                  </span>
                                  <span className="font-mono text-[10px] text-white/60">{pos.size} Lots</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-white/60">
                                  <span>Ent: {pos.entryPrice}</span>
                                  <span>→</span>
                                  <span className="text-white font-bold">{pos.currentPrice}</span>
                                </div>
                              </div>

                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <p className={`font-mono text-xs font-bold leading-none ${profit >= 0 ? "text-[#D1FF26]" : "text-[#e61b56]"}`}>
                                    {profit >= 0 ? "+" : ""}
                                    ${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </p>
                                  <span className="text-[8px] font-mono text-white/40 uppercase">{pos.timestamp}</span>
                                </div>
                                <button
                                  id={`close-pos-btn-${pos.id}`}
                                  onClick={() => handleClosePosition(pos.id)}
                                  className="bg-[#e61b56]/20 hover:bg-[#e61b56] text-[#e61b56] hover:text-white px-2.5 py-1.5 rounded font-mono font-bold text-[10px] uppercase transition-colors duration-150 active:scale-95 cursor-pointer"
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* HIGH-RATE QUANTITATIVE ORDER DESK */}
                  <div id="quick-trading-desk-card" className="glass-card rounded overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-white/10 bg-[#0c0c0c] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#D1FF26]" />
                        <h3 className="font-sans text-xs uppercase tracking-widest font-black text-white">Execution Desk</h3>
                      </div>
                      <span className="text-[9px] font-mono uppercase font-bold text-white/40 tracking-wider">Prime Liquidity v40</span>
                    </div>

                    <form id="trade-desk-form" onSubmit={handleExecuteTrade} className="p-4 flex flex-col gap-3 flex-grow">
                      <div>
                        <label className="block text-[9px] font-mono text-white/50 font-black uppercase tracking-widest mb-1">Asset Instrument</label>
                        <div className="grid grid-cols-4 gap-1">
                          {Object.keys(ASSETS).map((symbol) => (
                            <button
                              id={`asset-select-btn-${symbol}`}
                              key={symbol}
                              type="button"
                              onClick={() => setTradeAsset(symbol)}
                              className={`border py-1.5 rounded font-mono text-[11px] transition-all cursor-pointer ${
                                tradeAsset === symbol 
                                  ? "bg-[#D1FF26] text-black border-[#D1FF26] font-black" 
                                  : "bg-[#111111] hover:bg-[#151515] text-white/60 border-white/10"
                              }`}
                            >
                              {symbol}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-mono text-white/55 font-black uppercase tracking-[0.16em] mb-1">Position Type</label>
                          <div className="grid grid-cols-2 gap-1 bg-[#111111] p-0.5 rounded border border-white/10">
                            <button
                              id="trade-type-buy-btn"
                              type="button"
                              onClick={() => setTradeType("BUY")}
                              className={`py-1 rounded font-mono text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                                tradeType === "BUY" 
                                  ? "bg-[#D1FF26] text-black font-black" 
                                  : "text-white/60 hover:text-white"
                              }`}
                            >
                              BUY
                            </button>
                            <button
                              id="trade-type-sell-btn"
                              type="button"
                              onClick={() => setTradeType("SELL")}
                              className={`py-1 rounded font-mono text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                                tradeType === "SELL" 
                                  ? "bg-[#e61b56] text-white font-black" 
                                  : "text-white/60 hover:text-white"
                              }`}
                            >
                              SELL
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono text-white/55 font-black uppercase tracking-[0.16em] mb-1">Volume (Lots)</label>
                          <input
                            id="trade-size-input"
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="50"
                            value={tradeSize}
                            onChange={(e) => setTradeSize(parseFloat(e.target.value) || 1)}
                            className="w-full bg-[#111111] focus:bg-[#151515] border border-white/10 focus:border-[#D1FF26] rounded px-3 py-1 font-mono text-[#D1FF26] text-xs font-bold outline-none"
                          />
                        </div>
                      </div>

                      <div className="text-[9px] font-mono bg-[#0c0c0c] p-2 rounded text-white/50 border border-white/10 flex justify-between tracking-wider uppercase">
                        <span>Est Profit Margin: $100/Point</span>
                        <span className="text-[#D1FF26] font-black">Standard Leverage</span>
                      </div>

                      <button
                        id="submit-order-btn"
                        type="submit"
                        disabled={executingOrder}
                        className={`w-full py-3 font-mono text-xs font-black tracking-[0.2em] rounded uppercase transition-all duration-150 active:scale-95 cursor-pointer italic ${
                          executingOrder 
                            ? "bg-[#222222] text-white/40 border border-white/10" 
                            : "bg-[#D1FF26] text-black hover:bg-white transition-all"
                        }`}
                      >
                        {executingOrder ? "TRANSMITTING..." : `EXECUTE MARKET ${tradeType}`}
                      </button>
                    </form>
                  </div>
                </div>

                {/* CURRENT EXECUTIONS HISTORICAL LOG */}
                <div id="executions-log-card" className="glass-card rounded overflow-hidden flex flex-col">
                  <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-[#0c0c0c]">
                    <h3 className="font-sans text-xs uppercase tracking-widest font-black text-white">Recent Executions</h3>
                    <button 
                      id="reset-account-sim-btn"
                      onClick={handleResetChallenge}
                      className="text-[9px] font-mono uppercase tracking-widest font-black text-[#D1FF26] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reset Simulation
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table id="dash-executions-table" className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#111111] border-b border-white/10">
                          <th className="px-5 py-2.5 font-mono text-[9px] uppercase text-white/40 tracking-widest font-black">Asset</th>
                          <th className="px-5 py-2.5 font-mono text-[9px] uppercase text-white/40 tracking-widest font-black">Type</th>
                          <th className="px-5 py-2.5 font-mono text-[9px] uppercase text-white/40 tracking-widest font-black">Size</th>
                          <th className="px-5 py-2.5 font-mono text-[9px] uppercase text-white/40 tracking-widest font-black">Entry Price</th>
                          <th className="px-5 py-2.5 font-mono text-[9px] uppercase text-white/40 tracking-widest font-black text-right">Profit/Loss</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-[11px] text-[#e2e2e8]">
                        {closedTrades.map(trade => (
                          <tr key={trade.id} className="hover:bg-white/5 transition-colors border-b border-white/10">
                            <td className="px-5 py-3 font-semibold text-white">{trade.asset}</td>
                            <td className="px-5 py-3">
                              <span className={`px-1.5 py-0.5 rounded font-black text-[9px] ${trade.type === "BUY" ? "bg-[#D1FF26]/15 text-[#D1FF26]" : "bg-[#e61b56]/20 text-[#e61b56]"}`}>
                                {trade.type}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-white/60">{trade.size}</td>
                            <td className="px-5 py-3 text-white/60">{trade.entryPrice}</td>
                            <td className={`px-5 py-3 text-right font-black ${trade.profit >= 0 ? "text-[#D1FF26]" : "text-[#e61b56]"}`}>
                              {trade.profit >= 0 ? "+" : ""}${trade.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* SIDEBAR PERFORMANCE / METRIC ALERTS COLUMN (RIGHT: 4 COLS) */}
              <div id="col-dash-sidebar" className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                
                {/* ACCOUNT STATS SUMMARY */}
                <div id="today-stats-card" className="glass-card rounded p-5 md:p-6 flex flex-col gap-4 relative">
                  <span className="absolute -top-3.5 -right-3 px-2 py-1 bg-[#D1FF26] text-black text-[8px] font-black uppercase tracking-widest italic">
                    Active Session
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-white/50 uppercase font-black tracking-widest">Today's P&L</span>
                    <TrendingUp className="w-5 h-5 text-[#D1FF26] animate-pulse" />
                  </div>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="font-sans text-3xl md:text-4xl font-extrabold text-[#D1FF26] italic tracking-tight">
                      +${todaySTotalPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="font-mono text-xs text-white/50 font-bold">
                      +{((todaySTotalPnL / activeAccount.initialBalance) * 100).toFixed(2)}%
                    </span>
                  </div>

                  {/* Progress gauge: Daily Loss limit */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center mb-1.5 font-mono text-[11px]">
                      <span className="text-white/60 uppercase tracking-wider font-bold">Daily Loss Limit Check</span>
                      <span className={`font-black ${passedDailyLoss ? "text-[#D1FF26]" : "text-[#e61b56]"}`}>
                        {dailyLossRemainingPct.toFixed(0)}% remaining
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#111111] rounded overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded transition-all duration-300 ${isDailyViolated ? "bg-[#e61b56]" : "bg-[#D1FF26] neon-glow-green"}`} 
                        style={{ width: `${dailyLossRemainingPct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-[9px] font-mono text-white/40 uppercase tracking-widest">
                      <span>Max: ${dailyLossLimitValue.toLocaleString()}</span>
                      <span>Today's loss: ${currentDailyLoss.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Drawdown Indicator gauge */}
                  <div className="mt-1">
                    <div className="flex justify-between items-center mb-1.5 font-mono text-[11px]">
                      <span className="text-white/60 uppercase tracking-wider font-bold">Max Drawdown Allocation</span>
                      <span className={`font-black ${passedMaxOverall ? "text-[#D1FF26]" : "text-[#e61b56]"}`}>
                        {passedMaxOverall ? "Safe Zone" : "Breached"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#111111] rounded overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-[#D1FF26]/40 rounded transition-all duration-300 animate-pulse"
                        style={{ width: `${Math.max(4, overallDrawdownPercentUsed)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-[9px] font-mono text-white/40 uppercase tracking-widest">
                      <span>Threshold: ${overallMaxDrawdownValue.toLocaleString()}</span>
                      <span>drawdown used: {overallDrawdownPercentUsed.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* MINI LEADERBOARD */}
                <div id="mini-leaderboard-card" className="glass-card rounded overflow-hidden flex flex-col">
                  <div className="px-5 py-3.5 bg-[#0c0c0c] border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-sans text-xs uppercase tracking-widest font-black text-white">Top Active Leaders</h3>
                    <button 
                      id="view-all-leaders-btn"
                      onClick={() => setActiveTab("leaderboard")}
                      className="text-[9px] font-mono font-black uppercase tracking-widest text-[#D1FF26] hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  
                  <div className="p-4 flex flex-col gap-4">
                    {LEADERBOARD_LIST.slice(0, 2).map((trader) => (
                      <div key={trader.rank} className="flex items-center gap-3">
                        <div className="relative">
                          {trader.avatar ? (
                            <img 
                              className="w-10 h-10 rounded object-cover border border-white/10" 
                              src={trader.avatar} 
                              alt={trader.name}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-[#111111] border border-white/10 flex items-center justify-center text-xs font-black text-[#D1FF26]">
                              {trader.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] ${
                            trader.rank === 1 ? "bg-[#D1FF26] text-black" : "bg-white/15 text-white"
                          }`}>
                            {trader.rank}
                          </div>
                        </div>

                        <div className="flex-1">
                          <p className="text-white text-xs font-bold leading-tight">{trader.name}</p>
                          <p className="text-[10px] text-white/50 font-mono">{trader.funded} Funded</p>
                        </div>

                        <div className="text-right">
                          <p className="text-[#D1FF26] font-mono text-xs font-black italic">{trader.gain}</p>
                          <p className="text-[8px] text-white/40 uppercase font-black font-mono tracking-wider">This Month</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RULES COMPLIANCE CONTAINER */}
                <div className="bg-[#D1FF26]/5 border border-[#D1FF26]/20 rounded p-5 flex flex-col gap-2.5">
                  <div className={`flex items-center gap-2 ${isAccountViolated ? "text-[#e61b56]" : "text-[#D1FF26]"}`}>
                    <Shield className="w-4.5 h-4.5" />
                    <span className="font-mono text-xs font-black uppercase tracking-[0.12em]">
                      Account Status: {isAccountViolated ? "VIOLATED" : "COMPLIANT"}
                    </span>
                  </div>
                  <p className="text-[12px] text-white/70 leading-relaxed font-sans">
                    {isAccountViolated 
                      ? "ALERT: Maximum daily limit or overall trailing drawdown value breached. Open orders are locked, and this account model is flagged." 
                      : "All quantitative prop firm evaluation limits are currently satisfied. No violations detected in the current live execution session."}
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* CHALLENGES TAB */}
          {activeTab === "challenges" && (
            <div id="screen-challenges" className="flex flex-col gap-6">
              <div className="text-center max-w-2xl mx-auto py-4">
                <span className="inline-block px-2 py-1 bg-[#D1FF26] text-black text-[9px] font-black uppercase tracking-widest mb-4 italic">
                  Featured Challenge Edition
                </span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white">Funded Evaluation Models</h2>
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/50 mt-1.5">
                  Purchase an evaluation trading account below, complete the quantitative profit target target, and claim live funded prop capital starting instantly.
                </p>
              </div>

              {challengeBought && (
                <div className="p-5 bg-[#D1FF26]/10 border border-[#D1FF26]/30 rounded text-center max-w-lg mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-[#D1FF26] mx-auto mb-2" />
                  <p className="text-sm font-black text-[#D1FF26] uppercase font-mono tracking-widest">Evaluation Provisioned Successfully</p>
                  <p className="text-xs text-white/80 mt-1 font-sans">
                    Your account has been funded, and added to your Dashboard switcher. Close this notify to start trading.
                  </p>
                  <button 
                    onClick={() => setChallengeBought(false)}
                    className="mt-3 bg-[#D1FF26] hover:bg-white text-black font-mono font-black italic text-[10px] tracking-[0.15em] px-4 py-2 rounded uppercase cursor-pointer transition-all duration-150"
                  >
                    Enter Dashboard
                  </button>
                </div>
              )}

              {/* Tier comparative cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
                {[
                  {
                    id: "starter",
                    name: "Starter Trader",
                    balance: 25000,
                    cost: 150,
                    lever: "1:100",
                    dailyLimit: "5%",
                    overallLimit: "10%",
                    popular: false
                  },
                  {
                    id: "executive",
                    name: "Executive Master",
                    balance: 50000,
                    cost: 280,
                    lever: "1:100",
                    dailyLimit: "5%",
                    overallLimit: "10%",
                    popular: false
                  },
                  {
                    id: "pro_tier",
                    name: "Quantitative Elite",
                    balance: 100000,
                    cost: 495,
                    lever: "1:100",
                    dailyLimit: "5%",
                    overallLimit: "10%",
                    popular: true
                  },
                  {
                    id: "alpha",
                    name: "Alpha Pro Model",
                    balance: 200000,
                    cost: 950,
                    lever: "1:50",
                    dailyLimit: "5%",
                    overallLimit: "10%",
                    popular: false
                  },
                ].map(tier => (
                  <div 
                    key={tier.id} 
                    className={`glass-card rounded p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:scale-102 ${
                      tier.popular ? "border-[#D1FF26] shadow-[0_0_20px_rgba(209,255,38,0.15)] bg-[#111111]/90" : "border-white/10"
                    }`}
                  >
                    {tier.popular && (
                      <span className="absolute top-2.5 right-2 text-[8px] bg-[#D1FF26] text-black px-2 py-0.5 rounded font-black uppercase tracking-widest font-mono">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <span className="text-[9px] font-mono tracking-[0.15em] text-white/50 uppercase font-bold">{tier.name}</span>
                      <h3 className="text-2xl font-black font-sans mt-1 text-white italic">${tier.balance.toLocaleString()}</h3>
                      
                      <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-white/50 uppercase text-[9px]">Target Leverage:</span>
                          <span className="text-white font-bold">{tier.lever}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 uppercase text-[9px]">Max Daily Limit:</span>
                          <span className="text-white font-bold">{tier.dailyLimit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 uppercase text-[9px]">Max Cumulative SL:</span>
                          <span className="text-white font-bold">{tier.overallLimit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 uppercase text-[9px]">Minimum Trading Days:</span>
                          <span className="text-[#D1FF26] font-bold">5 Days</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-baseline gap-1 mb-3.5">
                        <span className="text-2xl font-mono font-black text-[#D1FF26] italic">${promoApplied ? Math.round(tier.cost * 0.9) : tier.cost}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">ONE TIME FEE</span>
                      </div>
                      <button
                        id={`purchase-btn-${tier.id}`}
                        onClick={() => handlePurchaseChallenge(tier.id)}
                        className="w-full bg-[#D1FF26] hover:bg-white text-black font-mono font-black italic text-xs tracking-[0.2em] py-3 rounded uppercase duration-100 active:scale-95 cursor-pointer text-center block border border-[#D1FF26] hover:border-white transition-all"
                      >
                        Deploy Account
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo code area */}
              <div className="glass-card rounded p-5 max-w-md mx-auto w-full mt-4 flex items-center gap-3">
                <input
                  id="promo-code-input"
                  type="text"
                  placeholder="ENTER PROMO CODE_ (eg ALPHA10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="bg-[#111111] border border-white/10 rounded font-mono px-3 py-2 text-xs text-white uppercase flex-1 outline-none focus:border-[#D1FF26]"
                />
                <button
                  id="apply-promo-btn"
                  onClick={() => {
                    if (promoCode.trim().toUpperCase() === "ALPHA10") {
                      setPromoApplied(true);
                      alert("Coupon matched successfully! 10% Discount applied on all tier models.");
                    } else {
                      alert("Invalid promo code. Tip: Check the rules quiz to obtain code!");
                    }
                  }}
                  className="bg-[#111111] hover:bg-[#D1FF26] hover:text-black border border-white/15 px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider text-white cursor-pointer transition-all duration-150"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* PAYOUTS VIEW */}
          {activeTab === "payouts" && (
            <div id="screen-payouts" className="grid grid-cols-12 gap-6">
              
              {/* Form panel */}
              <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
                <div className="glass-card rounded p-5 md:p-6 flex flex-col gap-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-[#D1FF26]"></div>
                  
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Request Profit Split</h2>
                    <p className="text-[10.5px] text-white/55 font-mono uppercase tracking-[0.14em] mt-1">Submit quantitative trading gains to your third-party payout channel</p>
                  </div>

                  <div className="bg-[#111111] p-4 rounded border border-white/10 flex justify-between items-center font-mono">
                    <div>
                      <span className="text-[9px] text-white/50 uppercase font-black tracking-widest">Withdrawal Eligible Profit Split</span>
                      <p className="text-xl font-black text-[#D1FF26] italic mt-0.5">
                        ${Math.max(0, activeEquity - activeAccount.initialBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <span className="text-[9px] bg-[#D1FF26]/10 text-[#D1FF26] border border-[#D1FF26]/20 font-black px-2.5 py-1 rounded uppercase tracking-widest">
                      85% Split
                    </span>
                  </div>

                  <form id="payout-request-form" onSubmit={handlePayoutRequest} className="flex flex-col gap-4 mt-2">
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 font-black uppercase tracking-widest mb-1">Amount to settle (USD)</label>
                      <input
                        id="payout-amount-input"
                        type="number"
                        placeholder="e.g. 2500"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="w-full bg-[#111111] border border-white/10 focus:border-[#D1FF26] rounded px-4 py-2.5 font-mono text-white text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-white/50 font-black uppercase tracking-widest mb-1">TRC-20 USDT Wallet Address</label>
                      <input
                        id="payout-address-input"
                        type="text"
                        placeholder="e.g. Tx89yHq0..."
                        value={payoutAddress}
                        onChange={(e) => setPayoutAddress(e.target.value)}
                        className="w-full bg-[#111111] border border-white/10 focus:border-[#D1FF26] rounded px-4 py-2.5 font-mono text-white text-xs font-bold outline-none"
                      />
                    </div>

                    <button
                      id="submit-payout-btn"
                      type="submit"
                      disabled={payoutRequestStatus === "submitting"}
                      className="w-full bg-[#D1FF26] hover:bg-white text-black font-mono font-black italic text-xs tracking-[0.2em] py-3.5 rounded uppercase cursor-pointer duration-150 active:scale-95 transition-all"
                    >
                      {payoutRequestStatus === "submitting" ? "COMPLIANCE REVIEW UNDERWAY..." : "Initiate Settlement Transfer"}
                    </button>
                  </form>

                  {payoutRequestStatus === "success" && (
                    <div className="p-3 bg-[#D1FF26]/10 border border-[#D1FF26]/30 rounded text-center text-xs text-white">
                      Settlement submitted successfully! Audit reviews take 12 hours. Check history log panel on right.
                    </div>
                  )}
                </div>
              </div>

              {/* History panel */}
              <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
                <div className="glass-card rounded overflow-hidden flex flex-col h-full min-h-[300px]">
                  <div className="px-5 py-4 border-b border-white/10 bg-[#0c0c0c]">
                    <h3 className="font-sans text-xs uppercase tracking-widest font-black text-white">Accrued Payout Log</h3>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    {payoutLogs.map((log, pidx) => (
                      <div key={pidx} className="p-3.5 bg-[#111111] border border-white/10 rounded flex justify-between items-center font-mono">
                        <div>
                          <p className="text-white text-xs font-black italic">${log.amount.toLocaleString()}</p>
                          <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">{log.type} // {log.date}</span>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded font-black uppercase tracking-wider ${
                          log.status === "Completed" ? "bg-[#D1FF26]/10 text-[#D1FF26] border border-[#D1FF26]/20" : "bg-white/10 text-white animate-pulse"
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TRADING RULES TAB */}
          {activeTab === "rules" && (
            <div id="screen-rules" className="grid grid-cols-12 gap-6">
              
              <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
                <div className="glass-card rounded p-5 md:p-6 flex flex-col gap-4">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white">Prop Compliance Specifications</h2>
                  <p className="text-xs text-white/60">
                    Maintaining strict risk parameters is crucial for quant operations. Read our exact drawdown conditions.
                  </p>

                  <div className="flex flex-col gap-4 mt-2">
                    {[
                      {
                        title: "1. Maximum Daily Loss Limit (5%)",
                        desc: "Your daily equity drawdown cannot cross below 5% of previous day's settled ending balance. This cushion resets daily at 5:00 PM EST.",
                        pass: passedDailyLoss
                      },
                      {
                        title: "2. Maximum Overall Cumulative Drawdown (10%)",
                        desc: "Your net equity may never drop below 10% of initially funded size. Crossing below this triggers absolute failure.",
                        pass: passedMaxOverall
                      },
                      {
                        title: "3. Minimum 5 Evaluation Trading Days",
                        desc: "You must execute simulated trades across at least 5 individual calendar days to qualify for funding audit.",
                        pass: true
                      },
                      {
                        title: "4. No News Abuse Period",
                        desc: "Avoid executing high-volume lots 5 minutes prior to and following high-impact releases (eg, US Non-Farm Payrolls).",
                        pass: true
                      },
                    ].map((rule, idx) => (
                      <div key={idx} className="p-4 bg-[#111111] border border-white/10 rounded flex gap-3.5 relative overflow-hidden">
                        <div className={`w-[3px] absolute left-0 top-0 h-full ${rule.pass ? "bg-[#D1FF26]" : "bg-[#e61b56]"}`}></div>
                        <span className="p-2 rounded bg-white/5 flex items-center justify-center self-start text-[#D1FF26]">
                          <Shield className="w-4.5 h-4.5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs uppercase tracking-wider font-extrabold text-white">{rule.title}</h4>
                            <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                              rule.pass ? "bg-[#D1FF26]/10 text-[#D1FF26] border border-[#D1FF26]/20" : "bg-[#e61b56]/20 text-[#e61b56]"
                            }`}>
                              {rule.pass ? "Passed" : "Breached"}
                            </span>
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed mt-1 font-sans">{rule.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RULES COMPLIANCE KNOWLEDGE QUIZ */}
              <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                <div className="glass-card rounded p-5 md:p-6 flex flex-col gap-4 relative">
                  <div>
                    <h3 className="font-sans text-xs uppercase tracking-widest font-black text-white">Evaluation Risk Quiz</h3>
                    <p className="text-[10px] text-[#D1FF26] font-black uppercase tracking-wider mt-0.5">Solve correctly to unlock 10% Discount Code!</p>
                  </div>

                  {!quizAnswered ? (
                    <div className="flex flex-col gap-3 font-sans text-xs">
                      <p className="text-white font-semibold">
                        Q: If you start with a $100,000 account, what is the exact equity floor you cannot breach on Day 1 under the Daily Loss Rule?
                      </p>
                      <div className="flex flex-col gap-1.5 mt-1.5 font-mono">
                        {[
                          { text: "A) $94,000 Equity", key: 0 },
                          { text: "B) $95,000 Equity", key: 1, correct: true },
                          { text: choiceText => "C) $90,000 Equity", key: 2 }, // keeping choices standard
                          { text: "D) Depends on floating profit", key: 3 },
                        ].map((choice, cidx) => {
                          const displayLabel = cidx === 2 ? "C) $90,000 Equity" : choice.text;
                          return (
                            <button
                              key={choice.key}
                              type="button"
                              onClick={() => {
                                if (choice.key === 1) { // Choice B is correct index
                                  setQuizScore(1);
                                } else {
                                  setQuizScore(0);
                                }
                                setQuizAnswered(true);
                              }}
                              className="bg-[#111111] hover:bg-[#D1FF26] hover:text-black p-2.5 rounded text-left border border-white/10 text-white/70 transition-all cursor-pointer font-bold duration-150"
                            >
                              {displayLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center font-sans py-4">
                      {quizScore === 1 ? (
                        <div>
                          <Award className="w-10 h-10 text-[#D1FF26] mx-auto mb-2" />
                          <p className="text-sm font-black text-[#D1FF26] uppercase font-mono tracking-widest">100% Score! Passed</p>
                          <p className="text-xs text-white/50 mt-1">Here is your custom Discount Promo Code:</p>
                          <div className="mt-3 py-2 px-4 bg-[#D1FF26]/10 text-[#D1FF26] font-mono text-lg font-black tracking-widest rounded select-all select-text selection:bg-[#D1FF26] border border-dashed border-[#D1FF26]">
                            ALPHA10
                          </div>
                        </div>
                      ) : (
                        <div>
                          <XCircle className="w-10 h-10 text-[#e61b56] mx-auto mb-2" />
                          <p className="text-sm font-black text-[#e61b56] uppercase font-mono tracking-widest">Failed Risk Review</p>
                          <p className="text-xs text-white/60 mt-1">Breaching the loss cushion drops equity below $95,000 Floor.</p>
                          <button 
                            onClick={() => setQuizAnswered(false)}
                            className="mt-3 text-xs bg-[#D1FF26] hover:bg-white text-black font-mono font-black italic px-4 py-2 rounded uppercase cursor-pointer tracking-widest transition-all"
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* EXPANDED SEARCHABLE LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <div id="screen-leaderboard" className="flex flex-col gap-6">
              
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white">Prop Firm World Standings</h2>
                  <p className="text-xs text-white/50 font-mono uppercase tracking-[0.15em] mt-1">Detailed rankings of elite proprietary managers making positive splits</p>
                </div>

                {/* Search control */}
                <div className="bg-[#111111] border border-white/10 rounded py-1.5 px-3 flex items-center gap-2 max-w-sm w-full">
                  <Search className="w-4 h-4 text-white/40" />
                  <input
                    id="leaderboard-search-input"
                    type="text"
                    placeholder="Search trader..."
                    value={leaderboardSearch}
                    onChange={(e) => setLeaderboardSearch(e.target.value)}
                    className="bg-transparent border-none text-xs text-white placeholder-white/30 outline-none flex-1 font-mono focus:ring-0"
                  />
                </div>
              </div>

              {selectedLeader && (
                <div className="p-5 bg-[#111111] border border-[#D1FF26]/30 rounded relative overflow-hidden">
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button 
                      onClick={() => setSelectedLeader(null)}
                      className="text-white hover:text-black hover:bg-[#D1FF26] text-[9px] font-mono uppercase tracking-widest font-black cursor-pointer bg-white/10 px-2 py-1 rounded transition-all"
                    >
                      Close Profile Box
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row gap-5 items-center">
                    {selectedLeader.avatar ? (
                      <img 
                        className="w-16 h-16 rounded object-cover border-2 border-[#D1FF26]" 
                        src={selectedLeader.avatar} 
                        alt={selectedLeader.name}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-[#222] border-2 border-[#D1FF26] flex items-center justify-center text-lg font-black text-[#D1FF26]">
                        {selectedLeader.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-black uppercase italic text-white flex items-center gap-2">
                        {selectedLeader.name} 
                        <span className="text-[9px] bg-[#D1FF26]/10 text-[#D1FF26] border border-[#D1FF26]/20 px-2.5 py-0.5 rounded font-mono font-black">Rank #{selectedLeader.rank}</span>
                      </h3>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mt-1">Location: {selectedLeader.country} // Favorite instrument: {selectedLeader.favor}</p>
                      
                      <div className="grid grid-cols-3 gap-6 mt-3 text-xs font-mono border-t border-white/10 pt-3">
                        <div>
                          <span className="text-[9px] text-white/40 uppercase tracking-widest">Funded Tier</span>
                          <p className="text-white font-black italic mt-0.5">{selectedLeader.funded}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-white/40 uppercase tracking-widest">Monthly Gain</span>
                          <p className="text-[#D1FF26] font-black italic mt-0.5">{selectedLeader.gain}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-white/40 uppercase tracking-widest">Win Rate</span>
                          <p className="text-white font-black italic mt-0.5">{selectedLeader.winRate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid block of leaders */}
              <div className="glass-card rounded overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table id="full-leaderboard-table" className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0c0c0c] border-b border-white/10">
                        <th className="px-5 py-3.5 font-mono text-[9px] uppercase text-white/40 tracking-widest font-black">Rank</th>
                        <th className="px-5 py-3.5 font-mono text-[9px] uppercase text-white/40 tracking-widest font-black">Trader</th>
                        <th className="px-5 py-3.5 font-mono text-[9px] uppercase text-white/40 tracking-widest font-black">Authorized Tier</th>
                        <th className="px-5 py-3.5 font-mono text-[9px] uppercase text-white/40 tracking-widest font-black">Win Rate</th>
                        <th className="px-5 py-3.5 font-mono text-[9px] uppercase text-white/40 tracking-widest font-black">Preference</th>
                        <th className="px-5 py-3.5 font-mono text-[9px] uppercase text-white/40 tracking-widest font-black text-right">Accrued Return</th>
                      </tr>
                    </thead>
                    <tbody className="font-sans text-xs">
                      {LEADERBOARD_LIST.filter(l => l.name.toLowerCase().includes(leaderboardSearch.toLowerCase())).map(leader => (
                        <tr 
                          key={leader.rank} 
                          className="hover:bg-white/5 transition-colors border-b border-white/10 cursor-pointer"
                          onClick={() => setSelectedLeader(leader)}
                        >
                          <td className="px-5 py-4 font-mono font-black text-[#D1FF26]">{leader.rank}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {leader.avatar ? (
                                <img 
                                  className="w-8 h-8 rounded object-cover border border-white/10" 
                                  src={leader.avatar} 
                                  alt={leader.name}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded bg-[#222] flex items-center justify-center text-[10px] font-black text-[#D1FF26]">
                                  {leader.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-white">{leader.name}</p>
                                <span className="text-[10px] text-white/45 font-mono uppercase tracking-widest">{leader.country}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono text-white/60">{leader.funded}</td>
                          <td className="px-5 py-4 font-mono text-white/60">{leader.winRate}</td>
                          <td className="px-5 py-4 font-mono text-[#D1FF26]/80 font-bold">{leader.favor}</td>
                          <td className="px-5 py-4 font-mono text-right font-black italic text-[#D1FF26]">{leader.gain}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ALPHAAI EXCLUSIVE CHAT ASSISTANT TAB */}
          {activeTab === "alpha-ai" && (
            <div id="screen-alpha-ai" className="glass-card rounded p-5 md:p-6 flex flex-col h-[520px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[#D1FF26]"></div>
              
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
                <span className="p-2 bg-[#D1FF26]/10 border border-[#D1FF26]/20 rounded text-[#D1FF26] flex items-center justify-center">
                  <Bot className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h2 className="text-sm font-sans font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    AlphaAI Advisor 
                    <span className="text-[8px] bg-[#D1FF26]/10 text-[#D1FF26] border border-[#D1FF26]/20 font-black uppercase tracking-widest px-2.5 py-0.5 rounded">QUANT v1.2</span>
                  </h2>
                  <p className="text-[10px] text-white/50 font-sans mt-0.5 uppercase tracking-wider">Powered secure high-frequency server integrations. Generates logic blocks instantly.</p>
                </div>
              </div>

              {/* Chat scrolling viewport */}
              <div id="ai-chat-scroller" className="flex-grow overflow-y-auto py-4 flex flex-col gap-4">
                {aiChats.map((chat, cidx) => (
                  <div key={cidx} className={`flex gap-3 max-w-[80%] ${chat.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}>
                    <div className={`p-2 rounded flex items-center justify-center h-8 w-8 self-end ${
                      chat.role === "user" ? "bg-[#D1FF26] text-black" : "bg-[#D1FF26]/10 text-[#D1FF26] border border-[#D1FF26]/20"
                    }`}>
                      {chat.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    
                    <div className={`p-3.5 rounded font-mono text-[11px] leading-relaxed whitespace-pre-wrap ${
                      chat.role === "user" ? "bg-[#D1FF26]/10 border border-[#D1FF26]/25 text-white" : "bg-[#111111] border border-white/10 text-white"
                    }`}>
                      {chat.text}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex gap-3 self-start max-w-[80%]">
                    <div className="p-2 rounded bg-[#D1FF26]/10 text-[#D1FF26] h-8 w-8 flex items-center justify-center animate-spin">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div className="p-3 bg-[#111111] border border-white/10 rounded font-mono text-[11px] text-white/50 italic animate-pulse">
                      Analyzing liquidity pools & drawdown constraints...
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef}></div>
              </div>

              {/* Suggestions Quick pills */}
              <div className="py-2 flex flex-wrap gap-1.5 border-t border-white/10 pt-3">
                {[
                  "Generate Pine Script Indicator Strategy",
                  "Formulate Kelly Criterion Excel calculator",
                  "Analyze Drawdown risk limits",
                ].map((pill, pidx) => (
                  <button
                    key={pidx}
                    onClick={() => handleQuickChatPreset(pill)}
                    className="bg-[#111111] hover:bg-[#D1FF26] hover:text-black border border-white/10 text-white/70 text-[9px] font-mono font-black uppercase tracking-wider px-3 py-1.5 rounded transition-all cursor-pointer"
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Chat Input form */}
              <form id="ai-chat-form" onSubmit={handleSendAiMessage} className="flex gap-2 items-center">
                <input
                  id="ai-text-input"
                  type="text"
                  placeholder="Ask AlphaAI regarding risk models, PineScript crossing scripts, excels..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="bg-[#111111] border border-white/10 focus:border-[#D1FF26] rounded px-4 py-2.5 font-sans text-xs text-white flex-1 outline-none"
                />
                <button
                  id="send-ai-btn"
                  type="submit"
                  className="bg-[#D1FF26] hover:bg-white text-black p-2.5 rounded cursor-pointer active:scale-95 duration-100 flex items-center justify-center border border-[#D1FF26] hover:border-white transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TRADER SETTINGS TAB */}
          {activeTab === "settings" && (
            <div id="screen-settings" className="glass-card rounded p-5 md:p-6 max-w-2xl mx-auto flex flex-col gap-5">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Trader Settings Profile</h2>
              
              <div className="flex flex-col gap-4 mt-2">
                <div>
                  <label className="block text-[11px] font-mono text-[#c2c6d7] font-bold uppercase mb-1">Trader Name (Display)</label>
                  <input
                    id="settings-name-input"
                    type="text"
                    value={traderName}
                    onChange={(e) => {
                      setTraderName(e.target.value);
                      if (e.target.value) setAvatarInitials(e.target.value.substring(0, 2).toUpperCase());
                    }}
                    className="w-full bg-[#111318] border border-[#424654]/50 focus:border-[#b2c5ff] rounded px-4 py-2 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#c2c6d7] font-bold uppercase mb-1">Leverage Constraint Cap</label>
                  <select
                    id="settings-leverage-select"
                    value={leverageCap}
                    onChange={(e) => setLeverageCap(e.target.value)}
                    className="w-full bg-[#111318] border border-[#424654]/50 rounded px-4 py-2 text-xs font-mono text-white outline-none"
                  >
                    <option value="1:100">1:100 Leverage (Default evaluation standard)</option>
                    <option value="1:50">1:50 Leverage (High margin conservative mode)</option>
                    <option value="1:20">1:20 Leverage (Strict risk limit model)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-mono text-[#c2c6d7] font-bold uppercase">Neon Glow Intensity</label>
                    <span className="font-mono text-xs text-[#60ff99]">{neonIntensity}%</span>
                  </div>
                  <input
                    id="settings-intensity-slider"
                    type="range"
                    min="10"
                    max="100"
                    value={neonIntensity}
                    onChange={(e) => setNeonIntensity(parseInt(e.target.value))}
                    className="w-full accent-[#2e6ff2]"
                  />
                </div>

                <div className="p-4 bg-[#111318] border border-[#424654]/25 rounded-lg text-xs leading-relaxed text-[#c2c6d7]">
                  Settings saved profile successfully in local session. Switch tabs to deploy trades or evaluate rules.
                </div>
              </div>
            </div>
          )}

          {/* DEVELOPER WORKSPACE SUPPORT TAB */}
          {activeTab === "support" && (
            <div id="screen-support" className="grid grid-cols-12 gap-6">
              
              <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
                <div className="glass-card rounded-xl p-5 md:p-6 flex flex-col gap-4">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#b2c5ff]">Create Support Case</h2>
                  <p className="text-xs text-[#c2c6d7]">Our quantitative risk desks analyze breaches and provide quick resolutions.</p>

                  <form id="support-ticket-form" onSubmit={handleCreateTicket} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-[#c2c6d7] font-bold uppercase mb-1">Ticket Subject</label>
                      <input
                        id="ticket-subject-input"
                        type="text"
                        placeholder="e.g. Drawdown discrepancy review"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        className="w-full bg-[#111318] border border-[#424654]/50 focus:border-[#b2c5ff] rounded px-4 py-2 text-xs font-mono text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#c2c6d7] font-bold uppercase mb-1">Description Details</label>
                      <textarea
                        id="ticket-desc-input"
                        rows={4}
                        placeholder="State your account standard issue details..."
                        value={ticketDesc}
                        onChange={(e) => setTicketDesc(e.target.value)}
                        className="w-full bg-[#111318] border border-[#424654]/50 focus:border-[#b2c5ff] text-white rounded px-4 py-2 text-xs font-sans outline-none"
                      />
                    </div>

                    <button
                      id="submit-ticket-btn"
                      type="submit"
                      className="w-full bg-[#2e6ff2] hover:bg-[#2e6ff2]/90 text-white font-mono font-bold text-xs py-2.5 rounded uppercase duration-100 active:scale-95"
                    >
                      Submit Ticket
                    </button>
                  </form>

                  {ticketStatus && (
                    <div className="p-3 bg-[#60ff99]/15 border border-[#60ff99]/40 rounded text-[11px] text-[#60ff99]">
                      {ticketStatus}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
                <div className="glass-card rounded-xl p-5 md:p-6 flex flex-col gap-4 h-full">
                  <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Frequently Asked Questions</h3>
                  
                  <div className="flex flex-col gap-3 text-xs">
                    {[
                      { q: "How fast are live payouts processed?", a: "Crypto USDT TRC20 is completed within 12 hours. Bank wires settlements take 24-48 business hours after prop audits." },
                      { q: "What happens if I fail the daily limit rule?", a: "Your evaluation account is instantly set to 'FAILED'. You can instantly purchase a reset or a new challenge starting tier." },
                      { q: "Is algorithmic algorithmic software (EAs) permitted?", a: "Yes. HFT software, execution scripts, and standard algorithmic expert advisors are fully authorized." },
                    ].map((faq, idx) => (
                      <div key={idx} className="p-3 bg-[#111318] rounded border border-[#424654]/15">
                        <strong className="text-white text-xs block">{faq.q}</strong>
                        <p className="text-[#c2c6d7] opacity-80 mt-1 leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* 4. BOTTOM MOBILE PORT NAVIGATION BAR */}
      <nav id="bottom-navbar" className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-4 pb-safe bg-[#111318]/95 backdrop-blur-md border-t border-[#424654]/50 shadow-lg z-50 rounded-t-xl">
        {[
          { id: "dashboard", label: "Dashboard", icon: Activity },
          { id: "challenges", label: "Challenges", icon: Award },
          { id: "payouts", label: "Payouts", icon: DollarSign },
          { id: "rules", label: "Rules", icon: Shield },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              id={`mobile-tab-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-lg cursor-pointer ${
                activeTab === item.id 
                  ? "bg-[#2e6ff2] text-white font-bold" 
                  : "text-[#c2c6d7] hover:bg-white/5"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="font-mono text-[9px] tracking-widest mt-1 uppercase font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
