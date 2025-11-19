import crypto from "crypto";
import querystring from "querystring";

// VNPay Configuration
const VNPAY_CONFIG = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || "DEMO",
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || "DEMO_SECRET",
  vnp_Url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:5000/api/payments/vnpay-callback",
  vnp_Api: process.env.VNPAY_API || "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
};

// MoMo Configuration
const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || "DEMO",
  accessKey: process.env.MOMO_ACCESS_KEY || "DEMO",
  secretKey: process.env.MOMO_SECRET_KEY || "DEMO",
  endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
  returnUrl: process.env.MOMO_RETURN_URL || "http://localhost:5173/payment/momo-callback",
  notifyUrl: process.env.MOMO_NOTIFY_URL || "http://localhost:5000/api/payments/momo-notify",
};

/**
 * VNPay Payment
 */
export const createVNPayPaymentUrl = (orderId, amount, orderDescription, ipAddr) => {
  const date = new Date();
  const createDate = formatDate(date);
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 minutes

  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderDescription,
    vnp_OrderType: "other",
    vnp_Amount: Math.round(amount * 100), // Convert to cents, ensure integer
    vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  // Remove empty/null values before sorting
  const cleanParams = {};
  Object.keys(vnp_Params).forEach(key => {
    const value = vnp_Params[key];
    if (value !== null && value !== undefined && value !== '') {
      cleanParams[key] = String(value);
    }
  });

  // Sort and sign - VNPay requires alphabetical order
  const sortedParams = sortObject(cleanParams);
  
  // Create query string - VNPay requires specific format
  // According to VNPay docs, use querystring.stringify() which handles encoding correctly
  // This ensures compatibility with VNPay's signature verification
  const queryString = querystring.stringify(sortedParams);
  
  // Debug logging (remove in production)
  console.log("\n=== VNPay Signature Debug ===");
  console.log("TMN Code:", VNPAY_CONFIG.vnp_TmnCode);
  console.log("Hash Secret Length:", VNPAY_CONFIG.vnp_HashSecret.length);
  console.log("Hash Secret (first 10):", VNPAY_CONFIG.vnp_HashSecret.substring(0, 10));
  console.log("Return URL:", VNPAY_CONFIG.vnp_ReturnUrl);
  console.log("Params Count:", Object.keys(sortedParams).length);
  console.log("\nSorted Params:");
  Object.keys(sortedParams).forEach(key => {
    console.log(`  ${key}: ${sortedParams[key]}`);
  });
  console.log("\nQuery String (full):");
  console.log(queryString);
  console.log("\nQuery String Length:", queryString.length);
  
  // Create signature using the query string (without vnp_SecureHash)
  // VNPay uses SHA512 HMAC with the hash secret
  const vnp_SecureHash = crypto
    .createHmac("sha512", VNPAY_CONFIG.vnp_HashSecret)
    .update(queryString)
    .digest("hex");

  console.log("\nSignature (full):", vnp_SecureHash);
  console.log("Signature Length:", vnp_SecureHash.length);
  console.log("=============================\n");

  // Return URL with signature appended
  return `${VNPAY_CONFIG.vnp_Url}?${queryString}&vnp_SecureHash=${vnp_SecureHash}`;
};

export const verifyVNPayCallback = (vnp_Params) => {
  const secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sortedParams = sortObject(vnp_Params);
  const queryString = querystring.stringify(sortedParams);
  const checkSum = crypto
    .createHmac("sha512", VNPAY_CONFIG.vnp_HashSecret)
    .update(queryString)
    .digest("hex");

  return secureHash === checkSum && vnp_Params["vnp_ResponseCode"] === "00";
};

/**
 * MoMo Payment
 */
export const createMoMoPaymentUrl = async (orderId, amount, orderInfo) => {
  const requestId = orderId + Date.now();
  const orderId_momo = orderId;
  const requestType = "captureWallet";
  const extraData = "";

  const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${MOMO_CONFIG.notifyUrl}&orderId=${orderId_momo}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${MOMO_CONFIG.returnUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", MOMO_CONFIG.secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode: MOMO_CONFIG.partnerCode,
    partnerName: "Travel Booking",
    storeId: "MOMO",
    requestId: requestId,
    amount: amount,
    orderId: orderId_momo,
    orderInfo: orderInfo,
    redirectUrl: MOMO_CONFIG.returnUrl,
    ipnUrl: MOMO_CONFIG.notifyUrl,
    lang: "vi",
    requestType: requestType,
    autoCapture: true,
    extraData: extraData,
    signature: signature,
  };

  try {
    // Use Node.js built-in https module
    const https = await import("https");
    const http = await import("http");
    
    return new Promise((resolve, reject) => {
      const url = new URL(MOMO_CONFIG.endpoint);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      };

      const client = url.protocol === "https:" ? https : http;
      const req = client.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(new Error("Invalid JSON response"));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(JSON.stringify(requestBody));
      req.end();
    });
  } catch (error) {
    console.error("MoMo API Error:", error);
    throw error;
  }
};

export const verifyMoMoCallback = (params) => {
  const { orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = params;

  const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${MOMO_CONFIG.partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const checkSignature = crypto
    .createHmac("sha256", MOMO_CONFIG.secretKey)
    .update(rawSignature)
    .digest("hex");

  return checkSignature === signature && resultCode === 0;
};

/**
 * Helper functions
 */
function sortObject(obj) {
  const sorted = {};
  // Sort keys alphabetically (VNPay requirement)
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

