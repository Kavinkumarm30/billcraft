package com.billcraft.studio.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.billcraft.studio.R;
import com.billcraft.studio.api.ApiClient;
import com.billcraft.studio.auth.SessionManager;
import com.billcraft.studio.models.DashboardStats;
import com.billcraft.studio.models.User;
import com.billcraft.studio.ui.adapters.RecentActivityAdapter;
import com.google.firebase.auth.FirebaseAuth;

import java.text.NumberFormat;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity {

    private SessionManager sessionManager;
    private TextView tvStudioName, tvUserEmail, tvTodaysRevenue, tvBillsGenerated;
    private SwipeRefreshLayout swipeRefresh;
    private RecentActivityAdapter activityAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        sessionManager = new SessionManager(this);

        tvStudioName = findViewById(R.id.tvStudioName);
        tvUserEmail = findViewById(R.id.tvUserEmail);
        tvTodaysRevenue = findViewById(R.id.tvTodaysRevenue);
        tvBillsGenerated = findViewById(R.id.tvBillsGenerated);
        swipeRefresh = findViewById(R.id.swipeRefresh);

        RecyclerView rvRecentActivity = findViewById(R.id.rvRecentActivity);
        rvRecentActivity.setLayoutManager(new LinearLayoutManager(this));
        activityAdapter = new RecentActivityAdapter();
        rvRecentActivity.setAdapter(activityAdapter);

        // Populate user info
        User user = sessionManager.getUser();
        if (user != null) {
            tvUserEmail.setText(user.getEmail());
            tvStudioName.setText(user.getName() != null ? user.getName() : "My Studio");
        }

        // Action Handlers
        findViewById(R.id.btnStartCamera).setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, MultiPageCameraActivity.class));
        });

        findViewById(R.id.btnViewInvoices).setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, InvoicesListActivity.class));
        });

        findViewById(R.id.btnViewCustomers).setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, CustomersActivity.class));
        });

        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            FirebaseAuth.getInstance().signOut();
            sessionManager.clear();
            startActivity(new Intent(DashboardActivity.this, LoginActivity.class));
            finish();
        });

        swipeRefresh.setOnRefreshListener(this::loadDashboardStats);

        loadDashboardStats();
    }

    private void loadDashboardStats() {
        swipeRefresh.setRefreshing(true);
        ApiClient.getService(this).getDashboard().enqueue(new Callback<DashboardStats>() {
            @Override
            public void onResponse(Call<DashboardStats> call, Response<DashboardStats> response) {
                swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    DashboardStats stats = response.body();
                    NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
                    tvTodaysRevenue.setText(formatter.format(stats.getTodaysRevenue()));
                    tvBillsGenerated.setText(String.valueOf(stats.getBillsGenerated()));
                    activityAdapter.setItems(stats.getRecentActivity());
                } else {
                    Toast.makeText(DashboardActivity.this, "Failed to update dashboard", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<DashboardStats> call, Throwable t) {
                swipeRefresh.setRefreshing(false);
                Toast.makeText(DashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadDashboardStats();
    }
}
