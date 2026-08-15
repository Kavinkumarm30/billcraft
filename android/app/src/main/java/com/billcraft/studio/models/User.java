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

    // Getters
    public int getId() { return id; }
    public String getUid() { return uid; }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public Integer getOrgId() { return orgId; }
    public String getSubscriptionStatus() { return subscriptionStatus; }
    public int getTrialInvoicesRemaining() { return trialInvoicesRemaining; }

    // Setters
    public void setId(int id) { this.id = id; }
    public void setUid(String uid) { this.uid = uid; }
    public void setEmail(String email) { this.email = email; }
    public void setName(String name) { this.name = name; }
    public void setRole(String role) { this.role = role; }
    public void setOrgId(Integer orgId) { this.orgId = orgId; }
    public void setSubscriptionStatus(String subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }
    public void setTrialInvoicesRemaining(int trialInvoicesRemaining) { this.trialInvoicesRemaining = trialInvoicesRemaining; }
}
