package com.billcraft.studio.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

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
    private TextView tvWelcomeName, tvUserEmail, tvUserAvatarLetter, tvPlanBadge;
    private TextView tvTodayRevenue, tvBillsGenerated, tvPendingBills, tvTotalCustomers;
    private View layoutTrialBanner;
    private TextView tvTrialRemaining;
    private RecentActivityAdapter activityAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        sessionManager = new SessionManager(this);

        tvWelcomeName = findViewById(R.id.tvWelcomeName);
        tvUserEmail = findViewById(R.id.tvUserEmail);
        tvUserAvatarLetter = findViewById(R.id.tvUserAvatarLetter);
        tvPlanBadge = findViewById(R.id.tvPlanBadge);

        tvTodayRevenue = findViewById(R.id.tvTodayRevenue);
        tvBillsGenerated = findViewById(R.id.tvBillsGenerated);
        tvPendingBills = findViewById(R.id.tvPendingBills);
        tvTotalCustomers = findViewById(R.id.tvTotalCustomers);

        layoutTrialBanner = findViewById(R.id.layoutTrialBanner);
        tvTrialRemaining = findViewById(R.id.tvTrialRemaining);

        RecyclerView rvRecentActivity = findViewById(R.id.rvRecentActivity);
        rvRecentActivity.setLayoutManager(new LinearLayoutManager(this));
        activityAdapter = new RecentActivityAdapter();
        rvRecentActivity.setAdapter(activityAdapter);

        // Populate user info matching Web Layout
        User user = sessionManager.getUser();
        if (user != null) {
            String displayName = user.getName() != null && !user.getName().isEmpty() ? user.getName() : "Studio Owner";
            tvWelcomeName.setText("Welcome back, " + displayName + " 👋");

            String email = user.getEmail() != null ? user.getEmail() : "user@billcraft.com";
            tvUserEmail.setText("Extract bills instantly with AI OCR or generate invoices in seconds");
            tvUserAvatarLetter.setText(email.substring(0, 1).toUpperCase());

            if ("ACTIVE".equalsIgnoreCase(user.getSubscriptionStatus())) {
                tvPlanBadge.setText("PRO");
                tvPlanBadge.setBackgroundResource(R.drawable.bg_stat_green_icon);
                tvPlanBadge.setTextColor(0xFF16A34A);
                layoutTrialBanner.setVisibility(View.GONE);
            } else {
                tvPlanBadge.setText("TRIAL");
                tvPlanBadge.setBackgroundResource(R.drawable.bg_stat_amber_icon);
                tvPlanBadge.setTextColor(0xFFB45309);
                layoutTrialBanner.setVisibility(View.VISIBLE);
                int remaining = user.getTrialInvoicesRemaining();
                tvTrialRemaining.setText((remaining > 0 ? remaining : 3) + " of 3 free AI OCR bills remaining");
            }
        }

        // Action Handlers
        findViewById(R.id.btnSnapBill).setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, MultiPageCameraActivity.class));
        });

        findViewById(R.id.navCreate).setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, MultiPageCameraActivity.class));
        });

        findViewById(R.id.btnViewAllInvoices).setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, InvoicesListActivity.class));
        });

        findViewById(R.id.navHistory).setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, InvoicesListActivity.class));
        });

        findViewById(R.id.navCustomers).setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, CustomersActivity.class));
        });

        findViewById(R.id.btnUpgradePro).setOnClickListener(v -> {
            Toast.makeText(this, "Opening Pro Plan upgrade...", Toast.LENGTH_SHORT).show();
        });

        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            FirebaseAuth.getInstance().signOut();
            sessionManager.clear();
            startActivity(new Intent(DashboardActivity.this, LoginActivity.class));
            finish();
        });

        loadDashboardStats();
    }

    private void loadDashboardStats() {
        ApiClient.getService(this).getDashboard().enqueue(new Callback<DashboardStats>() {
            @Override
            public void onResponse(Call<DashboardStats> call, Response<DashboardStats> response) {
                if (response.isSuccessful() && response.body() != null) {
                    DashboardStats stats = response.body();
                    NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
                    tvTodayRevenue.setText(formatter.format(stats.getTodaysRevenue()));
                    tvBillsGenerated.setText(String.valueOf(stats.getBillsGenerated()));
                    tvPendingBills.setText(String.valueOf(stats.getPendingBills()));
                    tvTotalCustomers.setText(String.valueOf(stats.getTotalCustomers()));
                    activityAdapter.setItems(stats.getRecentActivity());
                }
            }

            @Override
            public void onFailure(Call<DashboardStats> call, Throwable t) {
                // Silently fallback on cached values
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadDashboardStats();
    }
}
