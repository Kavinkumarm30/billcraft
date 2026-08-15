package com.billcraft.studio.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.billcraft.studio.R;
import com.billcraft.studio.api.ApiClient;
import com.billcraft.studio.models.Invoice;
import com.billcraft.studio.models.InvoiceItem;
import com.billcraft.studio.ui.adapters.LineItemsAdapter;

import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ReviewOcrActivity extends AppCompatActivity {

    private EditText etCustomerName, etCustomerPhone, etCustomerAddress, etInvoiceNumber, etInvoiceDate;
    private TextView tvSubtotal, tvGrandTotal;
    private LineItemsAdapter itemsAdapter;
    private Invoice invoice;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_review_ocr);

        etCustomerName = findViewById(R.id.etCustomerName);
        etCustomerPhone = findViewById(R.id.etCustomerPhone);
        etCustomerAddress = findViewById(R.id.etCustomerAddress);
        etInvoiceNumber = findViewById(R.id.etInvoiceNumber);
        etInvoiceDate = findViewById(R.id.etInvoiceDate);
        tvSubtotal = findViewById(R.id.tvSubtotal);
        tvGrandTotal = findViewById(R.id.tvGrandTotal);

        RecyclerView rvLineItems = findViewById(R.id.rvLineItems);
        rvLineItems.setLayoutManager(new LinearLayoutManager(this));
        itemsAdapter = new LineItemsAdapter(this::recalculateTotals);
        rvLineItems.setAdapter(itemsAdapter);

        findViewById(R.id.btnAddItem).setOnClickListener(v -> itemsAdapter.addItem());
        findViewById(R.id.btnGenerateInvoice).setOnClickListener(v -> saveAndPreviewInvoice());

        invoice = (Invoice) getIntent().getSerializableExtra("extracted_invoice");
        if (invoice == null) {
            invoice = new Invoice();
            invoice.setInvoiceNumber("INV-" + System.currentTimeMillis() % 1000000);
            invoice.setDate(new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date()));
        }

        populateForm();
    }

    private void populateForm() {
        etCustomerName.setText(invoice.getCustomerName());
        etCustomerPhone.setText(invoice.getPhone());
        etCustomerAddress.setText(invoice.getAddress());
        etInvoiceNumber.setText(invoice.getInvoiceNumber());
        etInvoiceDate.setText(invoice.getDate() != null ? invoice.getDate() : new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date()));

        itemsAdapter.setItems(invoice.getItems());
        recalculateTotals();
    }

    private void recalculateTotals() {
        double subtotal = 0;
        List<InvoiceItem> currentItems = itemsAdapter.getItems();
        for (InvoiceItem item : currentItems) {
            try {
                subtotal += Double.parseDouble(item.getAmount());
            } catch (Exception ignored) {}
        }

        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        tvSubtotal.setText(formatter.format(subtotal));
        tvGrandTotal.setText(formatter.format(subtotal));

        invoice.setSubtotal(String.format("%.2f", subtotal));
        invoice.setGrandTotal(String.format("%.2f", subtotal));
    }

    private void saveAndPreviewInvoice() {
        invoice.setCustomerName(etCustomerName.getText().toString().trim());
        invoice.setPhone(etCustomerPhone.getText().toString().trim());
        invoice.setAddress(etCustomerAddress.getText().toString().trim());
        invoice.setInvoiceNumber(etInvoiceNumber.getText().toString().trim());
        invoice.setDate(etInvoiceDate.getText().toString().trim());
        invoice.setItems(itemsAdapter.getItems());

        Toast.makeText(this, "Saving invoice to cloud...", Toast.LENGTH_SHORT).show();

        ApiClient.getService(this).createInvoice(invoice).enqueue(new Callback<Invoice>() {
            @Override
            public void onResponse(Call<Invoice> call, Response<Invoice> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Invoice saved = response.body();
                    Intent intent = new Intent(ReviewOcrActivity.this, InvoicePreviewActivity.class);
                    intent.putExtra("invoice", saved);
                    startActivity(intent);
                    finish();
                } else {
                    Toast.makeText(ReviewOcrActivity.this, "Save error: " + response.message(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<Invoice> call, Throwable t) {
                Toast.makeText(ReviewOcrActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
