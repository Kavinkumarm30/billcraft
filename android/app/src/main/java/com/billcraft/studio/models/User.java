package com.billcraft.studio.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

public class User implements Serializable {
    @SerializedName("id")
    private int id;

    @SerializedName("uid")
    private String uid;

    @SerializedName("email")
    private String email;

    @SerializedName("name")
    private String name;

    @SerializedName("role")
    private String role;

    @SerializedName("orgId")
    private Integer orgId;

    @SerializedName("subscriptionStatus")
    private String subscriptionStatus;

    @SerializedName("trialInvoicesRemaining")
    private int trialInvoicesRemaining;

    // Getters and Setters
    public int getId() { return id; }
    public String getUid() { return uid; }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public Integer getOrgId() { return orgId; }
    public String getSubscriptionStatus() { return subscriptionStatus; }
    public int getTrialInvoicesRemaining() { return trialInvoicesRemaining; }
}
