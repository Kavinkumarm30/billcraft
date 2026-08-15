package com.billcraft.studio.utils;

public class NumberToWords {
    private static final String[] units = {
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    };

    private static final String[] tens = {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    public static String convertToIndianRupees(double amount) {
        long wholePart = (long) amount;
        int paise = (int) Math.round((amount - wholePart) * 100);

        if (wholePart == 0 && paise == 0) return "Zero Rupees Only";

        StringBuilder sb = new StringBuilder();
        if (wholePart > 0) {
            sb.append(convertNumber(wholePart)).append(" Rupees");
        }
        if (paise > 0) {
            if (sb.length() > 0) sb.append(" and ");
            sb.append(convertNumber(paise)).append(" Paise");
        }
        sb.append(" Only");
        return sb.toString();
    }

    private static String convertNumber(long n) {
        if (n < 0) return "Minus " + convertNumber(-n);
        if (n <= 19) return units[(int) n];
        if (n <= 99) return tens[(int) (n / 10)] + (n % 10 != 0 ? " " + units[(int) (n % 10)] : "");
        if (n <= 999) return convertNumber(n / 100) + " Hundred" + (n % 100 != 0 ? " " + convertNumber(n % 100) : "");
        if (n <= 99999) return convertNumber(n / 1000) + " Thousand" + (n % 1000 != 0 ? " " + convertNumber(n % 1000) : "");
        if (n <= 9999999) return convertNumber(n / 100000) + " Lakh" + (n % 100000 != 0 ? " " + convertNumber(n % 100000) : "");
        return convertNumber(n / 10000000) + " Crore" + (n % 10000000 != 0 ? " " + convertNumber(n % 10000000) : "");
    }
}
