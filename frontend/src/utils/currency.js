export const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "0đ";
  }
  return `${parsed.toLocaleString("vi-VN")}đ`;
};

