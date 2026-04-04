// --- Heuristics for Tagging ---
export const TAG_MAP: { [key: string]: string[] } = {
  'Service': ['phục vụ', 'nhân viên', 'service', 'staff', 'nhiệt tình', 'thái độ', 'không hài lòng', 'support', 'hỗ trợ'],
  'Food': ['bắp', 'nước', 'popcorn', 'drink', 'food', 'đồ ăn', 'com bo', 'combo'],
  'Cleanliness': ['sạch', 'bẩn', 'vệ sinh', 'mùi', 'clean', 'dirty', 'thơm', 'hôi'],
  'Experience': ['phim', 'ghế', 'âm thanh', 'màn hình', 'movie', 'seat', 'sound', 'screen', 'trải nghiệm', 'ổn', 'tệ'],
  'Price': ['giá', 'đắt', 'rẻ', 'mắc', 'chi phí', 'tiền', 'price', 'expensive', 'cheap']
};

export const safeParseDate = (dateStr: any) => {
  if (!dateStr) return 0;
  const clean = typeof dateStr === 'string' ? dateStr.replace(/^\$D/, '') : dateStr;
  const parsed = new Date(clean).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

export function getTags(text: string = "") {
  if (!text) return [];
  const lowText = text.toLowerCase();
  const tags: string[] = [];
  for (const [tag, keywords] of Object.entries(TAG_MAP)) {
    if (keywords.some(k => lowText.includes(k))) tags.push(tag);
  }
  return tags;
}
