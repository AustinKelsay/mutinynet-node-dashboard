import axios from "axios";
import type { AxiosInstance } from "axios";
import { connectionManager } from "./connectionManager";

// Types
interface NodeInfo {
  identity_pubkey: string;
  alias: string;
  num_active_channels: number;
  num_peers: number;
  block_height: number;
  block_hash: string;
  synced_to_chain: boolean;
  synced_to_graph: boolean;
  uris: string[];
  best_header_timestamp: string;
  version: string;
}

interface ChannelBalance {
  balance: string;
  pending_open_balance: string;
  local_balance?: {
    sat: string;
    msat: string;
  };
  remote_balance?: {
    sat: string;
    msat: string;
  };
}

interface Invoice {
  r_hash: string;
  payment_request: string;
  add_index: string;
  payment_addr: string;
}

interface PaymentResponse {
  payment_hash: string;
  payment_preimage: string;
  payment_route: {
    total_time_lock: number;
    total_fees: string;
    total_amt: string;
  };
}

interface Peer {
  pub_key: string;
  address: string;
  bytes_sent: string;
  bytes_recv: string;
  sat_sent: string;
  sat_recv: string;
  inbound: boolean;
  ping_time: string;
  sync_type: string;
}

interface ListPeersResponse {
  peers: Peer[];
}

interface Channel {
  active: boolean;
  remote_pubkey: string;
  channel_point: string;
  chan_id: string;
  capacity: string;
  local_balance: string;
  remote_balance: string;
  commit_fee: string;
  commit_weight: string;
  fee_per_kw: string;
  unsettled_balance: string;
  total_satoshis_sent: string;
  total_satoshis_received: string;
  num_updates: string;
  pending_htlcs: unknown[];
  csv_delay: number;
  private: boolean;
  initiator: boolean;
  chan_status_flags: string;
  local_chan_reserve_sat: string;
  remote_chan_reserve_sat: string;
  lifetime: string;
  uptime: string;
}

interface ListChannelsResponse {
  channels: Channel[];
}

interface PendingChannel {
  remote_node_pub: string;
  channel_point: string;
  capacity: string;
  local_balance: string;
  remote_balance: string;
}

interface PendingChannelsResponse {
  pending_open_channels: Array<{
    channel: PendingChannel;
    commit_fee: string;
    commit_weight: string;
    fee_per_kw: string;
  }>;
  pending_closing_channels: Array<{
    channel: PendingChannel;
    closing_txid: string;
  }>;
  pending_force_closing_channels: Array<{
    channel: PendingChannel;
    closing_txid: string;
    limbo_balance: string;
    maturity_height: number;
    blocks_til_maturity: number;
  }>;
  waiting_close_channels: Array<{
    channel: PendingChannel;
    limbo_balance: string;
  }>;
}

interface ClosedChannel {
  channel_point: string;
  chan_id: string;
  chain_hash: string;
  closing_tx_hash: string;
  remote_pubkey: string;
  capacity: string;
  close_height: number;
  settled_balance: string;
  time_locked_balance: string;
  close_type: string;
  open_initiator: string;
  close_initiator: string;
  resolutions: unknown[];
}

interface ClosedChannelsResponse {
  channels: ClosedChannel[];
}

interface OpenChannelRequest {
  node_pubkey_string: string;
  local_funding_amount: string;
  push_sat?: string;
  target_conf?: number;
  sat_per_byte?: string;
  private?: boolean;
  min_htlc_msat?: string;
  remote_csv_delay?: number;
  min_confs?: number;
  spend_unconfirmed?: boolean;
}

interface CloseChannelRequest {
  channel_point: {
    funding_txid_str: string;
    output_index: number;
  };
  force?: boolean;
  target_conf?: number;
  sat_per_byte?: string;
}

interface WalletBalance {
  total_balance: string;
  confirmed_balance: string;
  unconfirmed_balance: string;
  locked_balance: string;
  reserved_balance_anchor_chan: string;
  account_balance: {
    [key: string]: {
      confirmed_balance: string;
      unconfirmed_balance: string;
    };
  };
}

interface NewAddressResponse {
  address: string;
}

interface SendCoinsRequest {
  addr: string;
  amount: string;
  target_conf?: number;
  sat_per_vbyte?: string;
  send_all?: boolean;
  label?: string;
  min_confs?: number;
  spend_unconfirmed?: boolean;
}

interface SendCoinsResponse {
  txid: string;
}

interface Transaction {
  tx_hash: string;
  amount: string;
  num_confirmations: number;
  block_hash: string;
  block_height: number;
  time_stamp: string;
  total_fees: string;
  dest_addresses: string[];
  label: string;
}

interface TransactionDetails {
  transactions: Transaction[];
}

interface Utxo {
  address: string;
  amount_sat: string;
  pk_script: string;
  outpoint: {
    txid_bytes: string;
    txid_str: string;
    output_index: number;
  };
  confirmations: string;
}

interface ListUnspentResponse {
  utxos: Utxo[];
}

// Create axios instance with dynamic credentials
const createLndClient = (): AxiosInstance => {
  const credentials = connectionManager.getCredentials();
  if (!credentials) {
    throw new Error("No credentials found. Please connect first.");
  }

  return axios.create({
    baseURL: `https://${credentials.host}:8080`,
    headers: {
      "Content-Type": "application/json",
      "Grpc-Metadata-Macaroon": credentials.macaroon,
    },
  });
};

// Helper to handle errors
const handleError = (error: unknown, context: string): never => {
  if (axios.isAxiosError(error)) {
    console.error(`Error ${context}:`, error.response?.data || error.message);
  } else {
    console.error(`Error ${context}:`, error);
  }
  throw error;
};

// Test connection with provided credentials
export const testConnection = async (host: string, macaroon: string): Promise<NodeInfo> => {
  const testClient = axios.create({
    baseURL: `https://${host}:8080`,
    headers: {
      "Content-Type": "application/json",
      "Grpc-Metadata-Macaroon": macaroon,
    },
  });

  try {
    const response = await testClient.get<NodeInfo>("/v1/getinfo");
    return response.data;
  } catch (error) {
    return handleError(error, "testing connection");
  }
};

// Fetch general information about the LND node
export const getInfo = async (): Promise<NodeInfo> => {
  try {
    const lnd = createLndClient();
    const response = await lnd.get<NodeInfo>("/v1/getinfo");
    return response.data;
  } catch (error) {
    return handleError(error, "fetching LND info");
  }
};

export const getBalances = async (): Promise<ChannelBalance> => {
  try {
    const lnd = createLndClient();
    const response = await lnd.get<ChannelBalance>("/v1/balance/channels");
    return response.data;
  } catch (error) {
    return handleError(error, "fetching LND balances");
  }
};

export const createInvoice = async (amount: number, memo?: string): Promise<Invoice> => {
  try {
    const lnd = createLndClient();
    const requestBody: { value: string; memo?: string } = {
      value: amount.toString(),
    };
    if (memo) {
      requestBody.memo = memo;
    }
    const response = await lnd.post<Invoice>("/v1/invoices", requestBody);
    console.log("lnd response", response);
    return response.data;
  } catch (error) {
    return handleError(error, "creating invoice");
  }
};

export const payInvoice = async (paymentRequest: string): Promise<PaymentResponse> => {
  try {
    const lnd = createLndClient();
    const response = await lnd.post<PaymentResponse>("/v1/channels/transactions", {
      payment_request: paymentRequest,
      // you should set this to prevent getting fee sniped / siphoned!
      fee_limit: {
        fixed: "1000",
      },
    });
    return response.data;
  } catch (error) {
    return handleError(error, "paying invoice");
  }
};

// Peer Management
export const listPeers = async (): Promise<ListPeersResponse> => {
  try {
    const lnd = createLndClient();
    const response = await lnd.get<ListPeersResponse>("/v1/peers");
    return response.data;
  } catch (error) {
    return handleError(error, "listing peers");
  }
};

export const connectPeer = async (pubkey: string, host: string): Promise<void> => {
  try {
    const lnd = createLndClient();
    await lnd.post("/v1/peers", {
      addr: {
        pubkey,
        host,
      },
      perm: true,
    });
  } catch (error) {
    return handleError(error, "connecting to peer");
  }
};

export const disconnectPeer = async (pubkey: string): Promise<void> => {
  try {
    const lnd = createLndClient();
    await lnd.delete(`/v1/peers/${pubkey}`);
  } catch (error) {
    return handleError(error, "disconnecting peer");
  }
};

// Channel Management
export const listChannels = async (): Promise<ListChannelsResponse> => {
  try {
    const lnd = createLndClient();
    const response = await lnd.get<ListChannelsResponse>("/v1/channels");
    return response.data;
  } catch (error) {
    return handleError(error, "listing channels");
  }
};

export const listPendingChannels = async (): Promise<PendingChannelsResponse> => {
  try {
    const lnd = createLndClient();
    const response = await lnd.get<PendingChannelsResponse>("/v1/channels/pending");
    return response.data;
  } catch (error) {
    return handleError(error, "listing pending channels");
  }
};

export const listClosedChannels = async (): Promise<ClosedChannelsResponse> => {
  try {
    const lnd = createLndClient();
    const response = await lnd.get<ClosedChannelsResponse>("/v1/channels/closed");
    return response.data;
  } catch (error) {
    return handleError(error, "listing closed channels");
  }
};

export const openChannel = async (
  nodePubkey: string, 
  localFundingAmount: number,
  pushSat: number = 0
): Promise<{ funding_txid_bytes: string; output_index: number }> => {
  try {
    const lnd = createLndClient();
    const response = await lnd.post<{ funding_txid_bytes: string; output_index: number }>(
      "/v1/channels",
      {
        node_pubkey_string: nodePubkey,
        local_funding_amount: localFundingAmount.toString(),
        push_sat: pushSat.toString(),
        target_conf: 6,
        spend_unconfirmed: true,
      } as OpenChannelRequest
    );
    return response.data;
  } catch (error) {
    return handleError(error, "opening channel");
  }
};

export const closeChannel = async (
  channelPoint: string,
  force: boolean = false
): Promise<void> => {
  try {
    const lnd = createLndClient();
    const [fundingTxid, outputIndex] = channelPoint.split(":");
    
    const request: CloseChannelRequest = {
      channel_point: {
        funding_txid_str: fundingTxid,
        output_index: parseInt(outputIndex),
      },
      force,
    };

    await lnd.delete(`/v1/channels/${fundingTxid}/${outputIndex}`, {
      data: request,
    });
  } catch (error) {
    return handleError(error, "closing channel");
  }
};

// Onchain Management
export const getWalletBalance = async (): Promise<WalletBalance> => {
  try {
    const lnd = createLndClient();
    const response = await lnd.get<WalletBalance>("/v1/balance/blockchain");
    return response.data;
  } catch (error) {
    return handleError(error, "fetching wallet balance");
  }
};

export const newAddress = async (type: string = "p2wkh"): Promise<string> => {
  try {
    const lnd = createLndClient();
    const response = await lnd.get<NewAddressResponse>(`/v1/newaddress?type=${type}`);
    return response.data.address;
  } catch (error) {
    return handleError(error, "generating new address");
  }
};

export const sendCoins = async (
  address: string,
  amount: number,
  satPerVbyte?: number,
  sendAll: boolean = false
): Promise<string> => {
  try {
    const lnd = createLndClient();
    const request: SendCoinsRequest = {
      addr: address,
      amount: sendAll ? "0" : amount.toString(),
      send_all: sendAll,
      spend_unconfirmed: true,
    };
    
    if (satPerVbyte) {
      request.sat_per_vbyte = satPerVbyte.toString();
    }

    const response = await lnd.post<SendCoinsResponse>("/v1/transactions", request);
    return response.data.txid;
  } catch (error) {
    return handleError(error, "sending coins");
  }
};

export const getTransactions = async (): Promise<TransactionDetails> => {
  try {
    const lnd = createLndClient();
    const response = await lnd.get<TransactionDetails>("/v1/transactions");
    return response.data;
  } catch (error) {
    return handleError(error, "fetching transactions");
  }
};

export const listUnspent = async (minConfs: number = 0, maxConfs: number = 9999999): Promise<ListUnspentResponse> => {
  try {
    const lnd = createLndClient();
    const response = await lnd.get<ListUnspentResponse>(
      `/v1/utxos?min_confs=${minConfs}&max_confs=${maxConfs}`
    );
    return response.data;
  } catch (error) {
    return handleError(error, "listing unspent outputs");
  }
};