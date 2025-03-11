export const base64Encode = (str) => {
  return Buffer.from(str).toString("base64");
};

export const base64Decode = (str) => {
  return Buffer.from(str, "base64").toString("utf-8");
};
