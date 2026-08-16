package com.billcraft.studio.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
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
    private View layoutEmptyInvoices;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_invoices_list);

        swipeRefresh = findViewById(R.id.swipeRefreshInvoices);
        layoutEmptyInvoices = findViewById(R.id.layoutEmptyInvoices);
        RecyclerView rvInvoices = findViewById(R.id.rvInvoicesList);
        rvInvoices.setLayoutManager(new LinearLayoutManager(this));

        adapter = new InvoicesAdapter();
        rvInvoices.setAdapter(adapter);

        findViewById(R.id.btnBackInvoices).setOnClickListener(v -> finish());

        findViewById(R.id.btnCreateInvoiceFromList).setOnClickListener(v -> {
            startActivity(new Intent(InvoicesListActivity.this, MultiPageCameraActivity.class));
        });

        findViewById(R.id.btnEmptyCreate).setOnClickListener(v -> {
            startActivity(new Intent(InvoicesListActivity.this, MultiPageCameraActivity.class));
        });

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
                    List<Invoice> list = response.body();
                    adapter.setInvoices(list);
                    if (list.isEmpty()) {
                        layoutEmptyInvoices.setVisibility(View.VISIBLE);
                    } else {
                        layoutEmptyInvoices.setVisibility(View.GONE);
                    }
                } else {
                    layoutEmptyInvoices.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<List<Invoice>> call, Throwable t) {
                swipeRefresh.setRefreshing(false);
                layoutEmptyInvoices.setVisibility(View.VISIBLE);
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadInvoices();
    }
}
