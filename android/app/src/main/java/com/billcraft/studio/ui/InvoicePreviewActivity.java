package com.billcraft.studio.ui;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;

import com.billcraft.studio.R;
import com.billcraft.studio.api.ApiClient;
import com.billcraft.studio.models.CompanySettings;
import com.billcraft.studio.models.Invoice;
import com.billcraft.studio.utils.PdfInvoiceGenerator;

import java.io.File;
import java.text.NumberFormat;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class InvoicePreviewActivity extends AppCompatActivity {

    private Invoice invoice;
    private CompanySettings settings;
    private File generatedPdf;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_invoice_preview);

        invoice = (Invoice) getIntent().getSerializableExtra("invoice");
        if (invoice == null) {
            Toast.makeText(this, "No invoice data provided", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        TextView tvInvoiceNo = findViewById(R.id.tvInvoiceNo);
        TextView tvCustomerSummary = findViewById(R.id.tvCustomerSummary);
        TextView tvTotalAmount = findViewById(R.id.tvTotalAmount);
        TextView tvItemsCount = findViewById(R.id.tvItemsCount);

        tvInvoiceNo.setText(invoice.getInvoiceNumber());
        tvCustomerSummary.setText("Billed to: " + invoice.getCustomerName() + (invoice.getPhone().isEmpty() ? "" : " (" + invoice.getPhone() + ")"));

        try {
            double total = Double.parseDouble(invoice.getGrandTotal());
            NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
            tvTotalAmount.setText(formatter.format(total));
        } catch (Exception e) {
            tvTotalAmount.setText("₹" + invoice.getGrandTotal());
        }

        tvItemsCount.setText(invoice.getItems().size() + " line item(s) included in PDF");

        findViewById(R.id.btnDone).setOnClickListener(v -> {
            startActivity(new Intent(InvoicePreviewActivity.this, DashboardActivity.class));
            finishAffinity();
        });

        findViewById(R.id.btnShareWhatsApp).setOnClickListener(v -> shareToWhatsApp());
        findViewById(R.id.btnShareGeneral).setOnClickListener(v -> shareGeneralPdf());

        loadCompanySettingsAndGeneratePdf();
    }

    private void loadCompanySettingsAndGeneratePdf() {
        ApiClient.getService(this).getSettings().enqueue(new Callback<CompanySettings>() {
            @Override
            public void onResponse(Call<CompanySettings> call, Response<CompanySettings> response) {
                if (response.isSuccessful()) {
                    settings = response.body();
                }
                generatePdf();
            }

            @Override
            public void onFailure(Call<CompanySettings> call, Throwable t) {
                generatePdf(); // Fallback with default company settings
            }
        });
    }

    private void generatePdf() {
        try {
            generatedPdf = PdfInvoiceGenerator.generateInvoicePdf(this, invoice, settings);
        } catch (Exception e) {
            Toast.makeText(this, "Failed to generate PDF: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void shareToWhatsApp() {
        if (generatedPdf == null || !generatedPdf.exists()) {
            generatePdf();
        }
        if (generatedPdf == null) return;

        Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", generatedPdf);

        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("application/pdf");
        intent.putExtra(Intent.EXTRA_STREAM, uri);
        intent.putExtra(Intent.EXTRA_TEXT, "Hello " + invoice.getCustomerName() + ", please find your invoice " + invoice.getInvoiceNumber() + " attached. Grand Total: ₹" + invoice.getGrandTotal());
        intent.setPackage("com.whatsapp");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        try {
            startActivity(intent);
        } catch (Exception e) {
            // Fallback if WhatsApp is not installed
            shareGeneralPdf();
        }
    }

    private void shareGeneralPdf() {
        if (generatedPdf == null || !generatedPdf.exists()) {
            generatePdf();
        }
        if (generatedPdf == null) return;

        Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", generatedPdf);

        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("application/pdf");
        intent.putExtra(Intent.EXTRA_STREAM, uri);
        intent.putExtra(Intent.EXTRA_SUBJECT, "Invoice " + invoice.getInvoiceNumber());
        intent.putExtra(Intent.EXTRA_TEXT, "Invoice from " + (settings != null ? settings.getCompanyName() : "Studio") + " for " + invoice.getCustomerName());
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        startActivity(Intent.createChooser(intent, "Share Invoice PDF"));
    }
}
