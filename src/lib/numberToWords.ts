export const numberToWords = (num: number | string): string => {
  const n = parseInt(num.toString(), 10);
  if (isNaN(n) || n === 0) return 'ZERO';
  
  const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const numStr = n.toString();
  if (numStr.length > 9) return 'OVERFLOW';
  
  const match = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!match) return '';
  
  let str = '';
  str += (match[1] != '00') ? (a[Number(match[1])] || b[match[1][0] as any] + ' ' + a[match[1][1] as any]) + 'CRORE ' : '';
  str += (match[2] != '00') ? (a[Number(match[2])] || b[match[2][0] as any] + ' ' + a[match[2][1] as any]) + 'LAKH ' : '';
  str += (match[3] != '00') ? (a[Number(match[3])] || b[match[3][0] as any] + ' ' + a[match[3][1] as any]) + 'THOUSAND ' : '';
  str += (match[4] != '0') ? (a[Number(match[4])] || b[match[4][0] as any] + ' ' + a[match[4][1] as any]) + 'HUNDRED ' : '';
  str += (match[5] != '00') ? ((str != '') ? 'AND ' : '') + (a[Number(match[5])] || b[match[5][0] as any] + ' ' + a[match[5][1] as any]) : '';
  
  return str.trim();
};
