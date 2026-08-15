package com.billcraft.studio.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;
import java.util.List;

public class DashboardStats implements Serializable {
    @SerializedName("todaysRevenue")
    private double todaysRevenue;

    @SerializedName("billsGenerated")
    private int billsGenerated;

    @SerializedName("pendingBills")
    private int pendingBills;

    @SerializedName("totalCustomers")
    private int totalCustomers;

    @SerializedName("recentActivity")
    private List<RecentActivityItem> recentActivity;

    public double getTodaysRevenue() { return todaysRevenue; }
    public int getBillsGenerated() { return billsGenerated; }
    public int getPendingBills() { return pendingBills; }
    public int getTotalCustomers() { return totalCustomers; }
    public List<RecentActivityItem> getRecentActivity() { return recentActivity; }

    public static class RecentActivityItem implements Serializable {
        @SerializedName("type")
        private String type;

        @SerializedName("title")
        private String title;

        @SerializedName("time")
        private String time;

        public String getType() { return type; }
        public String getTitle() { return title; }
        public String getTime() { return time; }
    }
}
