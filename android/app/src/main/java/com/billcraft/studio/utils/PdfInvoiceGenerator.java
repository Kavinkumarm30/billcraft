package com.billcraft.studio.utils;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.graphics.pdf.PdfDocument;

import com.billcraft.studio.models.CompanySettings;
import com.billcraft.studio.models.Invoice;
import com.billcraft.studio.models.InvoiceItem;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;

public class PdfInvoiceGenerator {

    public static File generateInvoicePdf(Context context, Invoice invoice, CompanySettings settings) throws IOException {
        // Standard A4 dimensions at 72 DPI: 595 x 842 points
        int pageWidth = 595;
        int pageHeight = 842;

        PdfDocument document = new PdfDocument();
        PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create();
        PdfDocument.Page page = document.startPage(pageInfo);
        Canvas canvas = page.getCanvas();

        Paint paint = new Paint();
        paint.setAntiAlias(true);

        // Header Background Bar
        paint.setColor(Color.parseColor("#18181B"));
        canvas.drawRect(0, 0, pageWidth, 90, paint);

        // Company Title
        paint.setColor(Color.WHITE);
        paint.setTextSize(22);
        paint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        String companyName = settings != null && settings.getCompanyName() != null ? settings.getCompanyName() : "BILLCRAFT STUDIO";
        canvas.drawText(companyName, 40, 50, paint);

        paint.setTextSize(10);
        paint.setTypeface(Typeface.DEFAULT);
        canvas.drawText("Tax Invoice / Bill of Supply", 40, 68, paint);

        // Invoice Meta Header (Right)
        paint.setTextSize(16);
        paint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        canvas.drawText("INVOICE", 450, 45, paint);

        paint.setTextSize(10);
        paint.setTypeface(Typeface.DEFAULT);
        canvas.drawText("No: " + invoice.getInvoiceNumber(), 450, 62, paint);
        canvas.drawText("Date: " + (invoice.getDate() != null ? invoice.getDate() : ""), 450, 76, paint);

        // Billed To Section
        paint.setColor(Color.parseColor("#09090B"));
        paint.setTextSize(12);
        paint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        canvas.drawText("Billed To:", 40, 125, paint);

        paint.setTextSize(11);
        paint.setTypeface(Typeface.DEFAULT);
        canvas.drawText(invoice.getCustomerName(), 40, 142, paint);
        if (!invoice.getPhone().isEmpty()) canvas.drawText("Phone: " + invoice.getPhone(), 40, 157, paint);
        if (!invoice.getAddress().isEmpty()) canvas.drawText(invoice.getAddress(), 40, 172, paint);

        // Items Table Header
        int tableTop = 205;
        paint.setColor(Color.parseColor("#F4F4F5"));
        canvas.drawRect(40, tableTop, pageWidth - 40, tableTop + 26, paint);

        paint.setColor(Color.parseColor("#18181B"));
        paint.setTextSize(10);
        paint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        canvas.drawText("#", 50, tableTop + 17, paint);
        canvas.drawText("Description", 80, tableTop + 17, paint);
        canvas.drawText("Qty", 360, tableTop + 17, paint);
        canvas.drawText("Rate", 420, tableTop + 17, paint);
        canvas.drawText("Amount (₹)", 490, tableTop + 17, paint);

        // Items Table Rows
        int y = tableTop + 45;
        paint.setTypeface(Typeface.DEFAULT);
        List<InvoiceItem> items = invoice.getItems();
        for (int i = 0; i < items.size(); i++) {
            InvoiceItem item = items.get(i);
            canvas.drawText(String.valueOf(i + 1), 50, y, paint);
            canvas.drawText(item.getDescription(), 80, y, paint);
            canvas.drawText(item.getQuantity(), 360, y, paint);
            canvas.drawText("₹" + item.getRate(), 420, y, paint);
            canvas.drawText("₹" + item.getAmount(), 490, y, paint);

            // Divider line
            paint.setColor(Color.parseColor("#E4E4E7"));
            canvas.drawLine(40, y + 8, pageWidth - 40, y + 8, paint);
            paint.setColor(Color.parseColor("#09090B"));

            y += 24;
            if (y > 680) break; // Multi-page break limit
        }

        // Totals Card
        int totalY = Math.max(y + 20, 560);
        paint.setColor(Color.parseColor("#FAFAFA"));
        canvas.drawRect(340, totalY, pageWidth - 40, totalY + 80, paint);
        paint.setColor(Color.parseColor("#E4E4E7"));
        paint.setStyle(Paint.Style.STROKE);
        canvas.drawRect(340, totalY, pageWidth - 40, totalY + 80, paint);
        paint.setStyle(Paint.Style.FILL);

        paint.setColor(Color.parseColor("#71717A"));
        paint.setTextSize(11);
        canvas.drawText("Subtotal:", 355, totalY + 28, paint);
        paint.setColor(Color.parseColor("#09090B"));
        paint.setTextSize(11);
        canvas.drawText("₹" + invoice.getSubtotal(), 480, totalY + 28, paint);

        paint.setColor(Color.parseColor("#E25704"));
        paint.setTextSize(14);
        paint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        canvas.drawText("Grand Total:", 355, totalY + 60, paint);
        canvas.drawText("₹" + invoice.getGrandTotal(), 470, totalY + 60, paint);

        // Amount in words
        try {
            double totalVal = Double.parseDouble(invoice.getGrandTotal());
            paint.setColor(Color.parseColor("#71717A"));
            paint.setTextSize(9);
            paint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.ITALIC));
            canvas.drawText("Amount in words: " + NumberToWords.convertToIndianRupees(totalVal), 40, totalY + 95, paint);
        } catch (Exception ignored) {}

        // Footer
        paint.setColor(Color.parseColor("#A1A1AA"));
        paint.setTextSize(9);
        paint.setTypeface(Typeface.DEFAULT);
        canvas.drawText("Thank you for your business!", 40, 780, paint);
        canvas.drawText("Generated via BillCraft Studio Android", 400, 780, paint);

        document.finishPage(page);

        // Save PDF to App Cache / Storage
        File outputDir = new File(context.getCacheDir(), "invoices");
        if (!outputDir.exists()) outputDir.mkdirs();

        File pdfFile = new File(outputDir, "Invoice_" + invoice.getInvoiceNumber() + ".pdf");
        FileOutputStream fos = new FileOutputStream(pdfFile);
        document.writeTo(fos);
        document.close();
        fos.close();

        return pdfFile;
    }
}
