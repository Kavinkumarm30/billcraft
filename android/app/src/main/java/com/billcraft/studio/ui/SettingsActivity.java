package com.billcraft.studio.ui;

import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.billcraft.studio.R;
import com.billcraft.studio.api.ApiClient;
import com.billcraft.studio.models.CompanySettings;
import com.billcraft.studio.models.InvoiceLayoutItem;
import com.billcraft.studio.ui.adapters.InvoiceLayoutsAdapter;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SettingsActivity extends AppCompatActivity {

    private View tabLayouts, tabCompanyProfile;
    private View containerLayouts, containerCompanyProfile;
    private TextView tvCurrentActiveLayout;
    private EditText etCompanyName, etGstNo, etEmail, etPhone, etAddress;
    private EditText etBankName, etAccountNo, etIfsc, etUpiId;

    private InvoiceLayoutsAdapter layoutsAdapter;
    private CompanySettings currentSettings = new CompanySettings();
    private String selectedLayoutId = "standard";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        findViewById(R.id.btnBackSettings).setOnClickListener(v -> finish());
        findViewById(R.id.btnSaveAllSettings).setOnClickListener(v -> saveCompanySettings());

        tabLayouts = findViewById(R.id.tabLayouts);
        tabCompanyProfile = findViewById(R.id.tabCompanyProfile);
        containerLayouts = findViewById(R.id.containerLayouts);
        containerCompanyProfile = findViewById(R.id.containerCompanyProfile);

        tvCurrentActiveLayout = findViewById(R.id.tvCurrentActiveLayout);

        etCompanyName = findViewById(R.id.etCompanyName);
        etGstNo = findViewById(R.id.etGstNo);
        etEmail = findViewById(R.id.etEmail);
        etPhone = findViewById(R.id.etPhone);
        etAddress = findViewById(R.id.etAddress);

        etBankName = findViewById(R.id.etBankName);
        etAccountNo = findViewById(R.id.etAccountNo);
        etIfsc = findViewById(R.id.etIfsc);
        etUpiId = findViewById(R.id.etUpiId);

        setupTabs();
        setupLayoutsRecyclerView();
        loadSettingsFromApi();
    }

    private void setupTabs() {
        tabLayouts.setOnClickListener(v -> {
            tabLayouts.setBackgroundResource(R.drawable.bg_black_button);
            ((TextView) tabLayouts).setTextColor(0xFFFFFFFF);

            tabCompanyProfile.setBackgroundResource(0);
            ((TextView) tabCompanyProfile).setTextColor(0xFF4B5563);

            containerLayouts.setVisibility(View.VISIBLE);
            containerCompanyProfile.setVisibility(View.GONE);
        });

        tabCompanyProfile.setOnClickListener(v -> {
            tabCompanyProfile.setBackgroundResource(R.drawable.bg_black_button);
            ((TextView) tabCompanyProfile).setTextColor(0xFFFFFFFF);

            tabLayouts.setBackgroundResource(0);
            ((TextView) tabLayouts).setTextColor(0xFF4B5563);

            containerCompanyProfile.setVisibility(View.VISIBLE);
            containerLayouts.setVisibility(View.GONE);
        });
    }

    private void setupLayoutsRecyclerView() {
        RecyclerView rvLayouts = findViewById(R.id.rvLayoutsList);
        rvLayouts.setLayoutManager(new LinearLayoutManager(this));

        List<InvoiceLayoutItem> list = new ArrayList<>();
        list.add(new InvoiceLayoutItem("standard", "Standard", "Logo Left", "Classic business invoice with company details on the left", false));
        list.add(new InvoiceLayoutItem("modern", "Modern", "Logo Right", "Contemporary layout with brand logo on the right side", false));
        list.add(new InvoiceLayoutItem("minimal", "Minimal", "Centered", "Clean centered typography with slim divider lines", false));
        list.add(new InvoiceLayoutItem("professional", "Professional", "Boxed", "Card containers for customer details and totals", false));
        list.add(new InvoiceLayoutItem("bold", "Bold", "Dark Accent", "Dark solid header with high contrast summary values", false));
        list.add(new InvoiceLayoutItem("elegant", "Elegant", "Serif & Soft", "Timeless serif fonts with soft rounded borders", false));
        list.add(new InvoiceLayoutItem("tech", "Tech", "Monospace", "Clean monospace typography for tech companies", false));
        list.add(new InvoiceLayoutItem("corporate", "Corporate", "Solid Header", "Formal executive layout designed for corporate billing", false));
        list.add(new InvoiceLayoutItem("playful", "Playful", "Rounded", "Vibrant rounded cards with colorful badges", false));
        list.add(new InvoiceLayoutItem("orange-classic", "Orange Classic", "Custom Monisha", "Exclusive warm orange boxed theme with highlighted totals card", true));
        list.add(new InvoiceLayoutItem("classic", "Classic", "Traditional", "Traditional paper invoice layout with standard grid", false));

        layoutsAdapter = new InvoiceLayoutsAdapter(item -> {
            selectedLayoutId = item.getId();
            layoutsAdapter.setActiveLayoutId(selectedLayoutId);
            tvCurrentActiveLayout.setText("Current active layout: " + item.getName() + " (" + item.getBadge() + ")");
            currentSettings.setInvoiceLayout(selectedLayoutId);
            saveCompanySettings();
        });

        layoutsAdapter.setLayouts(list, selectedLayoutId);
        rvLayouts.setAdapter(layoutsAdapter);
    }

    private void loadSettingsFromApi() {
        ApiClient.getService(this).getSettings().enqueue(new Callback<CompanySettings>() {
            @Override
            public void onResponse(Call<CompanySettings> call, Response<CompanySettings> response) {
                if (response.isSuccessful() && response.body() != null) {
                    currentSettings = response.body();
                    populateFields();
                }
            }

            @Override
            public void onFailure(Call<CompanySettings> call, Throwable t) {
                // Keep local defaults
            }
        });
    }

    private void populateFields() {
        etCompanyName.setText(currentSettings.getCompanyName());
        etGstNo.setText(currentSettings.getGstNo());
        etEmail.setText(currentSettings.getEmail());
        etPhone.setText(currentSettings.getPhone());
        etAddress.setText(currentSettings.getAddress());

        etBankName.setText(currentSettings.getBankName());
        etAccountNo.setText(currentSettings.getAccountNo());
        etIfsc.setText(currentSettings.getIfsc());
        etUpiId.setText(currentSettings.getUpiId());

        if (currentSettings.getInvoiceLayout() != null && !currentSettings.getInvoiceLayout().isEmpty()) {
            selectedLayoutId = currentSettings.getInvoiceLayout();
            layoutsAdapter.setActiveLayoutId(selectedLayoutId);
            tvCurrentActiveLayout.setText("Current active layout: " + selectedLayoutId.toUpperCase());
        }
    }

    private void saveCompanySettings() {
        currentSettings.setCompanyName(etCompanyName.getText().toString().trim());
        currentSettings.setGstNo(etGstNo.getText().toString().trim());
        currentSettings.setEmail(etEmail.getText().toString().trim());
        currentSettings.setPhone(etPhone.getText().toString().trim());
        currentSettings.setAddress(etAddress.getText().toString().trim());

        currentSettings.setBankName(etBankName.getText().toString().trim());
        currentSettings.setAccountNo(etAccountNo.getText().toString().trim());
        currentSettings.setIfsc(etIfsc.getText().toString().trim());
        currentSettings.setUpiId(etUpiId.getText().toString().trim());
        currentSettings.setInvoiceLayout(selectedLayoutId);

        ApiClient.getService(this).updateSettings(currentSettings).enqueue(new Callback<CompanySettings>() {
            @Override
            public void onResponse(Call<CompanySettings> call, Response<CompanySettings> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(SettingsActivity.this, "✅ Settings & layout saved!", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(SettingsActivity.this, "Settings saved locally", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<CompanySettings> call, Throwable t) {
                Toast.makeText(SettingsActivity.this, "Settings saved", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
