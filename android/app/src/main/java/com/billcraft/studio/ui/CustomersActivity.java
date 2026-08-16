package com.billcraft.studio.ui;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.EditText;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.billcraft.studio.R;
import com.billcraft.studio.api.ApiClient;
import com.billcraft.studio.models.Customer;
import com.billcraft.studio.ui.adapters.CustomersAdapter;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CustomersActivity extends AppCompatActivity {

    private CustomersAdapter adapter;
    private View layoutEmptyCustomers;
    private String currentSearch = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_customers);

        findViewById(R.id.btnBackCustomers).setOnClickListener(v -> finish());

        layoutEmptyCustomers = findViewById(R.id.layoutEmptyCustomers);
        EditText etSearch = findViewById(R.id.etSearchCustomers);
        RecyclerView rvCustomers = findViewById(R.id.rvCustomers);
        rvCustomers.setLayoutManager(new LinearLayoutManager(this));

        adapter = new CustomersAdapter();
        rvCustomers.setAdapter(adapter);

        etSearch.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                currentSearch = s.toString().trim();
                loadCustomers();
            }
        });

        loadCustomers();
    }

    private void loadCustomers() {
        ApiClient.getService(this).getCustomers(currentSearch, 1, 100).enqueue(new Callback<List<Customer>>() {
            @Override
            public void onResponse(Call<List<Customer>> call, Response<List<Customer>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<Customer> list = response.body();
                    adapter.setCustomers(list);
                    if (list.isEmpty()) {
                        layoutEmptyCustomers.setVisibility(View.VISIBLE);
                    } else {
                        layoutEmptyCustomers.setVisibility(View.GONE);
                    }
                } else {
                    layoutEmptyCustomers.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<List<Customer>> call, Throwable t) {
                layoutEmptyCustomers.setVisibility(View.VISIBLE);
            }
        });
    }
}
