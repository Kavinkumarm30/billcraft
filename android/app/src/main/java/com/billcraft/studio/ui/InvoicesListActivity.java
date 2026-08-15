package com.billcraft.studio.ui;

import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.billcraft.studio.R;
import com.billcraft.studio.api.ApiClient;
import com.billcraft.studio.models.Invoice;
import com.billcraft.studio.ui.adapters.InvoicesAdapter;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class InvoicesListActivity extends AppCompatActivity {

    private SwipeRefreshLayout swipeRefresh;
    private InvoicesAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_invoices_list);

        swipeRefresh = findViewById(R.id.swipeRefreshInvoices);
        RecyclerView rvInvoices = findViewById(R.id.rvInvoicesList);
        rvInvoices.setLayoutManager(new LinearLayoutManager(this));

        adapter = new InvoicesAdapter();
        rvInvoices.setAdapter(adapter);

        swipeRefresh.setOnRefreshListener(this::loadInvoices);
        loadInvoices();
    }

    private void loadInvoices() {
        swipeRefresh.setRefreshing(true);
        ApiClient.getService(this).getInvoices(1, 100).enqueue(new Callback<List<Invoice>>() {
            @Override
            public void onResponse(Call<List<Invoice>> call, Response<List<Invoice>> response) {
                swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    adapter.setInvoices(response.body());
                } else {
                    Toast.makeText(InvoicesListActivity.this, "Failed to load invoices", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<Invoice>> call, Throwable t) {
                swipeRefresh.setRefreshing(false);
                Toast.makeText(InvoicesListActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
